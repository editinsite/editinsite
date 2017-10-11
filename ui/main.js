"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	getProjectList();
	router.refresh();
}

function registerEvents () {
    $('#project-select').click(projectSelectClick);
	$('#project-select-list').on('click', 'a', router.handleLinkClick);
	router.subscribe('project-change', projectChange);

	window.onpopstate = function (e) {
		router.setState(decodeURIComponent(window.location.pathname));
	};
}

function getProjectList () {
	projects.getList(function (projectList) {
		if (projectList) {
			var $list = $('#project-select-list ul').empty(),
				showItems = Math.min(projectList.length, 5);
			for (var i = 0; i < showItems; i++) {
				var p = projectList[i];
				$list.append('<li><a href="/files/' + p.id + '/">' + p.name + '</li>');
			}
		}
	});
}

function projectChange (newProject) {
	$('#project-select .current').text('Project: ' + newProject.id);
	$('#switch-view a').each(function () {
		var $a = $(this),
			view = $a.data('view');
		$a.attr('href', '/' + view + '/' + newProject.id + '/');
	});
}

function projectSelectClick (e) {
	e.preventDefault();

	if (!$(this).hasClass('active')) {
		$(this).addClass('active');
		$('#project-select-list').fadeIn(200);

		setTimeout(function () {
			$(document).one('click', clickDuringProjectSelect);
		}, 0); // add handler only *after* this click hits document.
	}
}
function clickDuringProjectSelect (e) {
	$('#project-select').removeClass('active');
	$('#project-select-list').fadeOut(200);
}

function checkReady () {
	$(function () {
		if (window.monaco) {
			onLoad();
		}
	});
}
require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
require(['vs/editor/editor.main'], checkReady);
$(checkReady);

})();
