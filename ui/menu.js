"use strict";

var menu = {};

(function () {

menu.load = function () {
    registerEvents();
	getProjectList();
	loadMenuState();
};

function registerEvents () {
    $('#project-select').click(projectSelectClick);
	$('#project-select-list').on('click', 'a', router.handleLinkClick);
	router.subscribe('project-change', projectChange);

	$('#menu-bar-close').click(function () {
		hideMenuBar(true);
		showMenuButton(true);
		saveMenuState();
	});
	$('#menu-btn')
		.click(menuButtonClick)
        .mousedown(menuButtonMouseDown);
}

function applyMenuState (state) {
	var btnStyle = document.getElementById('menu-btn').style;
	btnStyle[state.sideX] = state.x + 'px';
	btnStyle[state.sideY] = state.y + 'px';
	if (state.visible) {
		hideMenuBar();
		showMenuButton();
	}
	else {
		hideMenuButton();
		showMenuBar();
	}
}

function loadMenuState () {
	var state = localStorage.getItem('mbutton');
	if (state) {
		var yStart = state.indexOf('/');
		if (yStart === -1) {
			localStorage.removeItem('mbutton');
			loadMenuState();
			return;
		}
		state = {
			visible: state[0] === 'Y',
			sideX: state[1] === 'l' ? 'left' : 'right',
			sideY: state[yStart+1] === 't' ? 'top' : 'bottom',
			x: parseInt(state.slice(2, yStart)),
			y: parseInt(state.slice(yStart+2))
		};
	}
	else {
		state = {
			visible: false,
			sideX: 'right',
			sideY: 'bottom',
			x: 35,
			y: 35
		}
	}
	applyMenuState(state);
}

function saveMenuState () {
	var $btn = $('#menu-btn'),
		style = $btn[0].style,
		sideX = (style.left && style.left !== 'auto') ? 'left' : 'right',
		sideY = (style.top && style.top !== 'auto') ? 'top' : 'bottom',
		x = parseInt(style[sideX]),
		y = parseInt(style[sideY]),
		isOn = !$btn.hasClass('hidden');
	localStorage.setItem('mbutton',
		(isOn ? 'Y': 'N') + sideX[0] + x + '/' + sideY[0] + y);
}

////////////////////////
// Project Selector

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

////////////////////////
// Menu Bar

function showMenuBar (animate) {
	var $mb = $('#menu-bar').stop(),
		$content = $('#views').stop(),
		mbHeight = $mb.outerHeight();
	if (animate) {
		$mb.css({display: 'block', position: 'absolute', top: -mbHeight})
			.animate({top: 0, opacity: 1}, function () {
				$mb.css({position: 'static'});
			});
		$content.animate({top: mbHeight});
	}
	else {
		$mb.css({display: 'block', position: 'static', top: 0});
		$content.css({top: mbHeight});
	}
}
function hideMenuBar (animate) {
	var $mb = $('#menu-bar').stop(),
		$content = $('#views').stop();
	if (animate) {
		$mb.css({position: 'absolute'})
			.animate({top: -$mb.outerHeight(), opacity: 0}, function () {
				$mb.css({display: 'none'})
			});
		$content.animate({top: 0});
	}
	else {
		$mb.css({display: 'none'});
		$content.css({top: 0});
	}
}

////////////////////////
// Menu Button

function showMenuButton (animate) {
    var $btn = $('#menu-btn').stop().removeClass('hidden'),
		style = $btn[0].style,
		sideX = (style.left && style.left !== 'auto') ? 'left' : 'right',
		sideY = (style.top && style.top !== 'auto') ? 'top' : 'bottom',
        newSize = 50, halfSize = newSize/2;
    var newStyle = {
        width: newSize,
		height: newSize,
        opacity: 1
    };
	if (animate) {
		newStyle[sideX] = parseInt(style[sideX]) - halfSize;
		newStyle[sideY] = parseInt(style[sideY]) - halfSize;		
        $btn.css({display: 'block', width: 0, height: 0, opacity: 0})
			.animate(newStyle, 300);
	}
	else {
        newStyle.display = 'block';
		$btn.css(newStyle);
	}
}
function hideMenuButton (animate) {
	var $btn = $('#menu-btn').stop().addClass('hidden');
	if (animate) {
		var halfSize = $btn.outerWidth() / 2,
			style = $btn[0].style,
			sideX = (style.left && style.left !== 'auto') ? 'left' : 'right',
			sideY = (style.top && style.top !== 'auto') ? 'top' : 'bottom';
		var newStyle = {
			width: 0,
			height: 0,
			opacity: 0
		};
		newStyle[sideX] = parseInt(style[sideX]) + halfSize;
		newStyle[sideY] = parseInt(style[sideY]) + halfSize;
        $btn.animate(newStyle, 300);
	}
	else {
		$btn.hide();
	}
}

function menuButtonClick () {
	// releasing drag over button produces a click
	if ($(this).hasClass('dragging')) {
		return;
	}
	hideMenuButton(true);
	showMenuBar(true);
	saveMenuState();
}
function menuButtonMouseDown (e) {
	var $btn = $(this),
		startDragX = e.pageX,
		startDragY = e.pageY,
		startPos = $btn.offset(),
		startedDrag = false;

	function drag (e) {
		// prevent page selection during drag
		e.stopPropagation();
		e.preventDefault();

		var distX = e.pageX - startDragX,
			distY = e.pageY - startDragY;
		if (!startedDrag) {
            if (distX*distX + distY*distY < 9)
                return;
			$btn.addClass('dragging');
            $btn.css({right: 'auto', bottom: 'auto'});
            startedDrag = true;
        }
        var left = startPos.left + distX,
            top = startPos.top + distY;
		$btn.css({top: top, left: left});
	}

	function drop (e) {
		// remove "dragging" class after click event runs
		setTimeout(function () {
			$btn.removeClass('dragging');
		}, 0);

		var $doc = $(document);
		$doc
			.off('mousemove', drag)
			.off('mouseup', drop);

		var left = startPos.left + (e.pageX - startDragX),
            top = startPos.top + (e.pageY - startDragY),
            size = $btn.outerWidth();
		if (left > $doc.innerWidth() / 2) {
            $btn.css({
                left: 'auto',
                right: $doc.innerWidth() - left - size
            });
        }
        if (top > $doc.outerHeight() / 2) {
            $btn.css({
                top: 'auto',
                bottom: $doc.outerHeight() - top - size
            })
		}
		saveMenuState();
	}

	$(document)
		.on('mousemove', drag)
		.on('mouseup', drop);
}

})();
