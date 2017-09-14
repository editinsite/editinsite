#!/bin/bash

# install and run the devserver

go install github.com/editinsite/editinsite/cmd/devserver

# check for either directory or symlink to "ui" directory
if ! [ -d $GOPATH/bin/ui ]; then
  ln -s $GOPATH/src/github.com/editinsite/editinsite/ui $GOPATH/bin/ui
fi

cd $GOPATH/bin
devserver &
