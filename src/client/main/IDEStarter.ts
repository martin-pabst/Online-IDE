import { Main } from "./Main.js";
import { SynchronizationManager } from "../repository/synchronize/RepositorySynchronizationManager.js";
import { RepositoryCreateManager } from "../repository/update/RepositoryCreateManager.js";
import { RepositorySettingsManager } from "../repository/update/RepositorySettingsManager.js";
import { RepositoryCheckoutManager } from "../repository/update/RepositoryCheckoutManager.js";
import { SpriteManager } from "../spritemanager/SpriteManager.js";
import * as PIXI from 'pixi.js';
import jQuery from 'jquery';

// All css files for fullscreen online-ide:
import "/css/editor.css";
import "/css/editorStatic.css";
import "/css/bottomdiv.css";
import "/css/run.css";
// import "/css/diagram.css";
import "/css/debugger.css";
import "/css/helper.css";
import "/css/icons.css";
import "/css/dialog.css";
import "/css/synchronize-repo.css";
import "/css/updatecreate-repo.css";
import "/css/spritemanager.css";


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
    
    PIXI.Assets.add("spritesheet", "assets/graphics/spritesheet.json", {scaleMode: PIXI.SCALE_MODES.NEAREST});
    PIXI.Assets.add("steve", "assets/graphics/robot/minecraft_steve/scene.gltf");

    PIXI.Assets.load(["spritesheet", "steve"]);
    
    main.initGUI();

});