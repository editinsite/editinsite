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
    router.subscribe('url-change', urlChange);
});

function viewChangeClick (e) {
	e.preventDefault();

	var view = $(this).data('view');
    viewChange(views[view]);
    router.addHistory(this.getAttribute('href'));
}

function viewChange (newView) {
    $('#switch-view a.active').removeClass('active');
    var $link = $('#switch-view a[data-view=' + newView.id + ']');
	$link.addClass('active');
    if (!newView.path) {
        newView.openPath('/');
    }
    var $view = $('#view-' + newView.id);
    $view.siblings().hide();
    $view.show();
}

function urlChange (newUrl) {
    $('#switch-view a.active').attr('href', newUrl);
}

})();
