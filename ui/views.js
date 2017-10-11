"use strict";

var views = {
};

(function () {

$(function () {
    for (var v in views) {
        views[v].id = v;
    }

    $('#switch-view').on('click', 'a', viewChangeClick);
    router.subscribe('view-change', viewChange);
});

function viewChangeClick (e) {
	e.preventDefault();

	var view = $(this).data('view');
    viewChange(views[view]);
}

function viewChange (newView) {
    $('#switch-view a.active').removeClass('active');
    var $link = $('#switch-view a[data-view=' + newView.id + ']');
	$link.addClass('active');
    if (!newView.path) {
        newView.openPath(newView.path = '/');
    }
    var $view = $('#view-' + newView.id);
    $view.siblings().hide();
    $view.show();
}

})();
