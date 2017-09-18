#!/bin/bash

NODESOURCE=https://deb.nodesource.com/setup_6.x
GOSOURCE=https://storage.googleapis.com/golang/go1.9.linux-amd64.tar.gz
GOTARGET=/usr/local
PROFILE=/home/ubuntu/.profile

export DEBIAN_FRONTEND=noninteractive

# download Go tools to $GOTARGET/go
echo "Installing Golang..."
curl -sSL $GOSOURCE -o /tmp/go.tar.gz
tar -xf /tmp/go.tar.gz -C $GOTARGET
rm /tmp/go.tar.gz

# Use most recent stable Node.js
echo "Registering Node.js source..."
curl -sSL $NODESOURCE -o /tmp/nodesource_setup.sh
bash /tmp/nodesource_setup.sh > /dev/null
rm /tmp/nodesource_setup.sh

apt-get -qq update > /dev/null

# Now install packages
echo "Installing Node.js..."
apt-get -qq install nodejs > /dev/null

# apply Go environment configuration to the user's .profile
printf "\n" >> $PROFILE
printf "# golang configuration\n" >> $PROFILE
printf "export GOROOT=$GOTARGET/go\n" >> $PROFILE
printf "export GOPATH=\$HOME\n" >> $PROFILE
printf "export PATH=\$PATH:$GOTARGET/go/bin\n" >> $PROFILE

chown ubuntu:ubuntu /home/ubuntu/src
chown ubuntu:ubuntu /home/ubuntu/src/github.com
chown ubuntu:ubuntu /home/ubuntu/src/github.com/editinsite

# switch to the "ubuntu" user to do the build
# run the "export"s in .profile to apply to current session
echo "Compiling EditInsite server..."
su ubuntu -c "source ~/.profile && go install github.com/editinsite/editinsite"

# check for either directory or symlink to "ui" directory
if ! [ -d /home/ubuntu/bin/ui ]; then
  ln -s /home/ubuntu/src/github.com/editinsite/editinsite/ui /home/ubuntu/bin/ui
fi
if ! [ -d /home/ubuntu/bin/editinsite.json ]; then
  ln -s /home/ubuntu/src/github.com/editinsite/editinsite/editinsite.json /home/ubuntu/bin/editinsite.json
fi

# now daemonize the server
echo "Starting server..."
DAEMON=/lib/systemd/system/editinsite.service
printf "[Unit]\nDescription=EditInsite server\n\n" >> $DAEMON
printf "[Service]\nType=simple\nUser=ubuntu\nGroup=ubuntu\n" >> $DAEMON
printf "WorkingDirectory=/home/ubuntu/bin\nExecStart=/home/ubuntu/bin/editinsite\n\n" >> $DAEMON
printf "[Install]\nWantedBy=multi-user.target" >> $DAEMON
systemctl enable editinsite
systemctl start editinsite
