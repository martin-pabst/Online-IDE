import jQuery from 'jquery';
import { Module } from "../compiler/parser/Module.js";
import { AccordionElement } from "../main/gui/Accordion.js";
import { Main } from "../main/Main.js";
import { SqlIdeUrlHolder } from "../main/SqlIdeUrlHolder.js";
import { CacheManager } from "../tools/database/CacheManager.js";
import { Workspace } from "../workspace/Workspace.js";
import { ajax, csrfToken, PerformanceCollector } from "./AjaxHelper.js";
import { ClassData, CreateOrDeleteFileOrWorkspaceRequest, CRUDResponse, DatabaseData, DistributeWorkspaceRequest, DistributeWorkspaceResponse, DuplicateWorkspaceRequest, DuplicateWorkspaceResponse, FileData, GetDatabaseRequest, getDatabaseResponse, GetTemplateRequest, JAddStatementRequest, JAddStatementResponse, JRollbackStatementRequest, JRollbackStatementResponse, ObtainSqlTokenRequest, ObtainSqlTokenResponse, SendUpdatesRequest, SendUpdatesResponse, SetRepositorySecretRequest, SetRepositorySecretResponse, UpdateUserSettingsRequest, UpdateUserSettingsResponse, WorkspaceData } from "./Data.js";
import { PushClientManager } from "./pushclient/PushClientManager.js";

export class NetworkManager {
        
    // = "https://sql.onlinecoding.de/servlet/";
    // SqlIdeUrlHolder.sqlIdeURL = "http://localhost:6500/servlet/";
    // SqlIdeUrlHolder.sqlIdeURL = "https://www.sql-ide.de/servlet/";
    
    timerhandle: any;
    
    ownUpdateFrequencyInSeconds: number = 25;
    teacherUpdateFrequencyInSeconds: number = 5;
    
    updateFrequencyInSeconds: number = 25;
    forcedUpdateEvery: number = 25;
    forcedUpdatesInARow: number = 0;
    
    secondsTillNextUpdate: number = this.updateFrequencyInSeconds;
    errorHappened: boolean = false;
    
    interval: any;
    
    counterTillForcedUpdate: number;
    
    constructor(public main: Main, private $updateTimerDiv: JQuery<HTMLElement>) {

    }
    
    initializeTimer() {

        let that = this;
        this.$updateTimerDiv.find('svg').attr('width', that.updateFrequencyInSeconds);

        if (this.interval != null) clearInterval(this.interval);

        this.counterTillForcedUpdate = this.forcedUpdateEvery;
        
        this.interval = setInterval(() => {
            
            if (that.main.user == null) return; // don't call server if no user is logged in
            
            that.secondsTillNextUpdate--;
            
            if (that.secondsTillNextUpdate < 0) {
                that.secondsTillNextUpdate = that.updateFrequencyInSeconds;
                that.counterTillForcedUpdate--;
                let doForceUpdate = that.counterTillForcedUpdate == 0;
                if (doForceUpdate) {
                    this.forcedUpdatesInARow++;
                    that.counterTillForcedUpdate = this.forcedUpdateEvery;
                    if (this.forcedUpdatesInARow > 50) {
                        that.counterTillForcedUpdate = this.forcedUpdateEvery * 10;
                    }
                }

                
                that.sendUpdates(() => { }, doForceUpdate, false);
                
            }
            
            let $rect = this.$updateTimerDiv.find('.jo_updateTimerRect');
            
            $rect.attr('width', that.secondsTillNextUpdate + "px");
            
            if (that.errorHappened) {
                $rect.css('fill', '#c00000');
                this.$updateTimerDiv.attr('title', "Fehler beim letzten Speichervorgang -> Werd's wieder versuchen");
            } else {
                $rect.css('fill', '#008000');
                this.$updateTimerDiv.attr('title', that.secondsTillNextUpdate + " Sekunden bis zum nächsten Speichern");
            }
            
            PerformanceCollector.sendDataToServer();
            
        }, 1000);
        
    }

    initializeSSE() {
        PushClientManager.getInstance().subscribe("doFileUpdate", (data) => {
            this.sendUpdates(() => {}, true, false, true);
        })


    }

