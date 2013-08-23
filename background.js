// http://d.hatena.ne.jp/umezo/20091115/1258291572
// http://www.eisbahn.jp/yoichiro/2013/02/chrome-extension-event-page.html

var Background = function() {
    this.push_interval = 5;
    this.get_interval = 10;
    this.is_first = false;
    this.localStorage_length = 2400000;
};
Background.prototype = {
    getValues: function(list) {
        for (var i in list) {
            list[i] = this.getValue(i, list[i]);
        }
        return list;
    },
    getValue: function(name, def) {
        if (!localStorage[name]) {
            localStorage[name] = def;
        }
        return localStorage[name];
    },
    setValue: function(name, value) {
        localStorage[name] = value;
    },
    getUserId: function(account) {
        var defer = $.Deferred();
        $.ajax({
            url: "https://plus.google.com/u/" + account,
            success: function(data) {
                defer.resolve(data.match(/data\:\s\[\"(\d+)\"/)? RegExp.$1: 0);
            },
        });
        return defer.promise();
    },
    storeCircleData: function(account, userId, tabId, push) {
        var self = this;
        localStorage[userId] = 'loading';
        $.when(
            self.fetchCircleData(account, 'followers'),
            self.fetchCircleData(account, 'circles'),
            userId
        ).then(function(followers, circles, userId) {
            var followers_json = eval('//' + followers[0]);
            var circles_json = eval('//' + circles[0]);
            log('get circle data: ' + userId);

            var str = {};
            str.f = JSON.stringify(followers_json);
            str.c = JSON.stringify(circles_json);


            var kinds = ["f", "c"];
            var ll = self.localStorage_length;
            for (var j in kinds) {
                var kind = kinds[j];
                var loop_count = Math.ceil(str[kind].length / ll);
                for (var i = 0; i < loop_count; i++) {
                    var s = str[kind].substr(i * ll, ll);
                    localStorage.removeItem(userId + '_' + kind + '_' + i);
                    localStorage[userId + '_' + kind + '_' + i] = s;
                    localStorage.removeItem(userId + '_' + kind + '_count');
                    localStorage[userId + '_' + kind + '_count'] = i + 1;
                }
            }

            localStorage.removeItem("localstrage_length");
            localStorage["localstrage_length"] = self.localStorage_length;
            localStorage.removeItem(userId);
            localStorage[userId] = Date();

            if (push) {
                self.sendCircleData(tabId, self.getCircleData(userId));
                var alarmNo = 'push_' + tabId + '_' + userId;;
                chrome.alarms.create(alarmNo, {
                    "periodInMinutes": self.push_interval
                });
            }
            circle = undefined;
        });
    },
    fetchCircleData: function(account, kind) {
        var m = (kind == 'followers')? '1000000': 'true';
        var url = ["https://plus.google.com",
                   "/u/" + account,
                   "/_/socialgraph/lookup/" + kind + "/",
                   "?m=" + m].join('');

        var defer = $.Deferred();
        $.ajax({
            url: url,
            dataType: 'text',
            success: defer.resolve,
        });
        return defer.promise();
    },
    getCircleData: function(userId) {

        var str = {
            f: new Array,
            c: new Array,
        };

        var kinds = ["f", "c"];
        for (var j in kinds) {
            var kind = kinds[j];
            var loop_count = localStorage[userId + '_' + kind + '_count'];
            for (var i = 0; i < loop_count; i++) {
                str[kind].push(localStorage[userId + '_' + kind + '_' + i]);
            }
        }

        var json = {
            followers: JSON.parse(str['f'].join('')),
            circles: JSON.parse(str['c'].join('')),
            userId: userId,
        };
        return json;
    },
    sendCircleData: function(tabId, circle) {
        log('push circle data:' + tabId);
        chrome.tabs.sendMessage(parseInt(tabId), {data: circle});
    },

};

var log = function(message) {
    var f = function(val) {
        return ('00' + val).substr(-2, 2);
    }
    var dt = new Date();
    var h = f(dt.getHours());
    var m = f(dt.getMinutes());
    var s = f(dt.getSeconds());
    var now = [h, m, s].join(':');
    console.log('[' + now + '] ' + message);
}

var bg = new Background();

chrome.runtime.onMessage.addListener( function( message, sender, sendResponse) {
    if (message.action == 'getValues') {
        sendResponse({values : bg.getValues(message.args)});
    }
});

chrome.webNavigation.onCompleted.addListener(function(nav) {
    if (nav.url.match(/^https\:\/\/(plus|mail)\.google\.com\/(?:[^_])/) &&
        !nav.url.match(/hangouts/)) {
        log('Navigation on complated:' + nav.url)

        var re = new RegExp(/^https?\:\/\/.*?\.google\.com(?:\/mail)?\/u\/([0-9]+?)\//);
        var account = nav.url.match(re)? RegExp.$1: 0;
        log('Google acount: ' + account);

        var push_interval = {
            "periodInMinutes": bg.push_interval,
        };

        var get_interval = {
            "periodInMinutes": bg.get_interval,
        };

        var tabId = nav.tabId;

        $.ajax({
            url: "https://plus.google.com/u/" + account,
        }).done(function(data) {
            var userId = data.match(/data\:\s\[\"(\d+)\"/)? RegExp.$1: 0;

            var circle = localStorage[userId];
            if (circle == undefined || bg.is_first == true) {

                bg.storeCircleData(account, userId, tabId, true);
                bg.is_first = false;

                var alarmNo = 'get_' + account + '_' + userId;
                chrome.alarms.create(alarmNo, get_interval);
            } else if (circle == 'loading') {
                log('waiting fetch data: ' + userId);
                var timer = setInterval(function() {
                    if (localStorage[userId] != 'loading') {
                        clearInterval(timer);
                        bg.sendCircleData(tabId, bg.getCircleData(userId));
                        var alarmNo = 'push_' + tabId + '_' + userId;;
                        chrome.alarms.create(alarmNo, push_interval);
                    }
                }, 500);
            } else {
                log('found userId: ' + userId);
                bg.sendCircleData(tabId, bg.getCircleData(userId));
                var alarmNo = 'push_' + tabId + '_' + userId;;
                chrome.alarms.create(alarmNo, push_interval);
            }
            circle = undefined;
        });
    }
});

chrome.alarms.clearAll();
chrome.alarms.onAlarm.addListener(function(alarm) {
    var args = alarm.name.split('_');
    if (args[0] == 'get') {
        bg.storeCircleData(args[1], args[2]);
    } else if (args[0] == 'push') {
        bg.sendCircleData(args[1], bg.getCircleData(args[2]));
    }
});

chrome.runtime.onInstalled.addListener(function() {
    bg.is_first = true;
});

chrome.runtime.onUpdateAvailable.addListener(function() {
    bg.is_first = true;
});
