import * as fs from 'fs';
import Spritesmith from 'spritesmith';
import {SpriteLibrary} from '../client/runtimelibrary/graphics/SpriteLibrary.js';
import * as marginExtruder from './marginExtruder.js';

// Load in dependencies
// var fs = require('fs');
// var Spritesmith = require('spritesmith');
// var SpriteLibrary = require('../client/runtimelibrary/graphics/SpriteLibrary.js');
// var marginExtruder = require('./marginExtruder.js');

let dir = "./material/spritesheet-files/"
let output_dir = "./include/graphics/"
let cssGraphicURL = "../graphics/spritesheet.png"
let cssFilename = "./include/css/imagesprites.css"

// Generate our spritesheet

let src = [];
let filenameToNameMap = {};
let filenameToTilesMap = {};

let filenameToCssInfoMap = {};
let filenameToExtrudeMarginWidthMap = {};
let extrudeMarginInformation = [];
for (let sle of SpriteLibrary) {
    src.push(dir + sle.filename);
    let name = sle.name;
    let index = sle.index;
    let tilesX = sle.tilesX;
    let tilesY = sle.tilesY;
    if (typeof tilesX == "undefined") {
        if (typeof index != "undefined") {
            name += "#" + index;
        } else {
            name += "#0";
        }
    } else {
        filenameToTilesMap[sle.filename] = {
            minIndex: index,
            tilesX: tilesX,
            tilesY: tilesY,
            spacingX: sle.spacingX || 0,
            spacingY: sle.spacingY || 0,
            firstYThenX: sle.firstYThenX || false,
            skipAtEnd: sle.skipAtEnd || 0
        }
    }
    filenameToNameMap[sle.filename] = name;
    filenameToCssInfoMap[sle.filename] = { name: sle.name, index: index, scale: sle.scale, indexName: sle.indexName };
    if (sle.extrudeMarginWidth > 0) {
        filenameToExtrudeMarginWidthMap[sle.filename] = sle.extrudeMarginWidth;
    }

}

