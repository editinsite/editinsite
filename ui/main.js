"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	getProjectList();
}

function registerEvents () {
	window.onpopstate = function (e) {
		router.setState(decodeURIComponent(window.location.pathname));
	};
}

function getProjectList () {
	projects.getList(function (projectList) {
		if (projectList) {
			projects.current = projectList[0];
			filesView.load();
			router.setState(decodeURIComponent(window.location.pathname));
		}
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
