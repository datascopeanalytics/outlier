## Quickstart

First time here?

1. `mkvirtualenv outlier`

2. `pip install -r requirements/python`

3. Add soft link to Dropbox folder with `ln -s ~/Dropbox/UofC-Outlier/ Dropbox`

4. To start flask app, `cd web && python web.py`


Already set up?

1. `workon outlier`

2. `cd web'

3. 'python web.py`


Want to freeze documents?

1. `workon outlier`

2. `cd web'

3. 'python web.py build`

Note: Frozen documents will now be in the build folder


## Provisioning production

We're going to try having one person provision the production server for the
sake of simplicity (and because I've heard its generally a good idea). Ask
@deanmalmgren to do it for you. All he has to do is
`git pull && git push && fab prod provision`.

If it makes sense to give another person the ability to provision, we'll need
to:

1. Add a user (`TKTK`) to the `outlier` server as root. Be sure to give `TKTK`
   sudo permissions.

   ```sh
   sudo adduser TKTK
   sudo adduser TKTK sudo
   ```

2. Setup automatic ssh for user `TKTK` from their local machine to the remote
   `outlier` machine.

   ```sh
   echo -e "Host outlier\n\tHostName 45.55.218.200\n\tUser TKTK\n" >> ~/.ssh/config
   ~/Codes/LENS/bin/setup_automatic_ssh.sh outlier
   ```

3. Add ssh key to github for the `outlier` server on DigitalOcean. ssh to `outlier`
   and [follow the
   instructions](https://help.github.com/articles/generating-ssh-keys/)

4. From your local laptop, run the command above.
