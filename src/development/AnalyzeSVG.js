var parser = require('fast-xml-parser');
var he = require('he');
var fs = require('fs');
var path = require('path');
const {exec} = require("child_process");
var SpriteLibrary = require('./SpriteLibrary.js');

// Pfad zur Inkscape-Programmdatei
// let inkscape = '"C:/Program Files/Inkscape/bin/inkscape.exe"';
let inkscape = '"C:/programs_portable/InkscapePortable/bin/inkscape.exe"';


let currentBatchCommand = "";
let batchCommands = [];

function exportSVG(callback, directory){

    // Lese das Directory ein:
    fs.readdir(directory, function (err, files) {
        if (err) {
            console.error("Could not list the directory " + directory, err);
            process.exit(1);
        }
    
        // Nimm nur die Dateien, die auf .svg enden:
        files.filter(filename => filename.endsWith(".svg")).forEach(function (file, index) {
    
            // für jede dieser Dateien:
            let fileWithPath =directory + file;
    
            // Hol den Inhalt als Text
            let svgtext = fs.readFileSync(fileWithPath, 'utf-8');
    
            // Optionen für den XML-Parser
            var options = {
                attributeNamePrefix : "@_",
                attrNodeName: "attr", //default is 'false'
                textNodeName : "#text",
                ignoreAttributes : false,
                ignoreNameSpace : false,
                allowBooleanAttributes : false,
                parseNodeValue : true,
                parseAttributeValue : false,
                trimValues: true,
                cdataTagName: "__cdata", //default is 'false'
                cdataPositionChar: "\\c",
                parseTrueNumberOnly: false,
                arrayMode: false, //"strict"
                attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
                tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
                stopNodes: ["parse-me-as-string"]
            };
    
            // Wandle den XML-Text in einen Javascript-Objektbaum um:
            let svgObject = parser.parse(svgtext, options);
    
            // Analysiere den Javascript-Objektbaum, um herauszufinden, welche Teilgrafiken
            // exportiert werden sollen. Erzeuge für jede Teilgrafik einen Kommandozeilen-Command
            // und lege ihn im Array commands ab.
            currentBatchCommand = inkscape + ' --actions="export-background-opacity:0.0; ';

            analyzeSVGNode(svgObject.svg, fileWithPath);

            currentBatchCommand += '" ' + fileWithPath;
            batchCommands.push(currentBatchCommand);

        });

        // Führe alle Commands im Array commands aus und rufe nach Abschluss des letzten Command
        // callback() auf.
        // Jeder einzelne Command ruft Inkscape auf, um eine einzelne png-Datei zu erzeugen.
        let callback1 = function(){
            if(batchCommands.length > 0){
                doExec(batchCommands.pop(), callback1);
            } else {
                callback();
            }
        }
    
        callback1();
    

    });


    
}


function doExec(command, callback){
    console.log("Executing " + command);
    exec(command, (error, stdout, stderr) => {
        if(error){
            console.log({error: error, stdout: stdout, stderr: stderr});
        }
    // Colors for console.log: https://stackoverflow.com/questions/43528123/visual-studio-code-debug-console-colors/68137902#68137902
    console.log("\u001b[1;32m Done!");
        callback();
    });

}


/**
 * Analysiere die einen Knoten des Objektbaums einer SVG-Datei und bearbeite rekursiv
 * alle Kindknoten. Suche in den Knoten nach SVG-Elementen, die als png-Grafiken exportiert 
 * werden sollen und generiere für jedes dieser Elemente einen Kommandozeilen-Command.
 * Lege diese Commands im Array commands ab.
 */
function analyzeSVGNode(svgNode, fileWithPath) {

    if (Array.isArray(svgNode)) {
        // Rekursiver Aufruf für die Kindknoten
        svgNode.forEach(node => analyzeSVGNode(node, fileWithPath));
        return;
    }

    // SVG-Gruppe?
    if(svgNode.g){
        // Rekursiver Aufruf für die Kindelemente der Gruppe
        if (Array.isArray(svgNode.g)) {
            svgNode.g.forEach(node => analyzeSVGNode(node, fileWithPath));
        } else {
            analyzeSVGNode(svgNode.g, fileWithPath);
        }
    }

    // Hat das SVG-Element ein desc-Feld (Description)? 
    if(svgNode.desc){
        let id = svgNode.attr["@_id"];  // In Inkscape: Feld Objekteigenschaften -> Kennung
        let description = svgNode.desc; // IN Inksape: Feld Objekteigenschaften -> Beschreibung
        let data = {};
        let text = description["#text"];
        if(text){
            // Wandle den JSON-Text im Feld "Beschreibung" in ein Javascript-Objekt um:
            data = JSON.parse(text);
        }

        if(!data.id){
            data.id = id;
        }

        /**
         * Lies die Attributwerte von id, tilesX, tilesY, scale und index aus dem Objekt data und fertige
         * daraus einen Eintrag im Array SpriteLibrary
         */
        if(SpriteLibrary){
            // { filename: "minesweeper/minesweeper.png", name: "Minesweeper", tilesX: 20, tilesY: 1, scale: 1.0, index: 0 },
            SpriteLibrary.push({
                filename: "fromSVG/" + id + ".png", 
                name: id, 
                tilesX: data.tilesX, 
                tilesY: data.tilesY,
                spacingX: data.spacingX,
                spacingY: data.spacingY, 
                scale: data.scale ? data.scale : 1.0, 
                index: data.index,
                extrudeMarginWidth: data.extrudeMarginWidth
            });
        }

        // Generiere den Aufruf von Inkscape zum Export des SVG-Elements als png-Grafik...
        // let arguments = '--export-background-opacity="0.0" --export-id="' + data.id + '" --export-id-only -o "./material/spritesheet_bitmap/fromSVG/' + id + '.png" ' + fileWithPath ;

        currentBatchCommand += 'export-id:' + data.id + '; export-id-only; export-filename: ./material/spritesheet_bitmap/fromSVG/' + id + '.png; export-do;' ;
        
        // ... und lege ihn im Array commands ab.
        // commands.push(inkscape + " " + arguments);
        
    }

}

exports.exportSVG = exportSVG;