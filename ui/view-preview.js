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
		// IE uses contentWindow.document
		var iframe = document.getElementById('preview-frame'),
			doc = iframe.contentDocument || iframe.contentWindow.document;
		doc.getElementsByTagName('html')[0].innerHTML = file.body;
	});
}

function closePath () {

}

})();
