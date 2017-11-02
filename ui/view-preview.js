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
	router.subscribe('file-edit', fileEdit);
});

_view = views.preview = {
	openPath: openPath,
	closePath: closePath
};

function openPath (path) {
	// TODO: get existing instead of creating new.
	var file = new ProjectFile("index.html");
	openFile(file);
}

function closePath () {

}

function openFile (file) {
	file.liveContent(function (file, content) {
		sendMessage(sandboxContent(content));
	});
}

function sendMessage (msg) {
	var frame = frameWindow();
	frame.postMessage(msg, '*');//serverConfig.untrustedOrigin);
}

function receiveMessage (event) {
	if (event.origin !== serverConfig.untrustedOrigin)
		return;
	var msg = event.data;
	if (msg === 'load') {
		if (_view.path) openPath(_view.path);
	}
}

function fileEdit (file) {
	openFile(file);
}

function sandboxContent (content) {

	var contentL = content.toLowerCase(),
		headStart = contentL.indexOf('<head');
	if (headStart === -1) {
		alert('Page does not have a properly-formed <head>.');
		return;
	}
	headStart = contentL.indexOf('>', headStart)+1;

	var newHead = '<base href="' + window.location.origin + '/run/'
		+ projects.current.id + _view.path + '">\
	<script>\
	function receiveMessage(event) {\
		document.open();\
		document.write(event.data);\
		document.close();\
	}\
	window.addEventListener("message", receiveMessage, false);\
	</script>';

	content = content.slice(0, headStart)
		+ newHead
		+ content.slice(headStart);

	return content;
}

function frameWindow () {
	var iframe = document.getElementById('preview-frame');
	return iframe.contentWindow || iframe;
}

})();
