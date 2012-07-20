function $(id) {
    return document.getElementById(id);
}

function save_options() {
    localStorage["both"] = $('both').checked;
    localStorage["love"] = $('love').checked;
    localStorage["orz"]  = $('orz').checked;
    localStorage["me"]   = $('me').checked;
    localStorage["fav"]  = $('fav').checked;

    localStorage["both_str"] = $('both_str').value;
    localStorage["love_str"] = $('love_str').value;
    localStorage["orz_str"]  = $('orz_str').value;
    localStorage["me_str"]   = $('me_str').value;
    localStorage["fav_str"]  = $('fav_str').value;

    localStorage["fav_list"] = $('fav_list').value;

    var status = document.getElementById("status");
    status.innerHTML = "保存中.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 500);

}

function restore_options() {

    $('both').checked = (localStorage["both"] != 'false')? true: false;
    $('love').checked = (localStorage["love"] != 'false')? true: false;
    $('orz').checked  = (localStorage["orz"]  != 'false')? true: false;
    $('me').checked   = (localStorage["me"]   != 'false')? true: false;
    $('fav').checked  = (localStorage["fav"]  != 'false')? true: false;

    $('both_str').value = (localStorage['both_str'] || '♥');
    $('love_str').value = (localStorage['love_str'] || '◀');
    $('orz_str').value  = (localStorage['orz_str']  || '▶');
    $('me_str').value   = (localStorage['me_str']   || '★');
    $('fav_str').value  = (localStorage['fav_str']  || '●');

    $('fav_list').value = (localStorage['fav_list'] || '');
}

document.addEventListener('DOMContentLoaded', function() {
    restore_options();
    $('submit').addEventListener('click', save_options);
});