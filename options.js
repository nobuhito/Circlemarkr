var config = [
    {
        'name':  'both',
        'str':   '♥',
        'color': "#ffb6c1",
        'type':  'text'},
    {
        'name':  'love',
        'str':   '◀',
        'color': "#778899",
        'type':  'text'},
    {
        'name':  'orz',
        'str':    '▶',
        'color':  "#778899",
        'type':   'text'},
    {
        'name':  'me',
        'str':   '★',
        'color': "#F9F06F",
        'type':  'text'},
    {
        'name':  'fav',
        'str':   '●',
        'color': "#c90926",
        'type':  'textarea'}
];

function $(id) {
    return document.getElementById(id);
}

function save_options() {
    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        localStorage[name] = $(config[i].name).checked;
        localStorage[name + '_str'] = $(name + '_str').value;
        localStorage[name + '_color'] = $(name + '_color').value;
    }
    localStorage["fav_list"] = $('fav_list').value;

    var status = document.getElementById("status");
    status.innerHTML = "保存中.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 500);
}

function restore_options() {

    for (var i=0; i<config.length; i++) {
        var name = config[i].name;
        console.log(name);
        $(name).checked = (localStorage[name] != 'false')? true: false;
        $(name + '_str').value = (localStorage[name + '_str'] || config[i].str);
        $(name + '_color').value = (localStorage[name + '_color'] || config[i].color);
        change_color(name);
    }
    $('fav_list').value = (localStorage['fav_list'] || '');
}

function change_color(kind) {
    $(kind + "_str").style.color = $(kind + "_color").value;
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
    }
    restore_options();
});