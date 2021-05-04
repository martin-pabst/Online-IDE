
let base = "https://online-ide.de/";

includeJs("lib/monaco-editor/dev/vs/editor/editor.main.js");
includeJs("lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js");
includeJs("lib/pixijs/pixi.js");
includeCss('js.webpack/javaOnlineEmbedded.css');
includeJs("lib/jquery/jquery-3.3.1.js");
includeJs("lib/markdownit/markdownit.min.js");
includeJs("lib/monaco-editor/dev/vs/loader.js");
includeJs("js/runtimelibrary/graphics/SpriteLibrary.js");
includeJs("lib/howler/howler.core.min.js");
includeJs("lib/p5.js/p5.js");
includeJs("js.webpack/javaOnline-embedded.js", null, "module");

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
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = src;
    link.media = 'all';
    head.appendChild(link);
}