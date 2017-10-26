"use strict";

/* TODO:
  1. warn user if unable to talk to iframe page, give option to
     trust content (use same domain).
*/

(function () {

$(function () {
	frameElement().onload = frameLoaded();
	frameWindow().location = serverConfig.untrustedOrigin;
});

views.preview = {
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

function frameLoaded () {
	frameElement().onload = null; // only once
}

function frameElement () {
	return document.getElementById('preview-frame');
}

function frameWindow () {
	var iframe = frameElement();
	return iframe.contentWindow || iframe;
}

})();
