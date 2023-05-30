import { WorkspaceData, WorkspaceSettings } from "../communication/Data.js";
import { ExportedWorkspace, Module, ModuleStore } from "../compiler/parser/Module.js";
import { Evaluator } from "../interpreter/Evaluator.js";
import { AccordionElement } from "../main/gui/Accordion.js";
import { Main } from "../main/Main.js";
import { MainBase } from "../main/MainBase.js";
import jQuery from 'jquery';


export class Workspace {
    
    name: string;
    path: string;
    isFolder: boolean;
    readonly: boolean;
    id: number;
    owner_id: number;

    version: number;
    // published_to 0: none; 1: class; 2: school; 3: all
    published_to: number;
    
    repository_id: number;    // id of repository-workspace
    has_write_permission_to_repository: boolean; // true if owner of this working copy has write permission to repository workspace

    spritesheetId: number;

    moduleStore: ModuleStore;
    panelElement: AccordionElement;
    currentlyOpenModule: Module;
    saved: boolean = true;

    pruefung_id: number;

    compilerMessage: string;

    evaluator: Evaluator;

    settings: WorkspaceSettings = {
        libraries: []
    };
    
    constructor(name: string, private main: MainBase, owner_id: number){
        this.name = name;
        this.owner_id = owner_id;
        this.moduleStore = new ModuleStore(main, true, this.settings.libraries);
        this.evaluator = new Evaluator(this, main);
    }

    toExportedWorkspace(): ExportedWorkspace {
        return {
            name: this.name,
            modules: this.moduleStore.getModules(false).map(m => m.toExportedModule()),
            settings: this.settings
        }
    }


    alterAdditionalLibraries() {
        this.moduleStore.setAdditionalLibraries(this.settings.libraries);
        this.moduleStore.dirty = true;
    }

    getWorkspaceData(withFiles: boolean): WorkspaceData {
        let wd: WorkspaceData = {
            name: this.name,
            path: this.path,
            isFolder: this.isFolder,
            id: this.id,
            owner_id: this.owner_id,
            currentFileId: this.currentlyOpenModule == null ? null : this.currentlyOpenModule.file.id,
            files: [],
            version: this.version,
            repository_id: this.repository_id,
            has_write_permission_to_repository: this.has_write_permission_to_repository,
            settings: JSON.stringify(this.settings),
            spritesheetId: this.spritesheetId,
            pruefungId: this.pruefung_id,
            readonly: this.readonly
        }

        if(withFiles){
            for(let m of this.moduleStore.getModules(false)){
    
                wd.files.push(m.getFileData(this));
    
            }
        }

        return wd;
    }


    renderSynchronizeButton(panelElement: AccordionElement) {
        let $buttonDiv = panelElement?.$htmlFirstLine?.find('.jo_additionalButtonRepository');
        if ($buttonDiv == null) return;
        
        let that = this;
        let myMain: Main = <Main>this.main;

        if (this.repository_id != null && this.owner_id == myMain.user.id) {
            let $button = jQuery('<div class="jo_startButton img_open-change jo_button jo_active" title="Workspace mit Repository synchronisieren"></div>');
            $buttonDiv.append($button);
            let that = this;
            $button.on('pointerdown', (e) => e.stopPropagation());
            $button.on('pointerup', (e) => {
                e.stopPropagation();

                that.synchronizeWithRepository();

            });

            $button[0].addEventListener("contextmenu", (event) => {
                event.preventDefault();
                event.stopPropagation();
            }, false);


        } else {
            $buttonDiv.find('.jo_startButton').remove();
        }
    }

    synchronizeWithRepository(){
        let myMain: Main = <Main>this.main;
        if(this.repository_id != null && this.owner_id == myMain.user.id){
            myMain.networkManager.sendUpdates(() => {
                myMain.synchronizationManager.synchronizeWithWorkspace(this);
            }, true);
        }
    }

    static restoreFromData(wd: WorkspaceData, main: Main): Workspace {

        let settings: WorkspaceSettings = (wd.settings != null && wd.settings.startsWith("{")) ? JSON.parse(wd.settings) : {libraries: []}; 

        //@ts-ignore
        if(settings.libaries){
            //@ts-ignore
            settings.libraries = settings.libaries;
        }

        let w = new Workspace(wd.name, main, wd.owner_id);
        w.id = wd.id;
        w.path = wd.path;
        w.isFolder = wd.isFolder;
        w.owner_id = wd.owner_id;
        w.version = wd.version;
        w.repository_id = wd.repository_id;
        w.has_write_permission_to_repository = wd.has_write_permission_to_repository;
        w.settings = settings;
        w.pruefung_id = wd.pruefungId;

        w.spritesheetId = wd.spritesheetId;
        w.readonly = wd.readonly;

        if(w.settings.libraries == null){
            w.settings.libraries = [];
        }

        if(w.settings.libraries.length > 0){
            w.moduleStore.setAdditionalLibraries(w.settings.libraries);
        }

        for(let f of wd.files){

            let m: Module = Module.restoreFromData(f, main);
            w.moduleStore.putModule(m);

            if(f.id == wd.currentFileId){
                w.currentlyOpenModule = m;
            }

        }

        return w;

    }

    hasErrors(): boolean {
        
        return this.moduleStore.hasErrors();
        
    }

    getModuleByMonacoModel(model: monaco.editor.ITextModel): Module {
        for(let m of this.moduleStore.getModules(false)){
            if(m.model == model){
                return m;
            }
        }
        
        return null;
    }
}

