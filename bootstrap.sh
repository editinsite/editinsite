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

# switch to the "ubuntu" user to do the rest
# run the "export"s in .profile to apply to current session; start server
su ubuntu -c "source ~/.profile && bash \$GOPATH/src/github.com/editinsite/editinsite/runserver.sh"
