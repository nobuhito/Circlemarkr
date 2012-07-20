var circles = [];
var followers = [];
var userid = 0;
var show = [];

chrome.extension.sendRequest({
    action: "getValues",
    args  : [{
        'both' : 'true',
        'love' : 'true',
        'orz'  : 'true',
        'me'   : 'true',
        'both_str': '♥',
        'love_str': '◀',
        'orz_str': '▶',
        'me_str': '★'
    }]
}, function(response) {
    show = response.values;

    getData('circles');
    getData('followers');

    setInterval(doMark, 500);
});

// マーク追加
function addMark(elem, str) {
    elem.classList.add('myMark');
    if (str) elem.innerHTML += ' ' + str;
}

// マーク追加判定
function doMark() {
    // G+のユーザーIDを持ってるリンクをリストアップ
    var link = document.querySelectorAll("a[oid]:not(.myMark)");
    // var link = document.querySelectorAll("a[oid][rel$='nofollow']:not(.myMark)");
    if (circles.length > 0 && followers.length > 0) {
        for (i=0; i<link.length; i++) {
            var oid = link[i].getAttribute('oid');

            // imgタグを持ってる時は加工しない
            if (link[i].innerHTML != link[i].innerText) { addMark(link[i], null); continue }

            // コメントの返信の時はスキップ(Replies and more for Google+の問題？っぽくて効果なし)
            // if (link[i].classList.contains('btnplus' + oid)) { continue }

            var circles_fg   = (circles.indexOf(oid) >= 0)? true: false;
            var followers_fg = (followers.indexOf(oid) >= 0)? true: false;
            var myid_fg      = (oid == userid)? true: false;

            if      (circles_fg && followers_fg) { if (show['both'] == 'true') addMark(link[i], show['both_str']) } // 両想い
            else if (circles_fg)                 { if (show['love'] == 'true') addMark(link[i], show['love_str']) } // 片想い
            else if (followers_fg)               { if (show['orz']  == 'true') addMark(link[i], show['orz_str']) } // ストーカー
            else if (myid_fg)                    { if (show['me']   == 'true') addMark(link[i], show['me_str']) } // 自分
            else                                                             { addMark(link[i], null) } // 他人
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
    var data = eval('//' + res)
    var list = data[0][2];
    for (i = 0; i < list.length; i++) {
        if (list[i][0] != null && list[i][0] !== void 0) {
            eval(kind + ".push(list[i][0][2])");
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
                // if (ajax1.responseText.match(/data\:\s\[\"(\d+)\"/)) {
                //     userid = RegExp.$1;
                // } else {
                //     userid = 0;
                // }
                // userid = ? RegExp.$1: 0; // ユーザーIDの取得

                var ajax2 = new XMLHttpRequest();
                ajax2.onreadystatechange = function() {
                    if (ajax2.readyState == 4 && ajax2.status == 200) {
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
