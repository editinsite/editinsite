var _currProject, _currFile;

$(document).ready(function () {
  registerEvents();
  getFileList();
});

function registerEvents () {
  $('#files').on('click', 'a', fileNameClick);
  $('#editor').submit(saveFile);
}

function getFileList () {
  $.getJSON("/project/example", function (files) {
    var $list = $('#files');
    for (var i = 0; i < files.length; i++)
      $list.append('<a href="#">' + files[i] + '</a>');
  });
}

function fileNameClick (e) {
  e.preventDefault();

  var $fileLink = $(this);
  $fileLink.addClass('selected').siblings().removeClass('selected')
  var name = $fileLink.text();
  _currFile = null;
  $.getJSON("/project/example/" + name, showFile);
}

function showFile (file) {
  _currFile = file;
  $('textarea').val(file.body);
}

function saveFile (e) {
  e.preventDefault();

  $('input[type=submit]').text('Saving...');
  $.post("/project/example/" + _currFile.path, {
      body: $('textarea').val()
    },
    function (files) {
      $('input[type=submit]').text('Save');
    },
    "json");
}
