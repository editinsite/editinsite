// Disable sendfile when using VirtualBox, thanks to the infamous sendfile bug.
// See https://stackoverflow.com/questions/20702221
package main

// Import is from https://github.com/wader/disable_sendfile_vbox_linux
import _ "github.com/editinsite/editinsite/thirdparty/disable_sendfile_vbox_linux"
