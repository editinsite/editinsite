package main

import (
	"fmt"
	"github.com/editinsite/editinsite/config"
	"github.com/editinsite/editinsite/httpserver"
)

func main() {
	config.Load()
	fmt.Printf("Starting server on port %d...\n", config.Values.Port)
	httpserver.Start()
}
