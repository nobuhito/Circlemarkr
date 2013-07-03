var Circlemarkr = (function() {
    function Circlemarkr() {}

    Circlemarkr.prototype.init = function(config, show) {
        var cm = this;
        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                cm.setData(request.data);
                sendResponse({status: 'OK'});
                return true;
        });

        this.myMark = 'myMark';
        this.myPointer = 'myPointer';
        this.account = this.getAccount();
        this.show = show;
        this.refreshInterval = 1000 * 60 * 60; // 1h

        this.circles = [];
        this.followers = [];
        this.newers = [];
        this.importants = [];
        this.favs = [];

        this.circle_data = [];
        this.user_data = [];

        this.addStyle(config);
    };

    Circlemarkr.prototype.getMyMark = function() {
        return this.myMark;
    };

    Circlemarkr.prototype.setMyMark = function(elem) {
        elem.classList.add(this.myMark);
    };

    Circlemarkr.prototype.isActive = function() {
        var f = this.followers.length || 0;
        var c = this.circles.length || 0;
        if (f > 0 && c > 0){
            return true;
        } else {
            return false;
        }
    };

    Circlemarkr.prototype.addMark = function(elem, oid, flag) {
        var flag = flag || this.getFlag(oid);
        var c = [];
        if (this.circles.indexOf(oid) >= 0) {
            c = this.user_data[oid]['circle_names'];
        }
        var span = document.createElement('span');
        span.classList.add(this.myMark + flag);
        span.classList.add(this.myPointer);
        if (c.length > 0) {
            span.setAttribute('title', c.join(', '));
        }
        var mark = document.createTextNode(this.show[flag + '_str']);
        span.appendChild(mark);
        if (elem.tagName.match(/div/i)) {

            if (location.href.match(/events/)) {
                // イベントの参加者一覧
                elem.childNodes[0].childNodes[0].insertBefore(span);
//            } else if (elem.childNodes.length == 2) {
            } else if (location.href.match(/communities/)) {
                // コミュニティのメンバ一覧
                elem
                    .parentNode
                    .childNodes[1].childNodes[0].childNodes[0]
                    .insertBefore(span);
            } else if (elem.childNodes.length > 1) {
                // サークル管理ページ
                elem.childNodes[5].insertBefore(span);
            } else {
                elem.parentNode.insertBefore(span, elem.nextSibling);
            }
        } else {
            elem.parentNode.insertBefore(span, elem.nextSibling);
        }
    };

    Circlemarkr.prototype.addStyle = function(config) {
        var style = document.createElement('style');
        style.innerHTML = '';
        var str = '';
        for (var i = 0; i < config.length; i++) {
            var name = config[i].name;
            str += "span." + this.myMark + name + " {";
            str += "  color: " + this.show[name + '_color'] + ";";
            str += "  padding-left:3px;";
            str += "  padding-right:3px;";
            str += "}";
            str += "span." + this.myPointer + " {cursor: pointer}";
            style.innerHTML = str;
        }
        document.getElementsByTagName("head")[0].appendChild(style);
    };

    Circlemarkr.prototype.isNewer = function(id) {
        return (this.newers.indexOf(id) >= 0)? true: false;
    };

    Circlemarkr.prototype.isMe = function(id) {
        return (this.userId == id)? true: false;
    };

    Circlemarkr.prototype.isImportant = function(id) {
        return (this.importants.indexOf(id) >= 0)? true: false;
    };

    Circlemarkr.prototype.isFavorite = function(id) {
        return (this.favs.indexOf(id) >= 0)? true: false;
    };

    Circlemarkr.prototype.getFlag = function(id) {
        if (this.circles.indexOf(id) >= 0 && this.followers.indexOf(id) >= 0) {
            return 'both';       // both
        }
        else if (this.circles.indexOf(id) >= 0) {
            return 'love';       // orz
        }
        else if (this.followers.indexOf(id) >= 0) {
            return 'orz';       // love
        }
        else {
            return undefined;
        }
    };

    Circlemarkr.prototype.getAccount = function() {
        var re = new RegExp(/https?:\/\/plus.google.com\/u\/([0-9]+?)\//);
        return location.href.match(re)? RegExp.$1: 0;
    };

    Circlemarkr.prototype.getUserId = function(res) {
        return res.match(/data\:\s\[\"(\d+)\"/)? RegExp.$1: 0;
    };

    Circlemarkr.prototype.createNewFollowList = function(res) {
        var data = res;
        var list = data[0][1];

        for (var i = 0; i < list.length; i++) {
            if (list[i][0] != null && list[i][0] !== void 0) {
                this.followers.push(list[i][0][2]);
                this.newers.push(list[i][0][2]);
            }
        }
    };

    Circlemarkr.prototype.createUserList = function(kind, res) {
        var data = res;
        var list;

        var c = function(data, type, cd) {
            var a = [];
            for (var j = 0; j < data.length; j++) {
                var ret;
                if (type == 'names') {
                    ret = cd[data[j][2][0]];
                } else {
                    ret = data[j][2][0];
                }

                a.push(ret);
            }
            return a
        };

        list = data[0][2];
        for (var i = 0; i < list.length; i++) {
            if (kind == 'circles') {
                this.user_data[list[i][0][2]] = {
                    name: list[i][2][0],
                    weight: list[i][2][3],
                    circle_ids: c(list[i][3], 'ids', this.circle_data),
                    circle_names: c(list[i][3], 'names', this.circle_data),
                };
            }

            if (list[i][0] != null && list[i][0] !== void 0) {
                eval('this.' + kind + ".push(list[i][0][2])");
            }
        }
    };

    Circlemarkr.prototype.createCircleList = function(res) {
        var data = res;
        var circle_list = data[0][1];
        for (var i = 0; i < circle_list.length; i++) {
            this.circle_data[circle_list[i][0][0]] = circle_list[i][1][0];
        }
    };

    Circlemarkr.prototype.createImportantList = function(res) {
        var data = res;
        var circle_list = data[0][1];
        var user_list = data[0][2];

        var ids = [];
        var important_names = this.show['important_list'].split("\n");

        for (var i = 0; i < circle_list.length; i++) {
            if (important_names.indexOf(circle_list[i][1][0]) >= 0) {
                ids.push(circle_list[i][0][0]);
            }
        }
        for (var i = 0; i < user_list.length; i++) {
            var c = user_list[i][3];
            for (var j = 0; j < c.length; j++) {
                if (ids.indexOf(c[j][2][0]) >=0) {
                    this.importants.push(user_list[i][0][2]);
                }
            }
        }
    };

    Circlemarkr.prototype.createFavList = function() {
        this.favs = show['fav_list'].split("\n");
    };

    Circlemarkr.prototype.setData = function(data) {
        var json = JSON.parse(data);
        this.userId = json.userId;
        this.createCircleList(json.circles);
        this.createImportantList(json.circles);
        this.createNewFollowList(json.followers);
        this.createUserList('circles', json.circles);
        this.createUserList('followers', json.followers);
        this.createFavList();
    };

    return Circlemarkr;

})();

var args = {
    fav_list: '',
    fav_sa: true,
    important_list: '',
    important_sa: true,
    debug: true,
}
for (var i = 0; i < config.length; i++) {
    args[config[i].name] = true;
    args[config[i].name + '_str'] = config[i].str;
    args[config[i].name + '_color'] = config[i].color;
}


var url = location.href;
if (!url.match(/^https\:\/\/plus\.google\.com\/hangouts/)) {
    var init_delay = (url.match(/(notifications|apps\-static)/))?
//        Math.floor( Math.random() * 10000 ): 0;
        0:0;

    setTimeout(function() {
        chrome.storage.sync.get('options', function(data) {
            if (data.options) {
	              show = args;
	              for (var key in data.options) {
		                show[key] = data.options[key];
	              }
                start(show);
            } else {
                chrome.runtime.sendMessage({
                    action: "getValues",
                    args: args
                }, function(response) {
                    show = response.values;
                    for (var i in show) {
                        show[i] = (show[i] == "true")? true: show[i];
                    }
                    start(show);
                });
            }
        });
    }, init_delay);
}

var timer = 0;
function start(show) {
    var circlemarkr = new Circlemarkr();
    circlemarkr.init(config, show);

    document.addEventListener('DOMSubtreeModified', function(event) {
        var start = new Date();
        run(circlemarkr, event.target);
        var end = new Date();
        timer = 0;
    }, true);
}

function run(circlemarkr, target) {
    if (!circlemarkr.isActive()) return;
    var options = [
        {tag: 'a', attr: 'oid'},
        {tag: 'a', attr: 'o'},
        {tag: 'div', attr: 'oid'},
    ];
    for (var i = 0; i < options.length; i++) {
        var elm = options[i].tag;
        var attr = options[i].attr;
        var selector = elm + '[' + attr + ']';
        selector += ':not(.' + circlemarkr.getMyMark() + ')';
        try {
            var link = target.querySelectorAll(selector);
        } catch(e) {
            console.log(target);
        }

        if (link == undefined) continue;

        for (var j = 0; j < link.length; j++) {

            circlemarkr.setMyMark(link[j]);

            if (elm == 'a' && link[j].innerHTML != link[j].innerText) {
                continue;
            }

            var oid = link[j].getAttribute(attr);

            var marks = ['both', 'love', 'orz'];
            for (var k = 0; k < marks.length; k++ ) {
                var key = marks[k];
                if (circlemarkr.getFlag(oid) ==key && circlemarkr.show[key]) {
                    circlemarkr.addMark(link[j], oid, key);
                }
            }

            if (circlemarkr.isMe(oid) && circlemarkr.show['me']) {
                circlemarkr.addMark(link[j], oid, 'me');
            }

            if (circlemarkr.isImportant(oid) && circlemarkr.show['important']) {
                circlemarkr.addMark(link[j], oid, 'important');
            }

            if (circlemarkr.isFavorite(oid) && circlemarkr.show['fav']) {
                circlemarkr.addMark(link[j], oid, 'fav');
            }

            if (circlemarkr.isNewer(oid) && circlemarkr.show['newer']) {
                circlemarkr.addMark(link[j], oid, 'newer');
            }
        }
    }
}

function log(message) {
    if (args.debug != undefined && args.debug == true) {
        console.log(message);
    }
}
