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

/// <reference path="../App.js" />

(function () {
    "use strict";

    var progress = null;

    // The initialize function must be run each time a new page is loaded
    Office.initialize = function (reason) {
        $(document).ready(function () {
            app.initialize();

            document.title = app.resources.ApplicationName;

            Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, searchBySelection);
            $("#search-button").click(searchByTextBox);
            $("#search-text").keyup(function (event) {
                if (event.keyCode == 13) {
                    searchByTextBox();
                }
            });

            handlePending();
        });
    };

    function searchBySelection() {
        Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    var text = result.value;
                    searchCore(text);
                } else {
                    app.showNotification(app.resources.ErrorMessageTitle, result.error.message);
                }
            }
        );
    }

    function searchByTextBox() {
        var text = $("#search-text").val();
        searchCore(text);
    }

    function searchByHyperlink() {
        var text = $(this).text();
        searchCore(text);
    }

    function searchCore(text) {
        if (text != null) {
            text = text.trim();

            if (text.length > 0) {
                beginWaiting();

                var param = encodeURIComponent(text);
                $.getJSON("../../search?q=" + param)
                .done(function (data, status, xhr) {
                    if (!(data && data.Entity)) {
                        handleEmpty(text);
                        return;
                    }

                    var html = "<div id='search-result'>";

                    html += handleTitleCaption(data.Entity);

                    if (data.Entity.AttibuteList && data.Entity.AttibuteList.length > 0) {
                        html += handleAttributes(data.Entity.AttibuteList);
                    }

                    if (data.Entity.RelatedEntityList && data.Entity.RelatedEntityList.length > 0) {
                        html += handleRelated(data.Entity.RelatedEntityList);
                    }

                    if (data.Entity.CategoryList && data.Entity.CategoryList.length > 0) {
                        html += handleCategories(data.Entity.CategoryList);
                    }

                    html += "</div>";

                    $("#content-main").html(html);
                    $("#content-main a").click(searchByHyperlink);
                    $("#search-text").val(text);
                })
                .fail(function (xhr, status, error) {
                    app.showNotification(app.resources.ErrorMessageTitle, app.resources.SearchErrorMessage);
                })
                .always(function () {
                    endWaiting();
                });
            }
        }
    }

    function handleTitleCaption(data) {
        var html = "<div id='search-result-main'>";

        if (data.Title) {
            html += handleTitle(data.Title);
        }

        if (data.Caption) {
            html += handleCaption(data.Caption);
        }

        html += "</div>";
        return html;
    }

    function handleTitle(data) {
        var html = "<div id='search-result-title'>";

        if (data.Name) {
            html += "<h2>" + data.Name + "</h2>";
        }

        if (data.Tag) {
            html += "<span>" + data.Tag + "</span>";
        }

        html += "</div>";
        return html;
    }

    function handleCaption(data) {
        var html = "";

        html += "<div id='search-result-image'>";
        html += handleImage(data.Image);
        html += "</div>";

        html += "<p id='search-result-caption'>";
        html += handleItems(data.Description);
        html += "</p>";

        return html;
    }

    function handleAttributes(data) {
        var html = "<div id='search-result-attributes'>";
        html += "<h2>" + app.resources.AttributesTitle + "</h2>";
        html += "<div>";

        $.each(data, function (index, value) {
            var attribute = value.Attribute;
            if (attribute && attribute.Key) {
                html += "<div class='search-attr'>";
                html += "<div class='search-attr-key'>" + attribute.Key + app.resources.ColonSign + "</div>";
                html += "<div class='search-attr-value'>";
                html += handleItems(attribute.Value);
                html += "</div>";
                html += "</div>";
            }
        });

        html += "</div>";
        html += "</div>";
        return html;
    }

    function handleRelated(data) {
        var html = "<div id='search-result-related'>";
        html += "<h2>" + app.resources.RelatedTitle + "</h2>";
        html += "<div>";

        $.each(data, function (index, value) {
            var related = value.RelatedEntity;

            if (related) {
                html += "<div>";

                html += handleImage(related.Image);

                if (related.Name) {
                    html += "<p><a href='javascript:void(0)'>" + related.Name + "</a></p>";
                }

                if (related.Tag) {
                    html += "<p>" + related.Tag + "</p>";
                }

                html += "</div>";
            }
        });

        html += "</div>";
        html += "</div>";
        return html;
    }

    function handleCategories(data) {
        var html = "<div id='search-result-categories'>";
        html += "<h2>" + app.resources.CategoriesTitle + "</h2>";
        html += "<div>";

        $.each(data, function (index, value) {
            var category = value.Category;

            if (category) {
                html += "<span>" + category + "</span>";
            }
        });

        html += "</div>";
        html += "</div>";

        return html;
    }

    function handleItems(items) {
        var html = "";

        if (items) {
            $.each(items, function (index, value) {
                var item = value.Item;
                if (item && item.Text) {
                    if (item.Url && item.Url.length > 0) {
                        html += "<a href='javascript:void(0)'>" + item.Text + "</a>";
                    } else {
                        html += item.Text;
                    }
                }
            });
        }

        return html;
    }

    function handleImage(image) {
        var html = "";

        if (image && image.Source && image.Source.length > 0) {
            html += "<img";
            html += " src='" + getFullImageUrl(image.Source) + "'";

            if (image.Width && image.Width > 0) {
                html += " width='" + image.Width + "'";
            }

            if (image.Height && image.Height > 0) {
                html += " height='" + image.Height + "'";
            }

            html += "/>";
        }

        return html;
    }

    function getFullImageUrl(source) {
        return "https://www.bing.com" + source;
    }

    function handlePending() {
        app.hideNotification();
        var html = "<div id='default-message'>" + app.resources.DefaultMessage + "</div>";
        $("#content-main").html(html);
    }

    function handleEmpty(text) {
        app.hideNotification();
        $("#search-text").val(text);
        var html = "<div id='empty-message'>" + app.resources.NoSearchResultMessage + "</div>";
        $("#content-main").html(html);
    }

    function beginWaiting() {
        app.hideNotification();
        var html = "<div id='waiting-area'><div class='title'>" + app.resources.ProgressTitle + "<div><div id='progress'></div></div>";
        $("#content-main").html(html);
        progress = app.progress("#progress");
    }

    function endWaiting() {
        progress.dispose();
    }
})();