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
	};

	Project.prototype = {
	    getFileList: function (subDir, callback) {
			$.ajax({
				method: 'POST',
				url: this.rawUrl(subDir),
				dataType: 'json'
			})
			.done (function (files) {
				var fileList = fileListFromNames(files, subDir);
				callback(fileList);
			})
			.fail (function () {
				callback(null);
			});
		},

		fileUrl: function (file) {
			return file ? (this.fileUrl(file.parent) + file.name)
				: (this.id + '/');
		},

		rawUrl: function (file) {
			return '/projects/' + this.fileUrl(file);
		},

		editUrl: function (file) {
			return '/files/' + this.fileUrl(file);
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
