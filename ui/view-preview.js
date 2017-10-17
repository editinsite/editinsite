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
		var content = file.body;

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
