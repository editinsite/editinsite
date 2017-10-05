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
		expandDir('');
	},

	open: selectPath
};

function showFileList ($parent, dir, callback) {
	var $list = $parent.children('.filelist')
	if ($list.length) {
		$list.show();
		callback && callback($list);
		return;
	}
	projects.current.getFileList(dir, function (fileList) {
		if (!fileList) {
			callback(null);
			return;
		}
		var $list = $('<ul class="filelist"></ul>');
		for (var i = 0; i < fileList.length; i++) {
			var file = fileList[i],
				icon = '';
			if (file.isDir)
				icon = '<i class="far fa-angle-right"></i>';
			$('<li></li>').append(
				$('<a class="filelink" href="'
					+ projects.current.editUrl(file)
					+ '">' + icon + file.name + '</a>')
					.data('file', file)
			).appendTo($list);
		}
		$list.appendTo($parent);
		callback && callback($list);
	});
}

function fileNameClick (e) {
	e.preventDefault();

	var $fileLink = $(this),
		file = $fileLink.data('file');
	if (file.isDir) {
		toggleDirList($fileLink);
	}
	else {
		selectFile($fileLink);
		router.addHistory($fileLink.attr('href'));
	}
}

function toggleDirList ($dirLink) {
	if ($dirLink.hasClass('expanded')) {
		$dirLink.siblings('.filelist').hide();
	}
	else {
		showFileList($dirLink.parent(), $dirLink.data('file'));
	}
	$dirLink.toggleClass('expanded');
}

function expandDir (path, callback) {

	function expand ($parent, path, callback) {
		var dirEnd = path.indexOf('/'),
			dirName = path.slice(0, dirEnd+1);
		path = path.slice(dirEnd+1);
		var $dirLink, $newParent;
		if ($parent) {
			$dirLink = findFileLink($parent, dirName);
			if (!$dirLink) {
				callback && callback();
				return;
			}
			$newParent = $dirLink.parent();
		}
		else {
			$newParent = $('#files');
		}
		showFileList($newParent, $dirLink && $dirLink.data('file'), function ($list) {
			if ($list) {
				if (path.length !== 0)
					expand($list, path, callback);
				else
					callback && callback($list);
			}
			else callback && callback();
		});
	}

	if (path[path.length-1] !== '/')
		path += '/';
	expand (null, path, callback);
}

function selectPath (filePath) {
	var dirEnd = filePath.lastIndexOf('/');
	var dir = filePath.slice(0, dirEnd+1),
		fileName = filePath.slice(dirEnd+1);
	expandDir(dir, function ($list) {
		if ($list) {
			var $fileLink = findFileLink($list, fileName);
			if ($fileLink) {
				selectFile($fileLink);
				return;
			}
		}
		alert('File not found.');
	});
}

function selectFile ($fileLink) {
	if (!$fileLink.hasClass('selected')) {
		$('#files .selected').removeClass('selected');
		$fileLink.addClass('selected');
		openFile($fileLink.data('file'));
	}
}

function findFileLink ($list, fileName) {
	var $items = $list.children();
	for (var i = 0, il = $items.length; i < il; i++) {
		var $link = $items.eq(i).children('.filelink');
		if ($link.data('file').name === fileName)
			return $link;
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
