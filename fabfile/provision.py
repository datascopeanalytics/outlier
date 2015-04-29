"""
Functions for provisioning environments with fabtools (eat shit puppet!)
"""
# standard library
import sys
import copy
import os
from distutils.util import strtobool

# 3rd party
import fabric
from fabric.context_managers import quiet
from fabric.api import env, task, local, run, settings, cd, sudo, lcd
import fabtools
from fabtools.vagrant import vagrant_settings

# local
import decorators
import utils

@task
@decorators.needs_environment
def apt_get_update(max_age=86400*7):
    """refresh apt-get index if its more than max_age out of date
    """
    try:
        fabtools.require.deb.uptodate_index(max_age=max_age)
    except AttributeError:
        msg = (
            "Looks like your fabtools is out of date. "
            "Try updating fabtools first:\n"
            "    sudo pip install fabtools==0.17.0"
        )
        raise Exception(msg)


@task
@decorators.needs_environment
def debian_packages():
    """install debian packages"""

    # get the list of packages
    filename = os.path.join(utils.requirements_root(), "debian")
    with open(filename, 'r') as stream:
        packages = stream.read().strip().splitlines()

    # install them all with fabtools.
    fabtools.require.deb.packages(packages)


@task
@decorators.needs_environment
def fetch_repo():
    """Fetch and update the working copy of a git repository."""

    sudo("mkdir -p $(dirname %(remote_path)s)" % env)
    sudo("chown %(user)s $(dirname %(remote_path)s)" % env)

    # need to add your public key to github for this to work properly
    # the first time through. as a temporary workaround, you should
    # just clone the repo by hand using the https protocol


    # this will avoid prompt for known hosts the first time
    # echo -e "Host github.com\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
    fabtools.require.git.working_copy(
        env.repository_path,
        path=env.remote_path,
        branch=env.branch,
        use_sudo=True,
        user=env.user,
        update=True,
    )

@task
@decorators.needs_environment
def python_packages():
    """install python packages"""
    filename = os.path.join(utils.remote_requirements_root(), "python")
    fabtools.require.python.requirements(filename, use_sudo=True)


@task
@decorators.needs_environment
def ruby_packages():
    """install debian packages"""
    with settings(warn_only=True):
        bundler = run('which bundler')
    if bundler.return_code:
        sudo('gem install bundler')
    filename = os.path.join(utils.remote_requirements_root(), "ruby")
    run('bundle install --gemfile=%s' % filename)


@task
@decorators.needs_environment
def packages():
    """install all packages"""
    debian_packages()
    if env.use_repository:
        fetch_repo()
    python_packages()
    ruby_packages()


@task
@decorators.needs_environment
def setup_bash():
    """setup the shell environment on the remote machine"""

    # move our template over
    template = os.path.join(utils.fabfile_templates_root(), "bash_profile")
    context = locals()
    context.update(env)
    fabtools.require.files.template_file(
        path="/home/%s/.bash_profile" % env.user,
        template_source=template,
        context=context,
    )


def set_timezone(timezone='America/Chicago', restart_services=()):
    """Set system timezone, and optional require a list of services to be
    restarted. See:
    https://github.com/ronnix/fabtools/issues/142
    http://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    http://askubuntu.com/a/41616/76346

    """
    fabtools.utils.run_as_root('echo "%s" > /etc/timezone' % timezone)
    fabtools.utils.run_as_root('dpkg-reconfigure --frontend noninteractive tzdata')
    for service in restart_services:
        fabtools.require.service.restarted(service)


def require_timezone(timezone='America/Chicago', restart_services=()):
    """See docstring for set_timezone."""

    # grep the /etc/timezone file to check if it's set
    command = 'grep -q "^%s$" /etc/timezone' % timezone
    with quiet():
        result = run(command)

    # don't do anything if time zone is already set correctly
    if result.return_code == 0:
        return None

    # set timezone if needed
    elif result.return_code == 1:
        set_timezone(timezone, restart_services=restart_services)

    # don't know how this would happen
    else:
        msg = "Unexpected return code '%s' from '%s'" % \
            (result.return_code, command)
        raise FabricException(msg)


@task
@decorators.needs_environment
def setup_apache():

    template = os.path.join(
        utils.fabfile_templates_root(),
        "apache.%s.conf" % env.config_type,
    )

    # require that apache is set up with modwsgi
    fabtools.require.apache.server()
    fabtools.require.deb.package('libapache2-mod-wsgi')
    fabtools.require.apache.module_enabled("wsgi")
    fabtools.require.apache.module_enabled("rewrite")
    fabtools.require.apache.module_enabled("expires")

    # enable site with the given configuration
    fabtools.require.apache.site(
        env.site_name,
        template_source=template,
        site_name=env.site_name,
        site_root=os.path.join(env.web_path),
    )
    fabtools.require.apache.disabled('000-default')

    # set permissions so that apache can read/write
    sudo("chgrp -R www-data %s" % env.remote_path)
    sudo("chmod -R g+w %s" % env.remote_path)


@task
@decorators.needs_environment
def compile_scss():
    with cd(env.web_path):
        run("sass -fC --scss --update assets/scss/:static/css")


@task
@decorators.needs_environment
def rsync_dropbox():
    host_name = env.host_string
    remote_project_root = utils.remote_project_root()
    local("rsync -avz Dropbox/ %(host_name)s:%(remote_project_root)s/Dropbox/" % locals())


@task(default=True)
@decorators.needs_environment
def default():
    """run all provisioning tasks"""

    # run all of these provisioning tasks in the order specified here
    apt_get_update()

    # install debian packages first to make sure any compiling python
    # packages have necessary dependencies
    packages()

    # set time zone
    require_timezone()

    # set up anything else that should be done on the virtual machine
    # to get it into the same state for everyone
    setup_bash()

    if env.site_name:
        setup_apache()
        rsync_dropbox()
        compile_scss()
