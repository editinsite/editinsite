"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	getProjectList();
}

function registerEvents () {
	window.onpopstate = function (e) {
		router.setState(e.state ? e.state.path : null);
	};
}

function getProjectList () {
	projects.getList(function (projectList) {
		projects.current = projectList[0];
		filesView.load();

		// See https://developer.mozilla.org/en-US/docs/Web/API/History_API#Reading_the_current_state
		if (history.state)
			router.setState(history.state.path);
		else
			router.setState(null);
	});
}

(function () {
	function checkReady () {
		$(function () {
			if (window.monaco) {
				onLoad();
			}
		});
	}
	require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
	require(['vs/editor/editor.main'], checkReady);
	$(checkReady);
})();

})();