    sendUpdatesAsync(sendIfNothingIsDirty: boolean = false, sendBeacon: boolean = false):Promise<void> {
        let p = new Promise<void>((resolve, reject) => {
            this.sendUpdates(resolve, sendIfNothingIsDirty, sendBeacon);
        })
        return p;
    }

    sendUpdates(callback?: () => void, sendIfNothingIsDirty: boolean = false, sendBeacon: boolean = false, alertIfNewWorkspacesFound: boolean = false) {

        if (this.main.user == null || this.main.user.is_testuser) {
            if (callback != null) callback();
            return;
        }
        
        this.main.projectExplorer.writeEditorTextToFile();
        
        let classDiagram = this.main.rightDiv?.classDiagram;
        let userSettings = this.main.user.settings;

        if (classDiagram?.dirty || this.main.userDataDirty) {
            
            this.main.userDataDirty = false;
            userSettings.classDiagram = classDiagram?.serialize();
            this.sendUpdateUserSettings(() => { }, sendBeacon);
            this.forcedUpdatesInARow = 0;
        }

        classDiagram.dirty = false;

        let wdList: WorkspaceData[] = [];
        let fdList: FileData[] = [];

        for (let ws of this.main.workspaceList) {

            if (!ws.saved) {
                wdList.push(ws.getWorkspaceData(false));
                ws.saved = true;
                this.forcedUpdatesInARow = 0;
            }

            for (let m of ws.moduleStore.getModules(false)) {
                if (!m.file.saved) {
                    this.forcedUpdatesInARow = 0;
                    m.file.text = m.getProgramTextFromMonacoModel();
                    fdList.push(m.getFileData(ws));
                    // console.log("Save file " + m.file.name);
                    m.file.saved = true;
                }
            }
        }

        let request: SendUpdatesRequest = {
            workspacesWithoutFiles: wdList,
            files: fdList,
            owner_id: this.main.workspacesOwnerId,
            userId: this.main.user.id,
            currentWorkspaceId: this.main.currentWorkspace?.pruefung_id == null ? this.main.currentWorkspace?.id : null,
            getModifiedWorkspaces: sendIfNothingIsDirty
        }

        let that = this;
        if (wdList.length > 0 || fdList.length > 0 || sendIfNothingIsDirty || this.errorHappened) {

            if (sendBeacon) {
                // If user closes browser-tab or even browser then only sendBeacon works to send data.
                navigator.sendBeacon("sendUpdates", JSON.stringify(request));
            } else {

                ajax('sendUpdates', request, (response: SendUpdatesResponse) => {
                    that.errorHappened = !response.success;
                    if (!that.errorHappened) {

                        // if (this.main.workspacesOwnerId == this.main.user.id) {
                            if (response.workspaces != null) {
                                that.updateWorkspaces(request, response, alertIfNewWorkspacesFound);
                            }
                            if (response.filesToForceUpdate != null) {
                                that.updateFiles(response.filesToForceUpdate);
                            }

                            if (callback != null) {
                                callback();
                                return;
                            }
                        // }
                    } else {
                        let message: string = "Fehler beim Senden der Daten: ";
                        if(response["message"]) message += response["message"];
                        console.log(message);
                    }
                }, (message: string) => {
                    that.errorHappened = true;
                    console.log("Fehler beim Ajax-call: " + message)
                });

            }

        } else {
            if (callback != null) {
                callback();
                return;
            }
        }

    }

    sendCreateWorkspace(w: Workspace, owner_id: number, callback: (error: string) => void) {

        if (this.main.user.is_testuser) {
            w.id = Math.round(Math.random() * 10000000);
            callback(null);
            return;
        }

        let wd: WorkspaceData = w.getWorkspaceData(false);
        let request: CreateOrDeleteFileOrWorkspaceRequest = {
            type: "create",
            entity: "workspace",
            data: wd,
            owner_id: owner_id,
            userId: this.main.user.id
        }

        ajax("createOrDeleteFileOrWorkspace", request, (response: CRUDResponse) => {
            w.id = response.id;
            callback(null);
        }, callback);

    }

