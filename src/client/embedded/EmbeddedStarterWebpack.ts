import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Formatter } from "../main/gui/Formatter.js";
import { ThemeManager } from "../main/gui/ThemeManager.js";
import { MainEmbedded } from "./MainEmbedded.js";
import { EmbeddedStarter } from "./EmbeddedStarter.js";
import * as PIXI from "pixi.js";


import "../css/embedded.css";

// declare const require: any;


jQuery(function () {

    let embeddedStarter = new EmbeddedStarter();

    //@ts-ignore
    window.require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' } });
    //@ts-ignore
    window.require.config({
        'vs/nls': {
            availableLanguages: {
                '*': 'de'
            }
        },
        ignoreDuplicateModules: ["vs/editor/editor.main"]
    });
    //@ts-ignore
    window.require(['vs/editor/editor.main'], function () {

        embeddedStarter.initEditor();
        embeddedStarter.initGUI();

    });


    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });


});