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

		// Return existing or new ProjectFile object from the project's hierarchy.
		// It will verify that the file exists.
	    getFile: function (path, callback) {
			var project = this,
				file = project.root.getChildFile(path);
			if (file) {
				callback(file);
				return;
			}
			if (!path && path !== '')
				return;
			var parentPathEnd = path.lastIndexOf('/'),
				parentPath = path.slice(0, parentPathEnd+1),
				parent = project.root.getChildFile(parentPath),
				name = (parentPathEnd === -1) ? path : path.slice(parentPathEnd+1);
			if (parent) {
				callback(null);
				return;
			}
			this.listDir(parentPath, function (files) {
				if (files) {
					// dir's existence is verified, add to tree
					parent = project.root.addChildFile(parentPath);
					parent.setFileList(files);
					callback(parent.getChildFile(name));
				}
				else {
					callback(null);
				}
			});
		},

		listDir: function (path, callback) {
			if (path[0] !== '/') path = '/' + path;
			var dirUrl = '/projects/' + this.id + path;
			$.doOnce(dirUrl, callback, function (callback) {
				$.ajax({
					method: 'POST',
					url: dirUrl,
					dataType: 'json'
				})
				.done (function (files) {
					callback(files);
				})
				.fail (function () {
					callback(null);
				});
			});
		}
	};

})();
