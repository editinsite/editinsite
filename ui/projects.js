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

			oReq.onload = function (oEvent) {
				file.body = oReq.response;
				callback(file);
			};

			oReq.open("GET", this.fileUrl(file));
			oReq.responseType = "text";
			oReq.send();
		},
 
		uploadFile: function (file, callback) {
			var oReq = new XMLHttpRequest();
			oReq.onload = callback;
			oReq.open("POST", this.fileUrl(file));
			oReq.send(new Blob([file.body], { type: 'text/plain' }));
		},

		fileUrl: function (file) {
			return file ? (this.fileUrl(file.parent) + file.name)
				: ('/projects/' + this.id + '/');
		}
	};

	function fileTypeFromName (fileName) {
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
				type: fileTypeFromName(name)
			});
		}
		sortFiles(fileList);
		return fileList;
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
})();
