let base = "https://embed.learnj.de/include/";

// includeJs(base + "lib/pixijs/pixi.js");
// includeCss(base + 'js.webpack/javaOnlineEmbedded.css');
// includeJs(base + "lib/jquery/jquery-3.3.1.js");
// includeJs(base + "lib/markdownit/markdownit.min.js");
// includeJs(base + "lib/monaco-editor/dev/vs/loader.js");
// includeJs(base + "js/runtimelibrary/graphics/SpriteLibrary.js");
// includeJs(base + "lib/howler/howler.core.min.js");

let scripts = [
    base + "lib/pixijs/pixi.js",
    base + 'js.webpack/javaOnlineEmbedded.css',
    base + "lib/jquery/jquery-3.3.1.js",
    base + "lib/markdownit/markdownit.min.js",
    base + "lib/monaco-editor/dev/vs/loader.js",
    base + "js/runtimelibrary/graphics/SpriteLibrary.js",
    base + "lib/howler/howler.core.min.js"
]

includeJsAndCss(scripts, () => {
    window.onload = function () {
        if (window.jo_doc.startsWith("http")) {
            $.ajax({
                url: window.jo_doc,
                type: "get",
                dataType: 'text',
                success: function (data) {
                    initScripts(data);
                },
                error: function () {
                    alert("Fehler beim Laden von " + jo_doc);
                }
            });
        } else {
            initScripts(window.jo_doc);
        }
    };
});

function initScripts(jo_doc) {
    let scriptPosition = jo_doc.indexOf('<script');
    let scripts = jo_doc.substr(scriptPosition);
    let config = jo_doc.substr(0, scriptPosition);
    if (config.indexOf('{') < 0) {
        config = "{}";
    }
    let htmlElement = document.getElementsByTagName('html')[0];
    let bodyElement = document.getElementsByTagName('body')[0];
    /** @type HTMLDivElement */
    let divElement = document.createElement('div');
    divElement.classList.add('java-online');
    divElement.setAttribute("data-java-online", config);
    divElement.style.margin = "0 0 0 15px";
    divElement.style.width = "calc(100% - 40px)";
    divElement.style.height = "calc(100% - 45px)";
    divElement.style.top = "15px";
    bodyElement.appendChild(divElement);
    divElement.innerHTML = scripts;
    // document.body.innerHTML = window.jo_doc;
    // divElement = document.getElementsByClassName('java-online')[0];
    htmlElement.style.height = "100%";
    htmlElement.style.margin = "0";
    bodyElement.style.height = "100%";
    bodyElement.style.margin = "0";
    window.javaOnlineDir = base;
    includeJs(base + "js.webpack/javaOnline-embedded.js");
    includeJs(base + "lib/p5.js/p5.js");

}

function includeJs(src, callback, type) {
    var script = document.createElement('script');
    if (callback) {
        script.onload = function () {
            //do stuff with the script
        };
    }

    if (type) {
        script.type = type;
    }

    script.src = src;

    document.head.appendChild(script);
}

function includeCss(src) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = src;
    link.media = 'all';
    head.appendChild(link);
}


function includeJsAndCss(urlList, callback){

    if(urlList.length > 0){
        let url = urlList.shift();
        if(url.endsWith('.js')){
            includeJs(url, () => {
                includeJsAndCss(urlList, callback);
            })
        } else {
            includeCss(url);
            includeJsAndCss(urlList, callback);
        }
    } else {
        callback();
    }

}