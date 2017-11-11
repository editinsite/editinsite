"use strict";

var projects;

(function () {

	var _list;

	projects = {
		getList: function (callback) {
			if (_list) {
				callback(_list);
				return;
			}
			$.doOnce('/projects/', callback, function (callback) {
				$.ajax({
					method: 'POST',
					url: '/projects/',
					dataType: 'json'
				})
				.done (function (projects) {
					for (var i = projects.length; i--;)
						projects[i] = new Project(projects[i]);
					_list = projects;
					callback(projects);
				})
				.fail (function () {
					callback(null);
				});
			});
		},
		current: null
	};

	var Project = function (attributes) {
		$.extend(this, attributes);
		this.root = new ProjectFile('/', this);
		this.root.project = this;
	};

	Project.prototype = {
	    getFileList: function (subDir, callback) {
			subDir = subDir || this.root;
			$.ajax({
				method: 'POST',
				url: subDir.rawUrl(),
				dataType: 'json'
			})
			.done (function (files) {
				var fileList = fileListFromNames(files, subDir);
				callback(fileList);
			})
			.fail (function () {
				callback(null);
			});
		}
	};

	function fileListFromNames (nameList, parentDir) {
		var fileList = [];
		for (var i = 0; i < nameList.length; i++) {
			var name = nameList[i];
			fileList.push(new ProjectFile(name, parentDir));
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

})();
