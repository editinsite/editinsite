"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	router.refresh();
	menu.load();
}

function registerEvents () {
	window.onpopstate = function (e) {
		router.setState(decodeURIComponent(window.location.pathname));
	};
}

function checkReady () {
	if (window.monaco) {
		onLoad();
	}
}
require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], checkReady);
$(checkReady);

})();
