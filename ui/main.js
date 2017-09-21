"use strict";

var _currProject, _currFile,
	_editor;

require.config({ paths: { 'vs': 'monaco-editor/min/vs' }});

$(document).ready(function () {
	registerEvents();
	getProjectList();
});

function registerEvents () {
	$('#files').on('click', 'a', fileNameClick);
	$('input[type=submit]').click(saveFile);
	$(window).resize(onResize);
}

function getProjectList () {
	projects.getList(function (projects) {
		_currProject = projects[0];
		getFileList();
	});
}

function getFileList (subDir) {
	_currProject.getFileList(subDir, function (fileList) {
		var $list = $('#files');
		for (var i = 0; i < fileList.length; i++) {
			var file = fileList[i];
			$('<a href="' + _currProject.fileUrl(file) + '">' + file.name + '</a>')
				.data('file', file)
				.appendTo($list);
		}
	});
}

function fileNameClick (e) {
	e.preventDefault();

	var $fileLink = $(this);
	if (!$fileLink.hasClass('selected')) {
		$fileLink.addClass('selected').siblings().removeClass('selected')
		var file = $fileLink.data('file');
		openFile(file);
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
	if (!file) {
		if (_editor) {
			if (_editor.getModel()) {
				_editor.getModel().dispose();
			}
			_editor.dispose();
			_editor = null;
		}
		$('#editor').empty();
		$('#editor').append('<p class="alert">File could not be loaded.</p>');
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
	var newModel = monaco.editor.createModel(file.body, file.type.id);
	_editor.setModel(newModel);
	if (oldModel) {
		oldModel.dispose();
	}
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
