package main

import (
	"fmt"
	"log"
	"os"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/httpserver"
	"github.com/editinsite/editinsite/projects"

	// Disable sendfile when using VirtualBox, thanks to the infamous sendfile bug.
	// See https://stackoverflow.com/questions/20702221
	_ "github.com/wader/disable_sendfile_vbox_linux"
)

func main() {
	if err := config.ParseFlags(); err != nil {
		// Error message already shown with usage details
		if err == config.ErrHelp {
			return
		}
		os.Exit(1)
	}
	if err := config.Apply(); err != nil {
		fmt.Printf("%v\n", err)
		return
	}
	if err := config.LoadFromFile(config.Values.File); err == nil {
		fmt.Printf("Loaded configuration from %s\n", config.Values.File)
	} else if err != config.ErrNoFile {
		fmt.Printf("Config file could not be loaded, defaults will be used: %v\n", err)
	}
	projects.LoadAll(config.Values.Projects)
	fmt.Printf("Starting EditInsite v%s server on port %d...\n",
		config.Version, config.Values.Port)
	go func() {
		httpserver.StartUntrusted()
	}()
	if err := httpserver.Start(); err != nil {
		log.Fatalf("%v\n", err)
	}
}
