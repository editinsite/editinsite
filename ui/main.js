"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	getProjectList();
}

function registerEvents () {
}

function getProjectList () {
	projects.getList(function (projectList) {
		projects.current = projectList[0];
		filesView.load();
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
	require.config({ paths: { 'vs': 'monaco-editor/min/vs' }});
	require(['vs/editor/editor.main'], checkReady);
	$(checkReady);
})();

})();
