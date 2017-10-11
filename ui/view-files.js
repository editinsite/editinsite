"use strict";

var filesView;

(function () {

var _editor, _currFile;

$(function () {
	$('#files').on('click', 'a', fileNameClick);
	$('#file-save-button').click(saveFile);
	$(window).resize(onResize);
});

filesView = {
	openFile: selectPath,
	closeFile: closeFile
};

function projectChanged (project) {
	$('#files').empty();
	closeEditor();
	expandDir('');
}
router.subscribe('project-change', projectChanged);

function showFileList ($parent, dir, callback) {
	var $list = $parent.children('.filelist');
	if ($list.length) {
		$list.show();
		callback && callback($list);
		return;
	}
	var url = projects.current.rawUrl(dir);
	$.doOnce(url, callback, function (callback) {
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
						+ '" title="/' + file.path() + '">'
						+ icon + file.name + '</a>')
						.data('file', file)
				).appendTo($list);
			}
			$list.appendTo($parent);
			callback($list);
		});
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
				$list.siblings('.filelink').addClass('expanded');
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
			if (!fileName) {
				closeFile();
				return;
			}
			var $fileLink = findFileLink($list, fileName);
			if ($fileLink) {
				selectFile($fileLink);
				return;
			}
		}
		closeFile();
		showInEditor(null);
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
		$('#file-bar .open-raw').attr('href', projects.current.rawUrl(file));
		$('#file-bar .path').html(file.path());
		$('#file-bar').show();
	});
}

function closeFile () {
	closeEditor();
	$('#file-bar').hide();
	_currFile = null;
}

function saveFile (e) {
	e && e.preventDefault();

	if (_editor && $('#file-save-button').hasClass('dirty')) {
		var $btn = $('#file-save-button i'),
			btnClasses = 'fa-spinner-third fa-spin';
		$btn.removeClass('fa-save').addClass(btnClasses);
		_currFile.body = _editor.getValue();
		_currFile.upload(function () {
			clearDirty();
			$btn.removeClass(btnClasses).addClass('fa-save');
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
		closeEditor();
		var body = renderBlob(file && file.body);
		$('#editor').append(body);
		return;
	}

	if (!_editor) {
		$('#editor').empty();
		_editor = monaco.editor.create(document.getElementById('editor'), {
			model: null,
			theme: 'vs-dark'
		});
		_editor.onDidChangeModelContent(fileUpdated);
	}

	var oldModel = _editor.getModel();
	var newModel = file.model || monaco.editor.createModel(file.body, file.lang.id);
	file.model = newModel;
	_editor.setModel(newModel);
	if (!file.savedVersion)
		file.savedVersion = newModel.getAlternativeVersionId();
	fileUpdated();
}

function closeEditor () {
	if (_editor) {
		_editor.dispose();
		_editor = null;
	}
	$('#editor').empty();
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
			return '<div class="image-file"><img src="' + url + '"></div>';
		}
		link = '<a href="' + url + '" target="_blank">Open externally</a>';
	}
	return '<p class="alert">File could not be loaded.' + link + '</p>';
}

function fileIsDirty () {
	if (_editor) {
		var version = _editor.getModel().getAlternativeVersionId();
		return version !== _currFile.savedVersion;
	}
	return false;
}

function clearDirty () {
	if (_editor) {
		_currFile.savedVersion = _editor.getModel().getAlternativeVersionId();
		fileUpdated();
	}
}

function fileUpdated () {
	var dirty = fileIsDirty();
	var $link = $('#files .filelink[href="'
		+ projects.current.editUrl(_currFile) + '"]');

	$('#file-save-button').toggleClass('dirty', dirty);
	$link.toggleClass('dirty', dirty);
}

})();
