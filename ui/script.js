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

function getFileList () {
  $.getJSON('/projects/' + _currProject.id, function (files) {
    var $list = $('#files');
    for (var i = 0; i < files.length; i++)
      $list.append('<a href="#">' + files[i] + '</a>');
  });
}

function fileNameClick (e) {
  e.preventDefault();

  var $fileLink = $(this);
  if (!$fileLink.hasClass('selected')) {
    $fileLink.addClass('selected').siblings().removeClass('selected')
    var name = $fileLink.text();
    loadFile(name);
  }
}

function loadFile (path) {
  _currFile = null;
  showLoading('editor');
  $.getJSON('/projects/' + _currProject.id + '/' + path,
    function (file) {
      require(['vs/editor/editor.main'], function() {
        file.type = detectFileType(file);
        showFile(file);
      });
    })
    .fail(function() { showFile(null); });
}

function showFile (file) {
  _currFile = file;

  require(['vs/editor/editor.main'], function() {
    if (!file) {
      if (_editor) {
        if (_editor.getModel()) {
          _editor.getModel().dispose();
        }
        _editor.dispose();
        _editor = null;
      }
      hideLoading('editor');
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
    hideLoading('editor');
  });
}

function saveFile (e) {
  e.preventDefault();

  if (_editor) {
    $('input[type=submit]').text('Saving...');
    $.post("/projects/" + _currProject.id + "/" + _currFile.path, {
        body: _editor.getValue()
      },
      function (files) {
        $('input[type=submit]').text('Save');
      },
      'json');
  }
}

function detectFileType (file) {
  var ext, extStart = file.name.lastIndexOf('.');
  if (extStart !== -1) {
    ext = file.name.slice(extStart).toLowerCase();
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
