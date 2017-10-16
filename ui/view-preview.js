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
		var content = file.body.toLowerCase(),
			bodyStart = content.indexOf('<body'),
			bodyEnd = content.lastIndexOf('body>');
		if (bodyStart === -1 || bodyEnd === -1) {
			alert('Page does not have a properly-formed body.');
			return;
		}
		bodyStart = content.indexOf('>', bodyStart)+1;
		bodyEnd += 5;

		// IE uses contentWindow.document
		var iframe = document.getElementById('preview-frame'),
			doc = iframe.contentDocument || iframe.contentWindow.document;
		doc.getElementsByTagName('div')[0].innerHTML = file.body.slice(bodyStart, bodyEnd);
	});
}

function closePath () {

}

})();
