$(function() {
    window.twitter = new twitter(window);

    $(".domain_change").live('click',
            function(e) {
                logClick('Outbound Links', $(this).data('name')); // would be better to load these up with data- attrs and standardize accross page.

                if (!e.metaKey && !e.ctrlKey) { // new tab
                    setTimeout('window.location = "' + $(this).attr('href') + '"', 100);
                    e.preventDefault();
                    return;
                }

            });
});

var logClick = function(category, action) {
    _gat._getTrackerByName()._trackEvent(category, action);
};

var twitter = function(window, undefined) {
    var twitter = this;
    this.options = { //could use object's prototype for these, but as only one instance, no worries.
        storageKey:'lastTweetId',
        refreshTime: 1000 * 35,
        tweetStayTime: 10 * 1000,
        $tweetBox: $("#tweet").hover(function() { // if moved to prototype, this would have to be ensured after DOM ready
            $(this).data('hovered', true).find('.progressBar').stop(false, false);
        }, function() {
            $(this).data('hovered', false);
            twitter.hide_tweet();
        })

    };

    this.lastUpdate = {
        id: localStorage.getItem(twitter.options.storageKey),
        setId: function(id) {
            twitter.lastUpdate.id = id;
            window.localStorage.setItem(twitter.options.storageKey, id);
        }
    };
    this.refresh = function() {
        var query = {
            q: 'from:ehrlicp',
            rpp: 1 //max tweets
        }
        if (twitter.lastUpdate.id) {
            query.since_id = twitter.lastUpdate.id;
        }
        $.ajax({
            url:'http://search.twitter.com/search.json',
            data: query,
            dataType:'jsonp',
            jsonpCallback: 'twitter.update' //must link to name of global var!
        });
    };
    this.update = function(data) {
        var lastTweet = data.results[0];

        if (lastTweet == undefined) {
            setTimeout(twitter.refresh, twitter.options.refreshTime);
            return;
        }

        this.show_tweet(lastTweet);
        this.lastUpdate.setId(lastTweet.id_str);

    };
    this.show_tweet = function(tweet) {
        this.options.$tweetBox
                .find('.content').html(tweet.text.linkify()).end()
                .find('.progressBar').css({top:'0px'}).animate({top:'40px'}, twitter.options.tweetStayTime).end()
                .fadeIn(500);
        setTimeout(twitter.hide_tweet, twitter.options.tweetStayTime);

    };
    this.hide_tweet = function() {
        if (!twitter.options.$tweetBox.data('hovered')) {
            twitter.options.$tweetBox.fadeOut(500);
            setTimeout(twitter.refresh, twitter.options.refreshTime); // place here so that no refresh tweet is hovered and shown
        }
    };

    setTimeout(this.refresh, 1000);
};


var time_on_bio = 0;
function toggle_who() {
    var $holder = $("#whoisthisguy"),
            speed = 200,
            $allOtherContent = $('.column, #footer, .live_inset');


    if ($holder.data('open')) { // hide the bio
        $holder.data('open', false);
        $holder.hide();
        $(this).find('.body').hide(speed);
        window.scrollTo(0, 0);
        $allOtherContent.show();
        time_on_bio = (new Date() - time_on_bio) / 1000;
        _gat._getTrackerByName()._trackEvent('Bio Time', time_on_bio); // there are better ways to pass data w/ GA
    } else { //show the bio
        $holder.data('open', true);
        $allOtherContent.hide();
        $holder.show();
        $(this).find('.body').show(speed);
        _gat._getTrackerByName()._trackEvent('Internal Functions', 'Show Bio');
        time_on_bio = new Date();
    }
}

