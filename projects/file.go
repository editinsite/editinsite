// Files within a web development project.
package projects

import (
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

// TODO:
// - cache metadata in Files()? (for ServeFile, IsDir)

// Files returns an alphabetical list of files and directories at the workspace root
// or given sub-directory.
func (w *Workspace) Files(subDir string) ([]string, error) {
	path := filepath.Join(w.Path, subDir)
	files, err := ioutil.ReadDir(path)
	if err != nil {
		return nil, err
	}
	fileList := []string{}
	for _, f := range files {
		name := f.Name()
		if f.IsDir() {
			name += "/"
		}
		fileList = append(fileList, name)
	}
	return fileList, nil
}

func (w *Workspace) ServeFile(wtr http.ResponseWriter, req *http.Request, path string) error {
	path = filepath.Join(w.Path, path)
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	http.ServeContent(wtr, req, info.Name(), info.ModTime(), file)
	return nil
}

func (w *Workspace) LoadFile(path string, dst io.Writer) error {
	path = filepath.Join(w.Path, path)
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	if _, err = io.Copy(dst, file); err != nil {
		return err
	}
	return nil
}

func (w *Workspace) SaveFile(path string, src io.Reader) (err error) {
	path = filepath.Join(w.Path, path)
	file, err := os.Create(path)
	if err != nil {
		return
	}
	defer func() {
		cerr := file.Close()
		if err == nil {
			err = cerr
		}
	}()
	if _, err = io.Copy(file, src); err != nil {
		return
	}
	err = file.Sync()
	return
}

func (w *Workspace) IsDir(path string) (bool, error) {
	path = filepath.Join(w.Path, path)
	file, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	return file.IsDir(), nil
}
