/**************************************************
* Copyright (c) Microsoft Open Technologies (Shanghai) Company Limited.  All rights reserved.
* 
* The MIT License (MIT)
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
**************************************************/

/* Common app functionality */

var app = (function () {
    "use strict";

    var app = {};

    // Common initialization function (to be called from each page)
    app.initialize = function () {

        // Initialize notification message

        $('body').append(
            '<div id="notification-message">' +
                '<div id="notification-message-header">' +
                    '<div id="notification-message-title"></div>' +
                    '<div id="notification-message-close">' +
                        '<a href="javascript:void(0)"><img src="../../Images/Close.png" /></a>' +
                    '</div>' +
                '</div>' +
                '<div id="notification-message-body"></div>' +
            '</div>');

        $('#notification-message-close a').click(function () {
            app.hideNotification();
        });

        // After initialization, expose a common notification function
        app.showNotification = function (header, text) {
            $('#notification-message-title').text(header);
            $('#notification-message-body').text(text);
            $('#notification-message').slideDown('fast', function () {
                $(document).trigger("notify", { height: $('#notification-message').outerHeight() });
            });
        };

        app.hideNotification = function () {
            $(document).trigger("unnotify", { height: 0 });
            $('#notification-message').hide();
        };


        // Handle re-layout

        var layout = function (event, args) {
            $("#content-main").css("bottom", args.height + "px");
        };

        $(document).on("notify", layout);
        $(document).on("unnotify", layout);


        // Initialize progress spin

        app.progress = function (parent) {
            var _parent = $(parent);
            var _start = 0;
            var _timer = null;

            _parent.addClass("progress");

            for (var i = 0; i < 12; i++) {
                var value = 30 * i * Math.PI / 180;
                var x = Math.round(10 * Math.cos(value)) + 10;
                var y = Math.round(10 * Math.sin(value)) + 10;
                var style = "left:" + x + "px;" + "top:" + y + "px;";
                _parent.append("<div class='spin' style='" + style + "'></div>")
            }

            _timer = setInterval(function () {
                var spins = $("div.spin", _parent);
                spins.removeClass("indicate");
                _start = (_start + 1) % 12;
                $(spins.get(_start)).addClass("indicate");
                $(spins.get((_start + 1) % 12)).addClass("indicate");
                $(spins.get((_start + 2) % 12)).addClass("indicate");
            }, 300);

            return {
                dispose: function () {
                    clearInterval(_timer);
                }
            };
        };


        // Initialize resources

        app.resources = (function () {
            return {
                ApplicationName: "必应网典",
                DefaultMessage: "请选择或输入您需要查询的关键字。",
                ErrorMessageTitle: "错误：",
                SearchErrorMessage: "查询时发生错误。",
                NoSearchResultMessage: "无相关结果。",
                AttributesTitle: "基本资料",
                RelatedTitle: "相关词条",
                CategoriesTitle: "词条标签",
                ColonSign: "：",
                ProgressTitle: "正在加载..."
            };
        })();
    };

    return app;
})();