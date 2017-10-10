# EditInsite
Develop web sites and apps in real-time, from your browser.

This project was just started on Sept. 9, but it will be progressing quickly.
Please watch this space for updates.

### Get running

EditInsite consists of a server that you download and run in your project's folder:

1. If you want to keep your local machine tidy, download and install [VirtualBox](https://www.virtualbox.org/) and [Vagrant](http://www.vagrantup.com/downloads.html) in order to run the server in a VM.
2. [Download](https://github.com/editinsite/editinsite/archive/master.zip) or clone this repository.
3. Place your project files in the `example` directory.
4. Start the development server VM:
```
    $ vagrant up
```
5. Access the development environment in your browser at [http://localhost:8080](http://localhost:8080).

### Current/upcoming features
- [x] Open and edit project text files in your browser.
- [ ] View a preview of your site as you save changes.
- [ ] Edit HTML visually.
- [ ] Edit CSS visually.
- [ ] Jump between an HTML element and its relevant JavaScript code.
