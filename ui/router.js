var router;

(function () {

var _events = {};

router = {
	// handleLinkClick will load an <a> element's href without refreshing
	// the page.
	handleLinkClick: function (e) {
		var path = this.getAttribute('href');
		if (this.target || path[0] !== '/')
			return;

		e.preventDefault();
		router.navTo(path);
	},

	// navTo will set the app state according to the given relative path,
	// and will add it to the browser history.
	navTo: function (path) {
		router.setState(path);
		router.addHistory(path);
	},

	// setState will set the app state according to the given relative path,
	// but will NOT alter the browser history.
	setState: function (path) {
		if (!path) path = '/';
		// TODO: check if already current state?
		var parts = path.split('/'),
			view = parts[1],
			project = parts[2];
		setState(project, view, parts.slice(3).join('/'));
	},

	// addHistory adds a relative URL path to the browser history, without
	// actually navigating to it.
	addHistory: function (path) {
		var oldPath = window.location.pathname;
		history.pushState({path: path}, '', path);
		router.publish('url-change', path, oldPath);
	},

	// refresh will reload the current state.
	refresh: function () {
		var path = window.location.pathname;
		router.setState(decodeURIComponent(path));
	},

	// publish a global event, plus any number of arguments, to all
	// registered handlers.
	publish: function (eventName, ...args) {
		var handlers = _events[eventName];
		if (handlers) {
			for (var i = handlers.length; i--;) {
				handlers[i].apply(null, args);
			}
		}
	},

	// subscribe a handler function to the given global event.
	subscribe: function (eventName, handler) {
		var handlers = _events[eventName];
		if (!handlers)
			handlers = _events[eventName] = [];
		handlers.push(handler);
	}
};

function setState (project, view, subPath) {

	function set () {
		view = views[view];
		view.openPath('/'+subPath);
		if (views.current !== view) {
			var old = views.current;
			views.current = view;
			router.publish('view-change', view, old);
		}
	}

	if (!projects.current || projects.current.id != project)
		setProject(project, set);
	else
		set();
}

function setProject (projectId, callback) {
	var old = projects.current;
	projects.current = null;
	projects.getList(function (projectList) {
		if (projectList) {
			for (var i = projectList.length; i--;) {
				if (projectList[i].id === projectId) {
					projects.current = projectList[i];
					router.publish('project-change', projects.current, old);
					callback && callback();
					return;
				}
			}
			// no project selected...
			router.navTo('/files/' + projectList[0].id + '/');
		}
	});
}

})();
