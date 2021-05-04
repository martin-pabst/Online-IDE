
let base = "https://learnj.de/javaonline/";

// includeJs("lib/monaco-editor/dev/vs/editor/editor.main.js");
// includeJs("lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js");
includeJs(base + "lib/pixijs/pixi.js");
includeCss(base + 'js.webpack/javaOnlineEmbedded.css');
includeJs(base + "lib/jquery/jquery-3.3.1.js");
includeJs(base + "lib/markdownit/markdownit.min.js");
includeJs(base + "lib/monaco-editor/dev/vs/loader.js");
includeJs(base + "js/runtimelibrary/graphics/SpriteLibrary.js");
includeJs(base + "lib/howler/howler.core.min.js");
includeJs(base + "lib/p5.js/p5.js");

window.onload = function(){
    // debugger;
    // let iframes = window.parent.document.getElementsByTagName('iframe');
    // for(let i = 0; i < iframes.length; i++){
    //     let iframe = iframes[i];
    //     if(iframe.contentWindow == this){
    //         document.body.innerHTML = iframe.textContent;
    //     }
    // }

    // document.body.innerHTML = window.frameElement.textContent;
    document.body.innerHTML = window.jo_doc;
    window.javaOnlineDir = "https://learnj.de/javaonline/";
    includeJs(base + "js.webpack/javaOnline-embedded.js");
};

// <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.js" as="script">
// <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js" as="script">

// <script src="lib/pixijs/pixi.js"></script>

// <link rel='stylesheet' type='text/css' media='screen' href='js.webpack/javaOnlineEmbedded.css'>
// <script src="lib/jquery/jquery-3.3.1.js"></script>
// <script src="lib/markdownit/markdownit.min.js"></script>
// <script src="lib/monaco-editor/dev/vs/loader.js"></script>
// <script src="js/runtimelibrary/graphics/SpriteLibrary.js"></script>
// <script src="lib/howler/howler.core.min.js"></script>
// <script src="lib/p5.js/p5.js"></script>

// <script type="module" src="js.webpack/javaOnline-embedded.js"></script>


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