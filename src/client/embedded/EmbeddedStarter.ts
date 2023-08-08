import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, IntegerType, FloatType, DoubleType, CharacterType, BooleanType, longPrimitiveType, LongType, shortPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Formatter } from "../main/gui/Formatter.js";
import { ThemeManager } from "../main/gui/ThemeManager.js";
import { MainEmbedded } from "./MainEmbedded.js";
import * as PIXI from 'pixi.js';
import jQuery from 'jquery';

// All css files for fullscreen online-ide:
import "/include/css/editor.css";
import "/include/css/bottomdiv.css";
import "/include/css/run.css";
import "/include/css/debugger.css";
import "/include/css/helper.css";
import "/include/css/icons.css";
import "/include/css/embedded.css";

import spritesheetjson from '/include/graphics/spritesheet.json.txt';
import spritesheetpng from '/include/graphics/spritesheet.png';

import { PixiSpritesheetData } from "../spritemanager/PixiSpritesheetData.js";

declare var APP_VERSION: string;

export type JOScript = {
    title: string,
    text: string,
    url?: string
}

export class EmbeddedStarter {


    startupComplete = 2;

    themeManager: ThemeManager;

    initGUI() {

        this.initTypes();

        this.checkStartupComplete();

        this.correctPIXITransform();

        PIXI.settings.RENDER_OPTIONS.hello = false; // don't show PIXI-Message in browser console

        this.themeManager = new ThemeManager();
    }

    correctPIXITransform() {

        PIXI.Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
            //@ts-ignore
            if (this._parentID !== parentTransform._worldID) {
                // concat the parent matrix with the objects transform.
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                //@ts-ignore
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                this._worldID++;
            }
        };


    }

    initEditor() {
        new Formatter().init();
        this.checkStartupComplete();
    }

    checkStartupComplete() {
        this.startupComplete--;
        if (this.startupComplete == 0) {
            this.start();
        }
    }

    initTypes() {
        voidPrimitiveType.init();
        intPrimitiveType.init();
        longPrimitiveType.init();
        shortPrimitiveType.init();
        floatPrimitiveType.init();
        doublePrimitiveType.init();
        booleanPrimitiveType.init();
        stringPrimitiveType.init();
        charPrimitiveType.init();

        IntegerType.init();
        LongType.init();
        FloatType.init();
        DoubleType.init();
        CharacterType.init();
        BooleanType.init();
    }

    start() {

        this.initJavaOnlineDivs();

        // let that = this;
        // setTimeout(() => {
        //     that.monaco_editor.layout();
        // }, 200);

    }

    async initJavaOnlineDivs() {

        let divsWithScriptLists: [JQuery<HTMLElement>, JOScript[]][] = [];

        jQuery('.java-online').addClass('notranslate').each((index: number, element: HTMLElement) => {
            let $div = jQuery(element);
            let scriptList: JOScript[] = [];

            $div.find('script').each((index: number, element: HTMLElement) => {
                let $script = jQuery(element);

                let srcAttr = $script.attr('src');
                let text = $script.text().trim();
                let script: JOScript = {
                    title: $script.attr('title'),
                    text: text
                };


                if($script.data('type') == "hint" && !script.title.endsWith(".md")){
                    script.title += ".md";
                }

                if (srcAttr != null) script.url = srcAttr;
                script.text = this.eraseDokuwikiSearchMarkup(script.text);
                scriptList.push(script);
            });

            divsWithScriptLists.push([$div, scriptList])

        });

        for (let dws of divsWithScriptLists) {
            await this.initDiv(dws[0], dws[1]);
        }

    }

    eraseDokuwikiSearchMarkup(text: string): string {
        return text.replace(/<span class="search\whit">(.*?)<\/span>/g, "$1");
    }

    async initDiv($div: JQuery<HTMLElement>, scriptList: JOScript[]) {

        for (let script of scriptList) {
            if (script.url != null) {
                const response = await fetch(script.url)
                script.text = await response.text()
            }
        }

        let me: MainEmbedded = new MainEmbedded($div, scriptList);

    }

}

jQuery(function () {

    let embeddedStarter = new EmbeddedStarter();

    let prefix = "";
    let editorPath = "lib/monaco-editor/dev/vs"
    //@ts-ignore
    if (window.javaOnlineDir != null) {
        //@ts-ignore
        prefix = window.javaOnlineDir;
    }

    //@ts-ignore
    if (window.monacoEditorPath != null) {
        //@ts-ignore
        editorPath = window.monacoEditorPath;
    }

    //@ts-ignore
    window.require.config({ paths: { 'vs': prefix + editorPath } });
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

    //@ts-ignore
    p5.disableFriendlyErrors = true
    let pathPraefix: string = "";
    //@ts-ignore
    if(window.javaOnlineDir != null){
        //@ts-ignore
        pathPraefix = window.javaOnlineDir;
    }

    if(pathPraefix.endsWith("/")){
        pathPraefix = pathPraefix.substring(0, pathPraefix.length - 1);
    }

    fetch(pathPraefix + `${spritesheetjson}`)
    .then((response) => response.json())
    .then((spritesheetData: PixiSpritesheetData) => {
        PIXI.Assets.load(pathPraefix + `${spritesheetpng}`).then((texture: PIXI.Texture) => {
            spritesheetData.meta.size.w = texture.width;
            spritesheetData.meta.size.h = texture.height;
            let spritesheet = new PIXI.Spritesheet(texture, spritesheetData);
            spritesheet.parse().then(() => {
                PIXI.Assets.cache.set('spritesheet', spritesheet);
            });
        })
    });

    // PIXI.Assets.add("spritesheet", pathPraefix + "/assets/graphics/spritesheet.json", { scaleMode: PIXI.SCALE_MODES.NEAREST });
    PIXI.Assets.add("steve", pathPraefix + "/assets/graphics/robot/minecraft_steve/scene.gltf");

    PIXI.Assets.load(["steve"]);

    //@ts-ignore
    console.log(APP_VERSION);

});
