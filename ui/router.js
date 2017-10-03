var router = {
	handleLinkClick: function (e) {
		if (this.target || this.href[0] !== '/')
			return;

		e.preventDefault();
		router.navTo(this.href);
	},

	navTo: function (path) {
		router.setState(path);
		router.addHistory(path);
	},

	setState: function (path) {
		if (!path) path = '/';
		// TODO: check if already current state?
		var parts = path.split('/');
		var action = parts[1];
		if (action) {
			var project = parts[2];
			if (action === 'edit') {
				filesView.open('/'+parts.slice(3).join('/'))
			}
		}
	},

	addHistory: function (path) {
		history.pushState({path: path}, '', path);
	}
};
