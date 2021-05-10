import { Main } from "./Main.js";
import { SynchronizationManager } from "../repository/synchronize/RepositorySynchronizationManager.js";
import { RepositoryCreateManager } from "../repository/update/RepositoryCreateManager.js";
import { RepositorySettingsManager } from "../repository/update/RepositorySettingsManager.js";
import { RepositoryCheckoutManager } from "../repository/update/RepositoryCheckoutManager.js";
import * as PIXI from "pixi.js";


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
        // main.loadWorkspace();


    });

    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });

    main.initGUI();

});