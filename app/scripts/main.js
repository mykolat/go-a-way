// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
var tmpl = function () {
    var cache = {};

    return {
        render: function (str, data) {
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] = cache[str] ||
                tmpl.render(document.getElementById(str).innerHTML) :

                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +

                    // Introduce the data as local variables using with(){}
                    "with(obj){p.push('" +

                    // Convert the template into pure JavaScript
                    str
                    .replace(/[\r\t\n]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t").join("');")
                    .split("%>").join("p.push('")
                    .split("\r").join("\\'")
                    + "');}return p.join('');");

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        }
    };
}();

$(function () {

    var dataObject = {
        members: [
        { id: 1, name: "hoge", text: "aaaaaaaaaaaaaa" },
        { id: 9, name: "fuga", text: "bbbbbbbbbbbbbb" },
        { id: 15, name: "hoge", text: "cccccccccccccc" },
        { id: 22, name: "fuga", text: "dddddddddddddd" },
        { id: 78, name: "hoge", text: "eeeeeeeeeeeeee" },
        { id: 876, name: "fuga", text: "ffffffffffffff" },
        { id: 1033, name: "hoge", text: "gggggggggggggg" },
        { id: 7899, name: "fuga", text: "hhhhhhhhhhhhhh" }
        ]
    };

    var results = document.getElementById("results");
    results.innerHTML = tmpl.render("item_tmpl", dataObject);

    /* point-carousel */
    $("#point-carousel").mCustomScrollbar({ axis: "x" });

});
