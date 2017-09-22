"use strict";

var projects, Project;

(function () {

	projects = {
		getList: function (callback) {
			$.getJSON('/projects/', function (projects) {
				for (var i = projects.length; i--;)
					projects[i] = new Project(projects[i]);
				callback(projects);
			});
		}
	};

	Project = function (params) {
		$.extend(this, params);
	};

	Project.prototype = {
	    getFileList: function (subDir, callback) {
			var fileList;

			function returnList () {
				if (fileList && window.monaco) {
					fileList = fileListFromNames(fileList, subDir);
					callback(fileList);
				}
			}

			if (!window.monaco) {
				require(['vs/editor/editor.main'], returnList);
			}
			$.getJSON(this.fileUrl(subDir), function (files) {
				fileList = files;
				returnList();
			});
		},

		downloadFile: function (file, callback) {
			var oReq = new XMLHttpRequest();

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
					callback(file);
				}
				else
					callback(null);
			};

			oReq.open('GET', this.fileUrl(file));
			oReq.responseType = 'arraybuffer';
			oReq.send();
		},
 
		uploadFile: function (file, callback) {
			var oReq = new XMLHttpRequest();
			oReq.onload = callback;
			oReq.open('POST', this.fileUrl(file));
			oReq.send(new TextEncoder().encode(file.body));
		},

		fileUrl: function (file) {
			return file ? (this.fileUrl(file.parent) + file.name)
				: ('/projects/' + this.id + '/');
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

	function fileListFromNames (nameList, parentDir) {
		var fileList = [];
		for (var i = 0; i < nameList.length; i++) {
			var name = nameList[i];
			fileList.push({
				name: name,
				parent: parentDir,
				isDir: name[name.length-1] === '/',
				lang: fileLanguageFromName(name)
			});
		}
		sortFiles(fileList);
		return fileList;
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

	function sortFiles (fileList) {
		fileList.sort(function(a, b) {
			var lastCh = a[a.length-1];
			if (a.isDir !== b.isDir) {
				return a.isDir ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
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

})();
