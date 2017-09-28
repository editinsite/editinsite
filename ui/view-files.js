"use strict";

var filesView;

(function () {

var _editor, _currFile;

$(function () {
	$('#files').on('click', 'a', fileNameClick);
	$('input[type=submit]').click(saveFile);
	$(window).resize(onResize);
});

filesView = {

	load: function () {
		getFileList($('#files'));
	}
};

function getFileList ($listParent, subDir) {
	projects.current.getFileList(subDir, function (fileList) {
		var $list = $('<ul class="filelist"></ul>');
		for (var i = 0; i < fileList.length; i++) {
			var file = fileList[i],
				icon = '';
			if (file.isDir)
				icon = '<i class="far fa-angle-right"></i>';
			$('<li></li>').append(
				$('<a class="filelink" href="' + projects.current.fileUrl(file)
					+ '">' + icon + file.name + '</a>')
					.data('file', file)
			).appendTo($list);
		}
		$list.appendTo($listParent);
	});
}

function projectSelectClick (e) {
	e.preventDefault();

	var $list = $('#project-select-list ul').empty();
	for (var i = 0; i < _projects.length; i++) {
		var p = _projects[i];
		$list.append('<li><a href="/"' + p.id + '>' + p.name + '</li>');
	}
}

function fileNameClick (e) {
	e.preventDefault();

	var $fileLink = $(this),
		file = $fileLink.data('file');
	if (file.isDir) {
		var $fileLI = $fileLink.parent(),
			$fileList = $fileLI.children('.filelist');
		if ($fileLink.hasClass('expanded'))
			$fileList.hide();
		else {
			if ($fileList.length)
				$fileList.show();
			else
				getFileList($fileLI, file);
		}
		$fileLink.toggleClass('expanded');
	}
	else {
		if (!$fileLink.hasClass('selected')) {
			$('#files .selected').removeClass('selected');
			$fileLink.addClass('selected');
			openFile(file);
		}
	}
}

function openFile (file) {
	_currFile = file;
	$('.loading.editor').loading(true);
	file.download(function (file) {
		$('.loading.editor').loading(false);
		showInEditor(file);
	});
}

function saveFile (e) {
	e && e.preventDefault();

	if (_editor) {
		$('input[type=submit]').text('Saving...');
		_currFile.body = _editor.getValue();
		_currFile.upload(function () {
			$('input[type=submit]').text('Save');
		});
	}
}

function onResize () {
	if (_editor) {
		_editor.layout();
	}
}

function showInEditor (file) {
	if (!file || file.bodyType !== 'text') {
		if (_editor) {
			if (_editor.getModel()) {
				_editor.getModel().dispose();
			}
			_editor.dispose();
			_editor = null;
		}
		var body = renderBlob(file && file.body);
		$('#editor').empty().append(body);
		return;
	}

	if (!_editor) {
		$('#editor').empty();
		_editor = monaco.editor.create(document.getElementById('editor'), {
			model: null,
			theme: 'vs-dark'
		});
	}

	var oldModel = _editor.getModel();
	var newModel = monaco.editor.createModel(file.body, file.lang.id);
	_editor.setModel(newModel);
	if (oldModel) {
		oldModel.dispose();
	}
}

function renderBlob (blob) {
	var link = '';
	if (blob) {
		var url = URL.createObjectURL(blob),
			type = blob.type,
			typeEnd = type.indexOf('/');
		if (typeEnd !== -1)
			type = type.slice(0, typeEnd);
		if (type === 'image') {
			return '<img src="' + url + '">';
		}
		link = '<a href="' + url + '" target="_blank">Open externally</a>';
	}
	return '<p class="alert">File could not be loaded.' + link + '</p>';
}

})();
