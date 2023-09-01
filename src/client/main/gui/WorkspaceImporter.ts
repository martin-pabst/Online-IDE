import { ExportedWorkspace, File, Module } from "../../compiler/parser/Module.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import { Dialog } from "./Dialog.js";
import jQuery from "jquery";

export class WorkspaceImporter {

    dialog: Dialog;

    constructor(private main: Main, private path: string[] = []) {

        this.dialog = new Dialog();
        
    }

    show() {
        let that = this;
        this.dialog.init();
        this.dialog.heading("Workspace importieren");
        this.dialog.description("Bitte klicken Sie auf den Button 'Datei auswählen...' oder ziehen Sie eine Datei auf das gestrichelt umrahmte Feld.")
        let pathDescription = "Dieser Workspace wird auf unterster Ordnerebene in der Workspaceliste importiert.";
        if(this.path.length  > 0){
            pathDescription = "Dieser Workspace wird in den Ordner " + this.path.join("/") + " importiert.";
        }
        this.dialog.description(pathDescription);

        let $fileInputButton = jQuery('<input type="file" id="file" name="file" multiple />');
        this.dialog.addDiv($fileInputButton);
        
        let exportedWorkspaces: ExportedWorkspace[] = [];
        
        let $errorDiv = this.dialog.description("", "red");
        let $workspacePreviewDiv = jQuery(`<ul></ul>`);
        
        let registerFiles = (files: FileList) => {
            for (let i = 0; i < files.length; i++) {
                let f = files[i];
                var reader = new FileReader();
                reader.onload = (event) => {
                    let text: string = <string>event.target.result;
                    if (!text.startsWith("{")) {
                        $errorDiv.append(jQuery(`<div>Das Format der Datei ${f.name} passt nicht.</div>`));
                        return;
                    }
                    
                    let ew: ExportedWorkspace = JSON.parse(text);
                    
                    if(ew.modules == null || ew.name == null || ew.settings == null){
                        $errorDiv.append(jQuery(`<div>Das Format der Datei ${f.name} passt nicht.</div>`));
                        return;
                    }

                    exportedWorkspaces.push(ew);
                    $workspacePreviewDiv.append(jQuery(`<li>Workspace ${ew.name} mit ${ew.modules.length} Dateien</li>`));

                };
                reader.readAsText(f);
            }
        }

        $fileInputButton.on('change', (event) => {
            //@ts-ignore
            var files: FileList = event.originalEvent.target.files;
            registerFiles(files);
        })

        let $dropZone = jQuery(`<div class="jo_workspaceimport_dropzone">Dateien hierhin ziehen</div>`);
        this.dialog.addDiv($dropZone);
        this.dialog.description('<b>Diese Workspaces werden importiert:</b>');



        $dropZone.on('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
        })
        $dropZone.on('drop', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.originalEvent.dataTransfer.files;
            registerFiles(files);
        })

        this.dialog.addDiv($workspacePreviewDiv);

        let waitDiv = this.dialog.waitMessage("Bitte warten...")

        this.dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => { this.dialog.close() }
            },
            {
                caption: "Importieren",
                color: "green",
                callback: () => {
                    
                    let networkManager = this.main.networkManager;
                    let projectExplorer = this.main.projectExplorer;

                    let owner_id: number = this.main.user.id;
                    if (this.main.workspacesOwnerId != null) {
                        owner_id = this.main.workspacesOwnerId;
                    }

                    let count = 0;
                    for(let wse of exportedWorkspaces) count += 1 + wse.modules.length;

                    let firstWorkspace: Workspace;

                    for(let wse of exportedWorkspaces){

                        let ws: Workspace = new Workspace(wse.name, this.main, owner_id);
                        if(firstWorkspace == null) firstWorkspace = ws;
                        ws.isFolder = false;
                        ws.path = this.path.join("/");
                        ws.settings = wse.settings;
                        this.main.workspaceList.push(ws);
                        ws.alterAdditionalLibraries();

                        networkManager.sendCreateWorkspace(ws, owner_id, (error: string) => {
                            count--;
                            if (error == null) {
                                projectExplorer.workspaceListPanel.addElement({
                                    name: ws.name,
                                    externalElement: ws,
                                    iconClass: "workspace",
                                    isFolder: false,
                                    path: that.path,
                                    readonly: false,
                                    isPruefungFolder: false
                                }, true);

                                for(let mo of wse.modules){
                                    let f: File = {
                                        name: mo.name,
                                        dirty: false,
                                        saved: true,
                                        text: mo.text,
                                        text_before_revision: null,
                                        submitted_date: null,
                                        student_edited_after_revision: false,
                                        version: 1,
                                        is_copy_of_id: null,
                                        repository_file_version: null,
                                        identical_to_repository_version: true,
                                    };
                                    let m = new Module(f, this.main);
                                    ws.moduleStore.putModule(m);
                                    networkManager.sendCreateFile(m, ws, owner_id,
                                        (error: string) => {
                                            count--;
                                            if (error == null) {
                                                projectExplorer.workspaceListPanel.sortElements();
                                                this.dialog.close();
                                                if(firstWorkspace != null) projectExplorer.setWorkspaceActive(firstWorkspace, true);
                                            } else {
                                                alert('Der Server ist nicht erreichbar!');
                    
                                            }
                                        });
                                }

                            } else {
                                alert('Der Server ist nicht erreichbar!');
        
                            }
                        });



                    }

                }
            },
        ])
    }

}