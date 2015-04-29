import os

from fabric.api import env, task, execute, run
from fabtools.vagrant import vagrant

import utils
import provision


# shared environment between local machines and remote machines
# (anything that is different gets overwritten in environment-setting
# functions)
env.repository_path = 'git@github.com:datascopeanalytics/outlier.git'
env.ssh_directory = os.path.expanduser(os.path.join('~', '.ssh'))


@task
def prod():
    env.provider = "digitalocean"
    env.remote_path = '/srv/www/outlier'
    env.web_path = env.remote_path + '/web'
    env.config_type = 'production'
    env.branch = 'master'
    env.use_repository = True
    env.site_name = 'outlier.datasco.pe'

    utils.set_env_with_ssh('outlier')
