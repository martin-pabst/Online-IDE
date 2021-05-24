import { WorkspaceData, WorkspaceSettings } from "../communication/Data.js";
import { Module, ModuleStore } from "../compiler/parser/Module.js";
import { Evaluator } from "../interpreter/Evaluator.js";
import { AccordionElement } from "../main/gui/Accordion.js";
import { Main } from "../main/Main.js";
import { MainBase } from "../main/MainBase.js";


export class Workspace {
    
    name: string;
    path: string;
    isFolder: boolean;
    id: number;
    owner_id: number;

    version: number;
    // published_to 0: none; 1: class; 2: school; 3: all
    published_to: number;
    
    repository_id: number;    // id of repository-workspace
    has_write_permission_to_repository: boolean; // true if owner of this working copy has write permission to repository workspace

    moduleStore: ModuleStore;
    panelElement: AccordionElement;
    currentlyOpenModule: Module;
    saved: boolean = true;

    compilerMessage: string;

    evaluator: Evaluator;

    settings: WorkspaceSettings = {
        libaries: []
    };
    
    constructor(name: string, private main: MainBase, owner_id: number){
        this.name = name;
        this.owner_id = owner_id;
        this.moduleStore = new ModuleStore(main, true, this.settings.libaries);
        this.evaluator = new Evaluator(this, main);
    }

    alterAdditionalLibraries() {
        this.moduleStore.setAdditionalLibraries(this.settings.libaries);
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
            language: 0,
            sql_baseDatabase: "",
            sql_history: "",
            sql_manipulateDatabaseStatements: "",
            settings: JSON.stringify(this.settings)
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
            $button.on('mousedown', (e) => e.stopPropagation());
            $button.on('click', (e) => {
                e.stopPropagation();

                that.synchronizeWithRepository();

            });

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

    static restoreFromData(ws: WorkspaceData, main: Main): Workspace {

        let settings: WorkspaceSettings = (ws.settings != null && ws.settings.startsWith("{")) ? JSON.parse(ws.settings) : {libaries: []}; 

        let w = new Workspace(ws.name, main, ws.owner_id);
        w.id = ws.id;
        w.path = ws.path;
        w.isFolder = ws.isFolder;
        w.owner_id = ws.owner_id;
        w.version = ws.version;
        w.repository_id = ws.repository_id;
        w.has_write_permission_to_repository = ws.has_write_permission_to_repository;
        w.settings = settings;

        if(w.settings.libaries == null){
            w.settings.libaries = [];
        }

        if(w.settings.libaries.length > 0){
            w.moduleStore.setAdditionalLibraries(w.settings.libaries);
        }

        for(let f of ws.files){

            let m: Module = Module.restoreFromData(f, main);
            w.moduleStore.putModule(m);

            if(f.id == ws.currentFileId){
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

