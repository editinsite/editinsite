package main

import (
	"fmt"
	"log"

	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/httpserver"
	"github.com/editinsite/editinsite/project"
)

func main() {
	if err := config.Load(); err != nil {
		log.Printf("The %s file has an error, defaults will be used: %v", config.File, err)
	}
	project.LoadAll(config.Values.Projects)
	fmt.Printf("Starting server on port %d...\n", config.Values.Port)
	log.Fatal(httpserver.Start())
}
