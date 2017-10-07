(function ($) {

    $.fn.loading = function (isLoading) {
        return this.each(function () {
            var $el = $(this);
            if (isLoading) {
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
            else {
                $el.fadeOut({ duration: 200 });
            }
        });
    };

    // debounce returns a function that can be used to call func() on a delay.
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

    var _doOnceJobSet = {};

    // doOnce will call the doFunction only one time for the given jobId.
    // The doFunction receives a callback to execute all of the registered handlers.
    $.doOnce = function (jobId, handlerFn, doFunction) {
        var handlerList = _doOnceJobSet[jobId],
            isFirst = !handlerList;
        if (isFirst)
            handlerList = _doOnceJobSet[jobId] = [];
        if (handlerFn)
            handlerList.push(handlerFn);

        if (isFirst) {
            doFunction(function () {
                delete _doOnceJobSet[jobId];
                for (var i = 0; i < handlerList.length; i++)
                    handlerList[i].apply(null, arguments);
            });
        }
    };

})(jQuery);
