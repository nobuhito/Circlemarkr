var circles = [];
var followers = [];
var news = [];
var favs = [];
var importants = [];
var circle_data = {};
var user_data = {};
var userid = 0;
var show = [];
var args = {};

for (var i=0; i<config.length; i++) {
    args[config[i].name] = true;
    args[config[i].name + '_str'] = config[i].str;
    args[config[i].name + '_color'] = config[i].color;
}
args.fav_list = '';
args.fav_sa = true;
args.important_list = '';
args.important_sa = true;

chrome.storage.sync.get('options', function(data) {

    if (data.options) {
        // console.log('read storage sync');
	      // Chrome storage.syncに移行済み
	      show = data.options;
	      start();
    } else {
        // console.log('read local storage');

	      // 以前のバックグラウンドデータを読み込み
	      chrome.extension.sendRequest({
	          action: "getValues",
	          args: [args]
	      }, function(response) {
	          show = response.values;
	          start();
	      });
    }
});

function start() {
    addStyle();

    favs = show['fav_list'].split("\n");

    getData('circles');
    getData('followers');
    setInterval(function() { getData('circles')}, 1000 * 60 * 60);
    setInterval(function() { getData('followers')}, 1000 * 60 * 60);

    setInterval(function() { doMark('a', 'oid') }, 1000);
    setInterval(function() { doMark('a', 'o') }, 1000);
    setInterval(function() { doMark('div', 'oid') }, 1000);
}

function addStyle() {
    var style = document.createElement("style");
    style.innerHTML = '';
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        style.innerHTML += "span.myMark" + name + "{color:" + show[name + '_color'] + ";padding-left:3px}";
        style.innerHTML += "span.myPointer{cursor: pointer}";
    }
    document.getElementsByTagName("head")[0].appendChild(style);
}

// マーク追加
function addMark(elem, str, kind, circles) {
    elem.classList.add('myMark');
    if (str) {
        var span = document.createElement('span');
        span.classList.add('myMark' + kind);
        span.classList.add('myPointer');
        if (circles && circles.length > 0) span.setAttribute('title', circles.join(', '));
        var mark = document.createTextNode(str);
        span.appendChild(mark);
        if (elem.tagName == 'DIV' || elem.tagName == 'div') {
            if (elem.childNodes.length > 1) {
                elem.childNodes[1].insertBefore(span);
            } else {
                elem.childNodes[0].insertBefore(span);
            }
        } else {
            elem.parentNode.insertBefore(span, elem.nextSibling);
        }
    }
}

// マーク追加判定
function doMark(elm, attr) {
    // G+のユーザーIDを持ってるリンクをリストアップ
    var link = document.querySelectorAll(elm + "[" + attr + "]:not(.myMark)");
    // var link = document.querySelectorAll("a[oid][rel$='nofollow']:not(.myMark)");
    if (circles.length > 0 && followers.length > 0) {
        for (i=0; i<link.length; i++) {
            var oid = link[i].getAttribute(attr);

            // aリンクでimgタグを持ってる時は加工しない
            if (elm == 'a' && link[i].innerHTML != link[i].innerText) { addMark(link[i], null, null); continue }

            // コメントの返信の時はスキップ(Replies and more for Google+の問題？っぽくて効果なし)
            // if (link[i].classList.contains('btnplus' + oid)) { continue }

            var circles_fg   = (circles.indexOf(oid) >= 0)? true: false;
            var followers_fg = (followers.indexOf(oid) >= 0)? true: false;
            var myid_fg      = (oid == userid)? true: false;

            if (show['important'] && importants.indexOf(oid) >= 0 && show['important_sa']) {
                addMark(link[i], show['important_str'], 'important', []);
            }

            if (show['fav'] && favs.indexOf(oid) >= 0 && show['fav_sa']) {
                addMark(link[i], show['fav_str'], 'fav', []);
            }

            var c = (circles.indexOf(oid) >= 0)? user_data[oid]['circle_names']: [];

            if (show['important'] && importants.indexOf(oid) >= 0 && !show['important_sa']) {
                // 指定したサークル
                addMark(link[i], show['important_str'], 'important', []);
            } else if (show['fav'] && favs.indexOf(oid) >=0 && !show['fav_sa']) {
                // 指定したユーザー
                addMark(link[i], show['fav_str'], 'fav', []);
            } else {
                if      (circles_fg && followers_fg) { if (show['both']) addMark(link[i], show['both_str'], 'both', c) } // 両想い
                else if (circles_fg)                 { if (show['love']) addMark(link[i], show['love_str'], 'love', c) } // 片想い
                else if (followers_fg)               { if (show['orz']) addMark(link[i], show['orz_str'], 'orz', c) } // ストーカー
                else if (myid_fg)                    { if (show['me']) addMark(link[i], show['me_str'], 'me', []) } // 自分
                else                                                             { addMark(link[i], '', null, []) } // 他人
            }

        }
    }
}


