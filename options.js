function $(id) {
    return document.getElementById(id);
}

function set_options(message) {
    $('status').innerHTML = message;

    var options = {};
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        options[name] = $(name).checked;
        options[name + '_str'] = $(name + '_str').value;
        options[name + '_color'] = $(name + '_color').value;
    }
    options["fav_list"] = $('fav_list').value;
    options["fav_sa"] = $('fav_sa').value;
    options["important_list"] = $('important_list').value;
    options["important_sa"] = $('important_sa').value;

    if ($('storage_sync').checked == true) {

        // console.log('save storage sync');
        save_storage_sync(options);
    } else {
        remove_storage_sync();
        // console.log('save local storage');
        save_local_storage(options);
    }
}

function save_local_storage(options) {
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        localStorage[name] = options[name];
        localStorage[name + '_str'] = options[name + '_str'];
        localStorage[name + '_color'] = options[name + '_color'];
    }
    localStorage["fav_list"] = options["fav_list"];
    localStorage["fav_sa"] = options["fav_sa"];
    localStorage["important_list"] = options['important_list'];
    localStorage["important_sa"] = options['important_sa'];
}

function save_storage_sync(options) {
    chrome.storage.sync.set({options: options}, function() {
        setTimeout(function() {
            $('status').innerHTML = "";
        }, 500);
    });
}

function remove_storage_sync() {
    chrome.storage.sync.clear(function() {
        // console.log('clear storage sync');
    });
}

function save() {
    set_options('保存中...');
}

function reset() {
    get_default();
    set_options('リセット中...');
}

function get_default() {
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        $(name).checked = true;
        $(name + '_str').value = config[i].str;
        $(name + '_color').value = config[i].color;
        change_color(name);
    }
    $('fav_list').value = '';
    $('fav_sa').checked = true;
    $('important_list').value = '';
    $('important_sa').checked = true;
}

function get_local_storage() {
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        $(name).checked = (localStorage[name] != 'false')? true: false;
        $(name + '_str').value = localStorage[name + '_str'] || config[i].str;
        $(name + '_color').value = localStorage[name + '_color'] || config[i].color;
        change_color(name);
    }
    $('fav_list').value = localStorage['fav_list'];
    $('fav_sa').checked = (localStorage['fav_sa'] != 'false')? true: false;
    $('important_list').value = localStorage["important_list"];
    $('important_sa').checked = (localStorage['important_sa'] != 'false')? true: false;
}

function get_storage_sync(options) {
    $('storage_sync').checked = true;
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        $(name).checked = options[name];
        $(name + '_str').value = options[name + '_str'] || config[i].str;
        $(name + '_color').value = options[name + '_color'] || config[i].color;
        change_color(name);
    }
    $('fav_list').value = options['fav_list'];
    $('fav_sa').checked = options['fav_sa'];
    $('important_list').value = options["important_list"];
    $('important_sa').checked = options['important_sa'];
}

function read_options() {
    chrome.storage.sync.get('options', function(data) {

	      var options = data.options;
	      if (options) {

	          // console.log('found sync');
            get_storage_sync(options);

	      } else if (localStorage['me']) {

	          // console.log('found local');
	          get_local_storage();

	      } else {

	          // console.log('found default');
	          get_default();

	      }
    });
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
//    chrome.storage.sync.remove('options', function(data) {
//	console.log('remove sync data');
//    });
    $('submit').addEventListener('click', save);
    $('reset').addEventListener('click', reset);
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
    read_options();
});
