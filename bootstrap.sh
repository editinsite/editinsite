#!/bin/bash

GOSOURCE=https://storage.googleapis.com/golang/go1.9.linux-amd64.tar.gz
GOTARGET=/usr/local
PROFILE=/home/ubuntu/.profile

# download Go tools to $GOTARGET/go
curl -sSL $GOSOURCE -o /tmp/go.tar.gz
tar -xf /tmp/go.tar.gz -C $GOTARGET
rm /tmp/go.tar.gz

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
su ubuntu -c "source ~/.profile && go install github.com/editinsite/editinsite/cmd/devserver"

# check for either directory or symlink to "ui" directory
if ! [ -d /home/ubuntu/bin/ui ]; then
  ln -s /home/ubuntu/src/github.com/editinsite/editinsite/ui /home/ubuntu/bin/ui
fi

# now daemonize the server
DAEMON=/lib/systemd/system/editinsite.service
printf "[Unit]\nDescription=EditInsite server\n\n" >> $DAEMON
printf "[Service]\nType=simple\nUser=ubuntu\nGroup=ubuntu\n" >> $DAEMON
printf "WorkingDirectory=/home/ubuntu/bin\nExecStart=/home/ubuntu/bin/devserver\n\n" >> $DAEMON
printf "[Install]\nWantedBy=multi-user.target" >> $DAEMON
systemctl enable editinsite
systemctl start editinsite
