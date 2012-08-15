function $(id) {
    return document.getElementById(id);
}

function save_options() {
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        localStorage[name] = $(name).checked;
        localStorage[name + '_str'] = $(name + '_str').value;
        localStorage[name + '_color'] = $(name + '_color').value;
    }
    localStorage["fav_list"] = $('fav_list').value;
    localStorage["fav_sa"] = $('fav_sa').value;
    localStorage["important_list"] = $('important_list').value;
    localStorage["important_sa"] = $('important_sa').value;

    var status = document.getElementById("status");
    status.innerHTML = "保存中.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 500);
}

function restore_options() {

    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        $(name).checked = (localStorage[name] != 'false')? true: false;
        $(name + '_str').value = (localStorage[name + '_str'] || config[i].str);
        $(name + '_color').value = (localStorage[name + '_color'] || config[i].color);
        change_color(name);
    }
    $('fav_list').value = (localStorage['fav_list'] || '');
    $('fav_sa').checked = (localStorage['fav_sa'] != 'false')? true: false;
    $('important_list').value = (localStorage["important_list"] || '');
    $('important_sa').checked = (localStorage['important_sa'] != 'false')? true: false;
}

function change_color(kind) {
    $(kind + "_str").style.color = $(kind + "_color").value;
}

function resize_textarea(el) {
    var value = el.value;
    var lines = 2;
    for (var i = 0, l = value.length; i < l; i++) {
        if (value.charAt(i) == "\n") lines++;
    }
    el.setAttribute("rows", lines);
}

document.addEventListener('DOMContentLoaded', function() {
    $('submit').addEventListener('click', save_options);
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        $(name + '_color').addEventListener(
            'change',
            function() {
                change_color(this.id.split('_')[0]);
            });
        if (name == 'fav' || name == 'important') {
            $(name + '_list').addEventListener(
                'keyup',
                function() {
                    resize_textarea(this);
                });
        }
    }
    restore_options();
});