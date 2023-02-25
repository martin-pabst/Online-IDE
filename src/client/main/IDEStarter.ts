import { Main } from "./Main.js";
import { SynchronizationManager } from "../repository/synchronize/RepositorySynchronizationManager.js";
import { RepositoryCreateManager } from "../repository/update/RepositoryCreateManager.js";
import { RepositorySettingsManager } from "../repository/update/RepositorySettingsManager.js";
import { RepositoryCheckoutManager } from "../repository/update/RepositoryCheckoutManager.js";
import { SpriteManager } from "../spritemanager/SpriteManager.js";
import * as PIXI from 'pixi.js';
import jQuery from 'jquery';

// All css files for fullscreen online-ide:
import "/include/css/editor.css";
import "/include/css/editorStatic.css";
import "/include/css/bottomdiv.css";
import "/include/css/run.css";
// import "/include/css/diagram.css";
import "/include/css/debugger.css";
import "/include/css/helper.css";
import "/include/css/icons.css";
import "/include/css/dialog.css";
import "/include/css/synchronize-repo.css";
import "/include/css/updatecreate-repo.css";
import "/include/css/spritemanager.css";

import spritesheetjson from '/include/graphics/spritesheet.json.txt';
import spritesheetpng from '/include/graphics/spritesheet.png';
import { PixiSpritesheetData } from "../spritemanager/PixiSpritesheetData.js";



jQuery(function () {

    let main = new Main();

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

        main.initEditor();
        main.getMonacoEditor().updateOptions({ readOnly: true });

        main.bottomDiv.initGUI();
        main.checkStartupComplete();

        if(main.repositoryOn){
            main.synchronizationManager = new SynchronizationManager(main);
            main.synchronizationManager.initGUI();
            main.repositoryCreateManager = new RepositoryCreateManager(main);
            main.repositoryCreateManager.initGUI();
            main.repositoryUpdateManager = new RepositorySettingsManager(main);
            main.repositoryUpdateManager.initGUI();
            main.repositoryCheckoutManager = new RepositoryCheckoutManager(main);
            main.repositoryCheckoutManager.initGUI();

        }

        main.spriteManager = new SpriteManager(main);
        main.spriteManager.initGUI();
        // main.loadWorkspace();

        //@ts-ignore
        p5.disableFriendlyErrors = true
        
    });
    
    fetch(`${spritesheetjson}`)
    .then((response) => response.json())
    .then((spritesheetData: PixiSpritesheetData) => {
        PIXI.Assets.load(`${spritesheetpng}`).then((texture: PIXI.Texture) => {
            spritesheetData.meta.size.w = texture.width;
            spritesheetData.meta.size.h = texture.height;
            let spritesheet = new PIXI.Spritesheet(texture, spritesheetData);
            spritesheet.parse().then(() => {
                PIXI.Assets.cache.set('spritesheet', spritesheet);
            });
        })
    });

    // PIXI.Assets.add("spritesheet", "assets/graphics/spritesheet.json", {scaleMode: PIXI.SCALE_MODES.NEAREST});
    PIXI.Assets.add("steve", "assets/graphics/robot/minecraft_steve/scene.gltf");

    PIXI.Assets.load(["spritesheet", "steve"]);
    
    main.initGUI();

});