// アカウント切替の対応
function getAccount() {
    var account = location.href.match(/https?:\/\/plus.google.com\/u\/([0-9]+?)\//);
    return (account)? account[1]: 0;
}

// ユーザー配列作成
function createUserList(kind, res) {
    var data = eval('//' + res);
    var list;

    var list = data[0][1];
    if (kind == 'followers') {
        for (i=0; i< list.length; i++) {
            if (list[i][0] != null && list[i][0] !== void 0) {
                eval(kind + ".push(list[i][0][2])");
            }
        }
    }

    var list = data[0][2];
    for (i = 0; i < list.length; i++) {

        var c = function(data, type) {
            var a = [];
            for (var j=0; j<data.length; j++) {
                a.push((type=='names')? circle_data[data[j][2][0]]:
                                        data[j][2][0]);
            }
            return a;
        };

        if (kind == 'circles') {
            user_data[list[i][0][2]] = {
                'name': list[i][2][0],
                'weight': list[i][2][3],
                'circle_ids': c(list[i][3], 'ids'),
                'circle_names': c(list[i][3], 'names')
            }
        }

        if (list[i][0] != null && list[i][0] !== void 0) {
            eval(kind + ".push(list[i][0][2])");
        }
    }
}

function createCircleList(res) {
    var data = eval('//' + res);
    var circle_list = data[0][1];
    var user_list = data[0][2];
    var important_names = show['important_list'].split("\n");

    var ids = [];
    for (i=0; i < circle_list.length; i++) {
        circle_data[circle_list[i][0][0]] = circle_list[i][1][0];
        if (important_names.indexOf(circle_list[i][1][0]) >= 0) {
            ids.push(circle_list[i][0][0]);
        }
    }

    for (i=0; i<user_list.length; i++) {
        var c = user_list[i][3];
        for (j=0; j<c.length; j++) {
            if (ids.indexOf(c[j][2][0]) >= 0) {
                importants.push(user_list[i][0][2]);
            }
        }
    }
}

// データ取得
function getData(kind) {
    var ajax1 = new XMLHttpRequest();
    ajax1.onreadystatechange = function() {
        if (ajax1.readyState == 4 && ajax1.status == 200) {
            if(ajax1.responseText.match(/\"(AObGSA.*:\d*)\"/)){
                var sendid = RegExp.$1;   		 //SendIdの取得
                userid = (ajax1.responseText.match(/data\:\s\[\"(\d+)\"/))? RegExp.$1: 0;

                var ajax2 = new XMLHttpRequest();
                ajax2.onreadystatechange = function() {
                    if (ajax2.readyState == 4 && ajax2.status == 200) {
                        if (kind == 'circle') {
                            createCircleList(ajax2.responseText);
                        }
                        createUserList(kind, ajax2.responseText);
                    }
                };

                var reqid = new Date().getTime() % 1000000;
                var url = "https://plus.google.com/u/" + getAccount() + "/_/socialgraph/lookup/" + kind + "/";
                var param = (kind == 'followers')? 'm=1000000': 'm=true';

                ajax2.open('GET', url + '?' + param, true);
                ajax2.send(null);
            }
        };
    };

    ajax1.open('GET', "https://plus.google.com/", true);
    ajax1.send();
}
