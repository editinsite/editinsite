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
  $.getJSON('/projects/', function (projects) {
    _currProject = projects[0];
    getFileList();
  });
}

function getFileList (subDir) {
  var fileList;

  function showList () {
    if (fileList && window.monaco) {
      var $list = $('#files');
      for (var i = 0; i < fileList.length; i++) {
        var name = fileList[i];
        var file = {
            name: name,
            parent: subDir,
            type: fileTypeFromName(name)
          };
        $('<a href="' + fileUrl(file) + '">' + name + '</a>')
          .data('file', file)
          .appendTo($list);
      }
    }
  }

  if (!window.monaco) {
    require(['vs/editor/editor.main'], showList);
  }
  $.getJSON(fileUrl(subDir), function (files) {
    fileList = files;
    showList();
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

  downloadFile(file, function (file) {
    hideLoading('editor');
    showInEditor(file);
  });
}

function saveFile (e) {
  e && e.preventDefault();

  if (_editor) {
    $('input[type=submit]').text('Saving...');
    _currFile.body = _editor.getValue();
    uploadFile(_currFile, function () {
      $('input[type=submit]').text('Save');
    });
  }
}

function downloadFile (file, callback) {
  var oReq = new XMLHttpRequest();
  
  oReq.onload = function (oEvent) {
    file.body = oReq.response;
    callback(file);
  };
  
  oReq.open("GET", fileUrl(file));
  oReq.responseType = "text";
  oReq.send();
}

function uploadFile (file, callback) {
  var oReq = new XMLHttpRequest();
  oReq.onload = callback;
  oReq.open("POST", fileUrl(file));
  oReq.send(new Blob([file.body], { type: 'text/plain' }));
}

function fileUrl (file) {
  return file ? (fileUrl(file.parent) + file.name)
    : ('/projects/' + _currProject.id + '/');
}

function fileTypeFromName (fileName) {
  var ext, extStart = fileName.lastIndexOf('.');
  if (extStart !== -1) {
    ext = fileName.slice(extStart).toLowerCase();
  }
  var exts = _extensions || loadExtensions();
  return ext && exts[ext] || exts['.txt'];
}

var _extensions;
function loadExtensions () {
  _extensions = {};
  var languages = monaco.languages.getLanguages();
  for (var l = languages.length; l--;) {
    var language = languages[l];
    for (var e = language.extensions.length; e--;) {
      var ext = language.extensions[e];
      _extensions[ext] = language;
    }
  }
  return _extensions;
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
