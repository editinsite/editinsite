"use strict";

var ProjectFile;

(function () {

	ProjectFile = function (name, parentOrProject, attributes) {
		this.name = name;
		if (parentOrProject.isDir)
			this.parent = parentOrProject;
		else
			this.project = parentOrProject;
		this.isDir = name[name.length-1] === '/';
		if (this.isDir) {
			this.children = null;
			this._loaded = false;
		}
		else
			this.lang = fileLanguageFromName(name);
		$.extend(this, attributes);
	};

	ProjectFile.prototype = {

		savedContent: function (callback) {
			if (this.body) {
				callback(this, this.body);
				return;
			}
			this.download(callback);
		},

		liveContent: function (callback) {
			if (this.model) {
				var body = this.model.getValue();
				callback(this, body);
				return;
			}
			this.savedContent(callback);
		},

		download: function (callback) {
			var file = this,
				url = file.rawUrl(),
				oReq = new XMLHttpRequest();

			oReq.onload = function () {
				if (this.status == 200) {
					var arrayBuffer = oReq.response,
						contentType = oReq.getResponseHeader("Content-Type");

					// Unfortunately "charset" is not always provided, so manual check as well.
					if (contentType.indexOf('charset=utf-8') !== -1 || isUtf8(arrayBuffer)) {
						var dataView = new DataView(oReq.response),
							decoder = new TextDecoder('utf-8');
						file.bodyType = 'text';
						file.body = decoder.decode(dataView);
					}
					else {
						var blob = makeBlob(arrayBuffer, contentType);
						if (blob) {
							file.bodyType = 'blob';
							file.body = blob;
						}
					}
					callback(file, file.body);
				}
				else
					callback(null);
			};

			oReq.open('GET', url);
			oReq.responseType = 'arraybuffer';
			oReq.send();
		},
 
		upload: function (callback) {
			var url = this.rawUrl(),
				oReq = new XMLHttpRequest();
			oReq.onload = callback;
			oReq.open('POST', url);
			oReq.send(new TextEncoder().encode(this.body));
		},

		getFileList: function (callback) {
			var dir = this;
			if (dir._loaded) {
				callback(dir.children);
				return;
			}
			dir.getProject().listDir(dir.pathInProject(), function (files) {
				if (files) {
					files = dir.setFileList(files);
				}
				callback(files);
			});
		},

		setFileList: function (namesList) {
			var fileList = this.children || [];
			for (var i = 0; i < namesList.length; i++) {
				var name = namesList[i],
					lname = name.toLowerCase();
				if (this.children) {
					for (var j = fileList.length; j--;) {
						if (fileList[j].name.toLowerCase() === lname) {
							fileList[j].name = name;
							break;
						}
					}
					if (j >= 0) continue;
				}
				fileList.push(new ProjectFile(name, this));
			}
			sortFiles(fileList);
			this.children = fileList;
			this._loaded = true;
			return fileList;
		},

		getChildFile: function (path) {
			return getChild(this, path, false);
		},

		addChildFile: function (path) {
			return getChild(this, path, true);
		},

		pathInProject: function () {
			return this.parent ? (this.parent.pathInProject() + this.name)
				: this.name;
		},

		pathWithProject: function () {
			return this.parent ? (this.parent.pathWithProject() + this.name)
			: this.project.id + this.name;
		},

		rawUrl: function () {
			return '/projects/' + this.pathWithProject();
		},

		editUrl: function () {
			return '/files/' + this.pathWithProject();
		},

		getProject: function () {
			return this.project || this.parent.project();
		}
	};

	function makeBlob (buffer, contentType) {
		var mimeType = contentType,
			mimeEnd = contentType.indexOf(';');
		if (mimeEnd !== -1)
			mimeType = contentType.slice(0, mimeEnd);
		return new Blob([buffer], {type: mimeType});
	}

	function fileLanguageFromName (fileName) {
		var ext, extStart = fileName.lastIndexOf('.');
		if (extStart !== -1) {
			ext = fileName.slice(extStart).toLowerCase();
		}
		var exts = _fileExts || loadFileExts();
		return ext && exts[ext] || exts['.txt'];
	}

	var _fileExts;
	function loadFileExts () {
		_fileExts = {};
		var languages = monaco.languages.getLanguages();
		for (var l = languages.length; l--;) {
			var language = languages[l];
			for (var e = language.extensions.length; e--;) {
				var ext = language.extensions[e];
				_fileExts[ext] = language;
			}
		}
		return _fileExts;
	}

	// Returns true if the data in the ArrayBuffer is UTF-8 text.
	function isUtf8 (buffer) {
		// Adapted from https://mimesniff.spec.whatwg.org/ "binary data byte"
		var view = new Uint8Array(buffer),
			check = Math.min(256, buffer.byteLength);
		for (var i = 0; i < check; i++) {
			var b = view[i];
			if (b <= 0x08 || b == 0x0B || (b >= 0x0E && b <= 0x1A) || (b >= 0x1C && b <= 0x1F))
				return false;
		}
		return true;
	}

	function sortFiles (fileList) {
		fileList.sort(function(a, b) {
			var lastCh = a[a.length-1];
			if (a.isDir !== b.isDir) {
				return a.isDir ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
	}

	// Get or add ProjectFile at `path` relative to `dir`.
	function getChild (dir, path, addMissing) {
		if (!path && path !== '') return;
		while (path[0] === '/') path = path.slice(1);
		if (path.length === 0) return dir;

		var nextPartEnd = path.indexOf('/')+1,
			nextPartName, remainingPath;
		if (nextPartEnd === 0) {
			nextPartName = path;
			remainingPath = null;
		}
		else {
			nextPartName = path.slice(0, nextPartEnd);
			remainingPath = path.slice(nextPartEnd);
		}
		nextPartName = nextPartName.toLowerCase();

		var nextPart;
		if (dir.children) {
			for (var i = dir.children.length; i--;) {
				if (dir.children[i].name.toLowerCase() === nextPartName) {
					nextPart = dir.children[i];
					break;
				}
			}
		}
		if (!nextPart) {
			if (!addMissing) return;
			dir.children = dir.children || [];
			nextPart = new ProjectFile(nextPart, dir);
			dir.children.push(nextPart);
		}

		return remainingPath ?
			getChild(nextPart, remainingPath, addMissing)
			: nextPart;
	}

})();