Spritesmith.run({
    src: src,
    padding: 2,
    //   algorithm: 'alt-diagonal'
}, function handleResult(err, result) {
    // If there was an error, throw it
    if (err) {
        throw err;
    }

    let filename1 = output_dir + 'spritesheet.png';

    // Output the image
    fs.writeFileSync(filename1, result.image);

    let pixi = {
        "frames": {},
        "meta": {
            "app": "",
            "version": "1.0",
            "image": "spritesheet.png",
            "format": "RGBA8888",
            "size": { "w": 0, "h": 0 },
            "scale": "1"
        }
    };

    var cssFile = "";

    for (var filename in result.coordinates) {
        if (Object.prototype.hasOwnProperty.call(result.coordinates, filename)) {
            let data = result.coordinates[filename];
            filename = filename.replace(dir, "");
            let tiles = filenameToTilesMap[filename];
            let emw = filenameToExtrudeMarginWidthMap[filename];
            if (typeof tiles == "undefined") {
                let frame = { x: Math.round(data.x), y: Math.round(data.y), w: Math.round(data.width), h: Math.round(data.height) };
                pixi.frames[filenameToNameMap[filename]] = {
                    frame: frame,
                    "rotated": false,
                    "trimmed": false,
                    "spriteSourceSize": { x: 0, y: 0, w: Math.round(data.width), h: Math.round(data.height) },
                    "sourceSize": { "w": Math.round(data.width), "h": Math.round(data.height) },
                    "pivot": { "x": 0.5, "y": 0.5 }
                }

                if (emw) {
                    extrudeMarginInformation.push({ left: frame.x, top: frame.y, width: frame.w, height: frame.h, marginWidth: emw })
                }

                let cssInfo = filenameToCssInfoMap[filename];
                cssFile += getCssPart(cssInfo.name, cssInfo.index, Math.round(data.x), Math.round(data.y), Math.round(data.width), Math.round(data.height), cssGraphicURL);
            } else {
                let number = tiles.minIndex;
                let w = Math.round((data.width - (tiles.tilesX - 1) * tiles.spacingX) / tiles.tilesX);
                let h = Math.round((data.height - (tiles.tilesY - 1) * tiles.spacingY) / tiles.tilesY);
                if (tiles.firstYThenX) {
                    for (let column = 0; column < tiles.tilesX; column++) {
                        for (let row = 0; row < tiles.tilesY; row++) {
                            let x = Math.round(data.x + w * column + column * tiles.spacingX);
                            let y = Math.round(data.y + h * row + row * tiles.spacingY);
                            pixi.frames[filenameToNameMap[filename] + "#" + number] = {
                                frame: { x: x, y: y, w: w, h: h },
                                "rotated": false,
                                "trimmed": false,
                                "spriteSourceSize": { x: 0, y: 0, w: w, h: h },
                                "sourceSize": { "w": w, "h": h },
                                "pivot": { "x": 0.5, "y": 0.5 }
                            }
                            let cssInfo = filenameToCssInfoMap[filename];
                            cssFile += getCssPart(cssInfo.name, number, x, y, w, h, cssGraphicURL);
                            number++;

                            if (emw) {
                                extrudeMarginInformation.push({ left: x, top: y, width: w, height: h, marginWidth: emw })
                            }

                            if(tiles.tilesX*tiles.tilesY - tiles.skipAtEnd <= number - tiles.minIndex) break;
                        }
                        if(tiles.tilesX*tiles.tilesY - tiles.skipAtEnd <= number - tiles.minIndex) break;
                    }
                } else {
                    for (let row = 0; row < tiles.tilesY; row++) {
                        for (let column = 0; column < tiles.tilesX; column++) {
                            let x = data.x + w * column + column * tiles.spacingX;
                            let y = data.y + h * row + row * tiles.spacingY;
                            pixi.frames[filenameToNameMap[filename] + "#" + number] = {
                                frame: { x: x, y: y, w: w, h: h },
                                "rotated": false,
                                "trimmed": false,
                                "spriteSourceSize": { x: 0, y: 0, w: w, h: h },
                                "sourceSize": { "w": w, "h": h },
                                "pivot": { "x": 0.5, "y": 0.5 }
                            }
                            let cssInfo = filenameToCssInfoMap[filename];
                            cssFile += getCssPart(cssInfo.name, number, x, y, w, h, cssGraphicURL);
                            number++;

                            if (emw) {
                                extrudeMarginInformation.push({ left: x, top: y, width: w, height: h, marginWidth: emw })
                            }

                            if(tiles.tilesX*tiles.tilesY - tiles.skipAtEnd <= number - tiles.minIndex) break;
                        }
                        if(tiles.tilesX*tiles.tilesY - tiles.skipAtEnd <= number - tiles.minIndex) break;
                    }
                }


            }
        }
    }


    fs.writeFileSync(output_dir + 'spritesheet.json.txt', JSON.stringify(pixi, null, 2), 'utf-8');
    fs.writeFileSync(cssFilename, cssFile, 'utf-8');

    result.coordinates, result.properties; // Coordinates and properties

    console.log("Extrude margins...");
    // Avoid tile-bleeding by extruding sprite margins
    marginExtruder.extrudeMargin(extrudeMarginInformation, filename1);
    console.log("\u001b[1;32m Done!\u001b[0m");



});


function getCssPart(pictureName, pictureIndex, left, top, width, height, url) {

    let s = "." + pictureName + "_" + (pictureIndex ? pictureIndex : "0") + "{\n";
    s += "   width: " + width + "px;\n";
    s += "   height: " + height + "px;\n";
    s += "   background-position: " + (-left) + "px " + (-top) + "px;\n";
    s += "   background-image: url(" + url + ");\n}\n\n";
    return s;
}