var blogJs = {
    excerpt_change_click: function($activeLink) {
        this.$activeLink = $activeLink;

        var cacheData = localStorage.getObject(this.$activeLink.attr('href'));
        if (cacheData) {
            blogJs.show_excerpt(cacheData);
        } else {
            $("#blog .introtext").animate({opacity:0}, 500);
            $.embedly(this.$activeLink.attr('href'), {}, this.show_excerpt);
        }

        $(".top_posts.blog a.active").removeClass('active');
        this.$activeLink.addClass('active').blur();

        if (typeof _gat !== 'undefined') {
            // skip initial page load (ga.js still loading)
            _gat._getTrackerByName()._trackEvent('Internal Functions', this.$activeLink.attr('href'));
        }
    },
    show_excerpt: function(oembed) {
        $("#blog .introtext > span").html(oembed.description);
        $("#blog .introtext > h2").html(oembed.title);
        $("#blog .linkout a").attr('href', blogJs.$activeLink.attr('href'));
        $("#blog .introtext").animate({opacity:1}, 500);
        localStorage.setObject(blogJs.$activeLink.attr('href'), oembed);
    },
    $activeLink: $('.top_posts.blog .recent'),
    nav: {
        onmouseover: function() {
            var closureWidth = $("#scrollbox").width(),
                    $targetLi = $(event.target).closest('li'),
                    leftEdgeX = 0, rightEdgeX = 0, margin = 10, newMargin,
                    offScreenLeft = Math.abs(parseInt($("#scrollbox ul").css('marginLeft'))),
                    maxViewableX = offScreenLeft + closureWidth;


            $("#scrollbox li").each(function(index, element) {
                $this = $(element);
                rightEdgeX += $this.width();
                if (element == $targetLi.get(0)) {
                    return false; // false means break the loop, anything else means keep going.
                }
                leftEdgeX += $this.width();
            });


            if (rightEdgeX > maxViewableX) {
                newMargin = rightEdgeX - maxViewableX + margin; // scroll 50 more to see the next item.  todo: only if next item
                newMargin = '-' + newMargin + 'px'
            } else {
                if (leftEdgeX < offScreenLeft) {
                    newMargin = offScreenLeft - leftEdgeX + margin;
                    newMargin = (newMargin > 0) ? 0 : newMargin;
                    newMargin = newMargin + 'px'
                }
            }
            $("#scrollbox ul").stop(true, false).animate({marginLeft:newMargin});
        }
    }
}


function show_hobby(controlElement) {
    $(".creations .top_posts a.active").removeClass('active');
    $(controlElement).addClass('active');
    $("#hobby_items").show();
    $("#portfolio_items").hide();
    _gat._getTrackerByName()._trackEvent('Internal Functions', 'show hobby');
}

function show_portfolio(controlElement) {
    $(".creations .top_posts a.active").removeClass('active');
    $(controlElement).addClass('active');
    $("#hobby_items").hide();
    $("#portfolio_items").show();
    _gat._getTrackerByName()._trackEvent('Internal Functions', 'show portfolio');
}


// to listen: http://www.youtube.com/watch?v=LfamTmY5REw (via embedly)

var portfolio = {
    animate_to:function(pane) {
        var to = 880 * pane,
                $other_panes = $("#portfolio_items .sliding_frame > div"),
                $active = $($other_panes.splice(pane, 1)), //split active out of the rest
                animation_speed = 500;
        $($("#project_nav a").removeClass('active').splice(pane, 1)).addClass('active').blur(); //should make a .jqify method
        // sorry about the .blur, keyboard-navigators
        $("#portfolio_items .sliding_frame").animate({marginLeft:'-' + to + 'px'}, animation_speed);
        _gat._getTrackerByName()._trackEvent('Internal Functions', 'portfolio pane ' + pane);
    },
    show_new: function() {
        this.animate_to(0);
    },
    show_recent: function() {
        this.animate_to(1);
    },
    show_graveyard: function() {
        this.animate_to(2);
    }
};


if (!window.localStorage) {
    window.localStorage = {
        getItem:function() {
            return null;
        },
        setItem:function(key, value) {
            return;
        },
        getObject:function() {
            return null;
        },
        setObject:function(key, value) {
            return;
        }
    };

} else {
    Storage.prototype.setObject = function(key, value) {
        this.setItem(key, JSON.stringify(value));
    }

    Storage.prototype.getObject = function(key) {
        return JSON.parse(this.getItem(key));
    }
}


String.prototype.linkify = function (options) {
    if (!options) options = {};
    if (!options.limit) options.limit = 160;
    if (!options.tagFill) options.tagFill = '';

    var regex = /((http\:\/\/|https\:\/\/|ftp\:\/\/)|(www\.))+(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi;

    var autolinkLabel = function (text, limit) {
        if (!limit) {
            return text;
        }

        if (text.length > limit) {
            return text.substr(0, limit - 3) + '...';
        }

        return text;
    };


    string = this.replace(regex, function(value) {
        value = value.toLowerCase();
        var m = value.match(/^([a-z]+:\/\/)/);
        var nice;
        var url;

        if (m) {
            nice = value.replace(m[1], '');
            url = value;
        }
        else {
            nice = value;
            url = 'http://' + nice;
        }

        return '<a href="' + url + '"' + (options.tagFill != '' ? (' ' + options.tagFill) : '') + '>' + autolinkLabel(nice, options.limit) + '</a>';
    });

    return string;
};


/*
 TODOS:
 Animate a sliding box for top_posts
 provide some images or personality to projects
 delay tweet timer if out of focus: http://stackoverflow.com/questions/1760250/how-to-tell-if-browser-tab-is-active
 */