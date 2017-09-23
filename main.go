package main

import (
	"fmt"
	"log"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/httpserver"
	"github.com/editinsite/editinsite/projects"

	// Disable sendfile when using VirtualBox, thanks to the infamous sendfile bug.
	// See https://stackoverflow.com/questions/20702221
	_ "github.com/wader/disable_sendfile_vbox_linux"
)

func main() {
	if err := config.Load(); err != nil {
		log.Printf("The %s file could not be loaded, defaults will be used: %v", config.File, err)
	}
	projects.LoadAll(config.Values.Projects)
	fmt.Printf("Starting server on port %d...\n", config.Values.Port)
	log.Fatal(httpserver.Start())
}
