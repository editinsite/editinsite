"use strict";

(function () {

$(function () {

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

		// IE uses contentWindow.document
		var iframe = document.getElementById('preview-frame'),
			doc = iframe.contentDocument || iframe.contentWindow.document;
		doc.open();
		doc.write(content);
		doc.close();
	});
}

function closePath () {

}

})();