    sendCreateFile(m: Module, ws: Workspace, owner_id: number, callback: (error: string) => void) {

        if (this.main.user.is_testuser) {
            m.file.id = Math.round(Math.random() * 10000000);
            callback(null);
            return;
        }


        let fd: FileData = m.getFileData(ws);
        let request: CreateOrDeleteFileOrWorkspaceRequest = {
            type: "create",
            entity: "file",
            data: fd,
            owner_id: owner_id,
            userId: this.main.user.id
        }

        ajax("createOrDeleteFileOrWorkspace", request, (response: CRUDResponse) => {
            m.file.id = response.id;
            callback(null);
        }, callback);

    }

    sendDuplicateWorkspace(ws: Workspace, callback: (error: string, workspaceData?: WorkspaceData) => void) {

        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.", null);
            return;
        }


        let request: DuplicateWorkspaceRequest = {
            workspace_id: ws.id
        }

        ajax("duplicateWorkspace", request, (response: DuplicateWorkspaceResponse) => {
            callback(response.message, response.workspace)
        }, callback);

    }

    sendDistributeWorkspace(ws: Workspace, klasse: ClassData, student_ids: number[], callback: (error: string) => void) {

        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.");
            return;
        }


        this.sendUpdates(() => {

            let request: DistributeWorkspaceRequest = {
                workspace_id: ws.id,
                class_id: klasse?.id,
                student_ids: student_ids
            }

            ajax("distributeWorkspace", request, (response: DistributeWorkspaceResponse) => {
                callback(response.message)
            }, callback);

        }, false);

    }

    sendSetSecret(repositoryId: number, read: boolean, write: boolean, callback: (response: SetRepositorySecretResponse) => void){
        let request: SetRepositorySecretRequest = {repository_id: repositoryId, newSecretRead: read, newSecretWrite: write};

        ajax("setRepositorySecret", request, (response: SetRepositorySecretResponse) => {
            callback(response)
        }, (message) => {alert(message)});

    }

    sendCreateRepository(ws: Workspace, publish_to: number, repoName: string, repoDescription: string, callback: (error: string, repository_id?: number) => void) {

        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.");
            return;
        }


        this.sendUpdates(() => {

            let request = {
                workspace_id: ws.id,
                publish_to: publish_to,
                name: repoName,
                description: repoDescription
            }

            ajax("createRepository", request, (response: { success: boolean, message?: string, repository_id?: number }) => {
                ws.moduleStore.getModules(false).forEach(m => {
                    m.file.is_copy_of_id = m.file.id;
                    m.file.repository_file_version = 1;
                })
                ws.repository_id = response.repository_id;
                ws.has_write_permission_to_repository = true;
                callback(response.message, response.repository_id)
            }, callback);

        }, true);


    }

    sendDeleteWorkspaceOrFile(type: "workspace" | "file", id: number, callback: (error: string) => void) {

        if (this.main.user.is_testuser) {
            callback(null);
            return;
        }


        let request: CreateOrDeleteFileOrWorkspaceRequest = {
            type: "delete",
            entity: type,
            id: id,
            userId: this.main.user.id
        }

        ajax("createOrDeleteFileOrWorkspace", request, (response: CRUDResponse) => {
            if (response.success) {
                callback(null);
            } else {
                callback("Netzwerkfehler!");
            }
        }, callback);

    }

    sendUpdateUserSettings(callback: (error: string) => void, sendBeacon: boolean = false) {

        if (this.main.user.is_testuser) {
            callback(null);
            return;
        }

        let request: UpdateUserSettingsRequest = {
            settings: this.main.user.settings,
            userId: this.main.user.id
        }

        if (sendBeacon) {
            navigator.sendBeacon("updateUserSettings", JSON.stringify(request));
        } else {
            ajax("updateUserSettings", request, (response: UpdateUserSettingsResponse) => {
                if (response.success) {
                    callback(null);
                } else {
                    callback("Netzwerkfehler!");
                }
            }, callback);
        }


    }


    private updateWorkspaces(sendUpdatesRequest: SendUpdatesRequest, sendUpdatesResponse: SendUpdatesResponse, alertIfNewWorkspacesFound: boolean = false) {

        let idToRemoteWorkspaceDataMap: Map<number, WorkspaceData> = new Map();

        let fileIdsSended = [];
        sendUpdatesRequest.files.forEach(file => fileIdsSended.push(file.id));

        sendUpdatesResponse.workspaces.workspaces.forEach(wd => idToRemoteWorkspaceDataMap.set(wd.id, wd));

        let newWorkspaceNames: string[] = [];

        for (let remoteWorkspace of sendUpdatesResponse.workspaces.workspaces) {

            let localWorkspaces = this.main.workspaceList.filter(ws => ws.id == remoteWorkspace.id);

            // Did student get a workspace from his/her teacher?
            if (localWorkspaces.length == 0) {
                if(remoteWorkspace.pruefung_id == null){
                    newWorkspaceNames.push(remoteWorkspace.name);
                }
                this.createNewWorkspaceFromWorkspaceData(remoteWorkspace);
            }

        }



        for (let workspace of this.main.workspaceList) {
            let remoteWorkspace: WorkspaceData = idToRemoteWorkspaceDataMap.get(workspace.id);
            if (remoteWorkspace != null) {
                let idToRemoteFileDataMap: Map<number, FileData> = new Map();
                remoteWorkspace.files.forEach(fd => idToRemoteFileDataMap.set(fd.id, fd));

                let idToModuleMap: Map<number, Module> = new Map();
                // update/delete files if necessary
                for (let module of workspace.moduleStore.getModules(false)) {
                    let fileId = module.file.id;
                    idToModuleMap.set(fileId, module);
                    let remoteFileData = idToRemoteFileDataMap.get(fileId);
                    if (remoteFileData == null) {
                        this.main.projectExplorer.fileListPanel.removeElement(module);
                        this.main.currentWorkspace.moduleStore.removeModule(module);
                    } else {
                        if (fileIdsSended.indexOf(fileId) < 0 && module.file.text != remoteFileData.text) {
                            module.file.text = remoteFileData.text;
                            module.model.setValue(remoteFileData.text);
    
                            module.file.saved = true;
                            module.lastSavedVersionId = module.model.getAlternativeVersionId()
                        }
                        module.file.version = remoteFileData.version;
                    } 
                }


                // add files if necessary
                for (let remoteFile of remoteWorkspace.files) {
                    if (idToModuleMap.get(remoteFile.id) == null) {
                        this.createFile(workspace, remoteFile);
                    }
                }
            }
        }

        if (newWorkspaceNames.length > 0 && alertIfNewWorkspacesFound) {
            let message: string = newWorkspaceNames.length > 1 ? "Folgende Workspaces hat Deine Lehrkraft Dir gesendet: " : "Folgenden Workspace hat Deine Lehrkraft Dir gesendet: ";
            message += newWorkspaceNames.join(", ");
            alert(message);
        }

        this.main.projectExplorer.workspaceListPanel.sortElements();
        this.main.projectExplorer.fileListPanel.sortElements();

    }

    private updateFiles(filesFromServer: FileData[]) {
        let fileIdToLocalModuleMap: Map<number, Module> = new Map();

        for (let workspace of this.main.workspaceList) {
            for (let module of workspace.moduleStore.getModules(false)) {
                fileIdToLocalModuleMap[module.file.id] = module;
            }
        }

        for (let remoteFile of filesFromServer) {
            let module = fileIdToLocalModuleMap[remoteFile.id];
            if (module != null && module.file.text != remoteFile.text) {
                module.file.text = remoteFile.text;
                module.model.setValue(remoteFile.text); // Hier passierts!
                module.file.saved = true;
                module.lastSavedVersionId = module.model.getAlternativeVersionId()
                module.file.version = remoteFile.version;
            }
        }
    }

    public createNewWorkspaceFromWorkspaceData(remoteWorkspace: WorkspaceData, withSort: boolean = false): Workspace {

        let w = this.main.restoreWorkspaceFromData(remoteWorkspace);
        
        this.main.workspaceList.push(w);
        let path = remoteWorkspace.path.split("/");
        if (path.length == 1 && path[0] == "") path = [];
        
        let panelElement: AccordionElement = {
            name: remoteWorkspace.name,
            externalElement: w,
            iconClass: remoteWorkspace.repository_id == null ? "workspace" : "repository",
            isFolder: remoteWorkspace.isFolder,
            path: path,
            readonly: remoteWorkspace.readonly,
            isPruefungFolder: false
        };

        this.main.projectExplorer.workspaceListPanel.addElement(panelElement, true);
        w.panelElement = panelElement;

        if(w.repository_id != null){
            w.renderSynchronizeButton(panelElement);
        }

        if (withSort) {
            this.main.projectExplorer.workspaceListPanel.sortElements();
        }
        return w;
    }

    private createFile(workspace: Workspace, remoteFile: FileData) {
        let m = this.main.projectExplorer.getNewModule(remoteFile); //new Module(f, this.main);
        let f = m.file;

        let ae: any = null; //AccordionElement
        if (workspace == this.main.currentWorkspace) {
            ae = {
                name: remoteFile.name,
                externalElement: null
            }

            this.main.projectExplorer.fileListPanel.addElement(ae, true);
            f.panelElement = ae;
            ae.externalElement = m;
        }

        let modulStore = workspace.moduleStore;
        modulStore.putModule(m);

    }

    fetchDatabaseAndToken(code: string, callback:(database: DatabaseData, token: string, error: string) => void){
        let request: ObtainSqlTokenRequest = {code: code};

        ajax("obtainSqlToken", request, (response: ObtainSqlTokenResponse) => {
            if (response.success) {
                this.fetchDatabase(response.token, (database, error) => {
                    callback(database, response.token, error);
                })                
            } else {
                callback(null, null, response.message);
            }
        }, (errormessage) => {
            callback(null, null, errormessage);
        })
    }

    private fetchDatabase(token: string, callback: (database: DatabaseData, error: string) => void) {

        let cacheManager: CacheManager = new CacheManager();

        let request: GetDatabaseRequest = {
            token: token
        }

        ajax(SqlIdeUrlHolder.sqlIdeURL +  "jGetDatabase", request, (response: getDatabaseResponse) => {
            if (response.success) {

                let database = response.database;
                
                cacheManager.fetchTemplateFromCache(database.based_on_template_id, (templateDump: Uint8Array) => {

                    if (templateDump != null) {
                        //@ts-ignore
                        database.templateDump = pako.inflate(templateDump);
                        callback(database, null);
                        return;
                    } else {
                        if (database.based_on_template_id == null) {
                            callback(database, null);
                            return
                        }
                        this.fetchTemplate(token, (template) => {
                            if (template != null) {
                                cacheManager.saveTemplateToCache(database.based_on_template_id, template);
                                // @ts-ignore
                                database.templateDump = pako.inflate(template);
                                callback(database, null);
                                return;
                            } else {
                                callback(null, "Konnte das Template nicht laden.");
                                return;
                            }
                        })
                    }
                })
            } else {
                callback(null, "Netzwerkfehler!");
            }
        });


    }


    private fetchTemplate(token: string, callback: (template: Uint8Array) => void) {
        let request: GetTemplateRequest = {
            token: token
        }

        let headers: {[key: string]: string;} = {};
        if(csrfToken != null) headers = {"x-token-pm": csrfToken};

        jQuery.ajax({
            type: 'POST',
            async: true,
            headers: headers,
            data: JSON.stringify(request),
            contentType: 'application/json',
            url: SqlIdeUrlHolder.sqlIdeURL + "jGetTemplate",
            xhrFields: { responseType: 'arraybuffer' },
            success: function (response: any) {
                callback(new Uint8Array(response));
            },
            error: function (jqXHR, message) {
                alert("Konnte das Template nicht laden.");
                callback(null);
            }
        });

    }

    public addDatabaseStatement(token: string, version_before: number, statements: string[], 
        callback: (statementsBefore: string[], new_version: number, message: string) => void){

        let request: JAddStatementRequest = {
            token: token,
            version_before: version_before,
            statements: statements
        }

        ajax(SqlIdeUrlHolder.sqlIdeURL +  "jAddDatabaseStatement", request, (response: JAddStatementResponse) => {
            callback(response.statements_before, response.new_version, response.message);
        }, (message) => {callback([], 0, message)})


    }
    
    public rollbackDatabaseStatement(token: string, current_version: number, 
        callback: (message: string) => void){

        let request: JRollbackStatementRequest = {
            token: token,
            current_version: current_version
        }

        ajax(SqlIdeUrlHolder.sqlIdeURL +  "jRollbackDatabaseStatement", request, (response: JRollbackStatementResponse) => {
            callback(response.message);
        })


    }
    


}