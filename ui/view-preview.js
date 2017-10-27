"use strict";

/* TODO:
  1. warn user if unable to talk to iframe page, give option to
     trust content (use same domain).
*/

(function () {

var _view, _path;

$(function () {
	window.addEventListener("message", receiveMessage, false);
	frameWindow().location = serverConfig.untrustedOrigin;
});

_view = views.preview = {
	openPath: openPath,
	closePath: closePath
};

function openPath (path) {
	var file = new ProjectFile("index.html");
	file.download(function (file) {
		var content = file.body,
			contentL = content.toLowerCase(),
			headStart = contentL.indexOf('<head');
		if (headStart === -1) {
			alert('Page does not have a properly-formed <head>.');
			return;
		}
		headStart = contentL.indexOf('>', headStart)+1;

		content = content.slice(0, headStart)
			+ '<base href="' + window.location.href.replace('/preview/', '/run/') + '">'
			+ content.slice(headStart);

		var frame = frameWindow();
		frame.postMessage(content, serverConfig.untrustedOrigin);
	});
}

function closePath () {

}

function receiveMessage (event) {
	if (event.origin !== serverConfig.untrustedOrigin)
		return;
	var msg = event.data;
	if (msg === 'load') {
		if (_view.path) openPath(_view.path);
	}
}

function frameWindow () {
	var iframe = document.getElementById('preview-frame');
	return iframe.contentWindow || iframe;
}

})();
