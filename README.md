# Online-IDE
Java-ähnliche Programmiersprache (Compiler, Interpreter, Debugger) mit IDE, die **komplett im Browser** ausgeführt wird.

## Anwendungsbeispiel
Die Java-ähnliche Programmiersprache ist im [LearnJ-Wiki](https://www.learnj.de) ausführlich beschrieben und dort ist die IDE auch vielfach zu sehen. Hier [ein schönes Beispiel des vollen Funktionsumfangs!](https://www.learnj.de/doku.php?id=api:documentation:grafik:animation#beispiel_4feuerwerk)

## Integration in eigene Webseiten
Im Header der Webseite müssen die verwendeten Bibliotheken geladen werden:
```html
<head>
    <meta charset='utf-8'>
    <title>Embedded-Test</title>
    <meta name='viewport' content='width=device-width, initial-scale=1'>

    <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.js" as="script">
    <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js" as="script">

    <script src="lib/pixijs/pixi.js"></script>

    <link rel='stylesheet' type='text/css' media='screen' href='js.webpack/javaOnlineEmbedded.css'>
    <script src="lib/jquery/jquery-3.3.1.js"></script>
    <script src="lib/markdownit/markdownit.min.js"></script>
    <script src="lib/monaco-editor/dev/vs/loader.js"></script>
    <script src="js/runtimelibrary/graphics/SpriteLibrary.js"></script>
    <script src="lib/howler/howler.core.min.js"></script>
    <script src="lib/p5.js/p5.js"></script>

    <script type="module" src="js.webpack/javaOnline-embedded.js"></script>

</head>
```
Alle divs innerhalb des `<body>`-Elements, die die Klasse `java-online` tragen, werden nach dem `DOMContentLoaded`-Event automatisch in IDEs umgewandelt. Die Java-Quelltexte werden in `<script>`-Tags innerhalb der divs verpackt. 

### Minimal-Beispiel
```html
<div class="java-online" style="width: calc(100% - 10px); height: 150px; margin-left: 5px"
data-java-online="{
    'id': 'Beispiel_1',        // eindeutige ID IndexedDB
    'withBottomPanel': false   // ohne unteres Panel mit Console, Error-Tab usw.
}">
<script type="text/plain" title="Test1">
for(int i = 0; i < 10; i++){
    println("Das ist Zeile " + (i + 1));
}
</script>
</div>
```
