// http://d.hatena.ne.jp/umezo/20091115/1258291572
// http://www.eisbahn.jp/yoichiro/2013/02/chrome-extension-event-page.html

var Background = function() {
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
};
var background = new Background();

chrome.extension.onRequest.addListener( function( message, sender, sendResponse) {
    if (message.action == 'getValues') {
        var bgp = background;
        sendResponse({values : bgp.getValues(message.args)});
    }
});
