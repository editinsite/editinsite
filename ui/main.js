"use strict";

var _currProject, _currFile,
	_editor;

require.config({ paths: { 'vs': 'monaco-editor/min/vs' }});

$(document).ready(function () {
	registerEvents();
	getProjectList();
});

function registerEvents () {
	$('#files').on('click', '.filelink', fileNameClick);
	$('input[type=submit]').click(saveFile);
	$(window).resize(onResize);
}

function getProjectList () {
	projects.getList(function (projects) {
		_currProject = projects[0];
		getFileList($('#files'));
	});
}

function getFileList ($listParent, subDir) {
	_currProject.getFileList(subDir, function (fileList) {
		var $list = $('<ul class="filelist"></ul>');
		for (var i = 0; i < fileList.length; i++) {
			var file = fileList[i],
				icon = '';
			if (file.isDir)
				icon = '<i class="far fa-angle-right"></i>';
			$('<li></li>').append(
				$('<a class="filelink" href="' + _currProject.fileUrl(file)
					+ '">' + icon + file.name + '</a>')
					.data('file', file)
			).appendTo($list);
		}
		$list.appendTo($listParent);
	});
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
	showLoading('editor');

	_currProject.downloadFile(file, function (file) {
		hideLoading('editor');
		showInEditor(file);
	});
}

function saveFile (e) {
	e && e.preventDefault();

	if (_editor) {
		$('input[type=submit]').text('Saving...');
		_currFile.body = _editor.getValue();
		_currProject.uploadFile(_currFile, function () {
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

function showLoading (className) {
	var $el = $('.loading.' + className);
	$el.find('.progress').hide();
	$el.show();

	if (!$el.data('delayFn')) {
		$el.data('delayFn', debounce(function () {
			if ($el.is(':visible'))
				$el.find('.progress').show();
		}, 250));
	}
	$el.data('delayFn')();
}

function hideLoading (className) {
	$('.loading.' + className).fadeOut({ duration: 200 });
}

// Returns a function that can be used to call func() on a delay.
// If `immediate` is true, func() is called on leading rather than trailing edge.
function debounce (func, delayMs, immediate) {
	var timer;
	return function () {
		var context = this,
		args = arguments;
		function later () {
			timer = null;
			if (!immediate) func.apply(context, args);
		}
		var callNow = immediate && !timer;
		clearTimeout(timer);
		timer = setTimeout(later, delayMs);
		if (callNow) {
			func.apply(context, args);
		}
	};
}
