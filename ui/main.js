"use strict";

(function () {

// Called when DOM and Monaco API are ready.
function onLoad () {
	registerEvents();
	getProjectList();
	showToolButton();
	router.refresh();
}

function registerEvents () {
    $('#project-select').click(projectSelectClick);
	$('#project-select-list').on('click', 'a', router.handleLinkClick);
	router.subscribe('project-change', projectChange);

	$('#header-close').click(function () {
		hideToolbar(true);
		showToolButton(true);
	});
	$('#god-btn').click(function () {
		hideToolButton(true);
		showToolbar(true);
	});

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

function showToolbar (animate) {
	var $tb = $('header').stop(),
		$content = $('#views').stop();
	if (animate) {
		$tb.css({display: 'block', position: 'absolute'})
			.animate({top: 0, opacity: 1}, function () {
				$tb.css({position: 'static'});
			});
		$content.animate({top: $tb.outerHeight()});
	}
	else {
		$tb.css({display: 'block', position: 'static', top: 0});
		$content.css({top: $tb.outerHeight()});
	}
}
function hideToolbar (animate) {
	var $tb = $('header').stop(),
		$content = $('#views').stop();
	if (animate) {
		$tb.css({position: 'absolute'})
			.animate({top: -$tb.outerHeight(), opacity: 0}, function () {
				$tb.css({display: 'none'})
			});
		$content.animate({top: 0});
	}
	else {
		$tb.css({display: 'none'});
		$content.css({top: 0});
	}
}

function showToolButton (animate) {
	var $btn = $('#god-btn').stop();
	if (animate) {
		$btn.fadeIn();
	}
	else {
		$btn.show();
	}
}
function hideToolButton (animate) {
	var $btn = $('#god-btn').stop();
	if (animate) {
		$btn.fadeOut();
	}
	else {
		$btn.hide();
	}
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
