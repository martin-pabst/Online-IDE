import jQuery from 'jquery';
import { NetworkManager } from "../../communication/NetworkManager.js";
import { TextPosition } from "../../compiler/lexer/Token.js";
import { File, Module } from "../../compiler/parser/Module.js";
import { ProgramPrinter } from "../../compiler/parser/ProgramPrinter.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { downloadFile, makeEditable, openContextMenu } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import { AccordionPanel, Accordion, AccordionElement, AccordionContextMenuItem } from "./Accordion.js";
import { Helper } from "./Helper.js";
import { WorkspaceData, Workspaces, ClassData, UserData, GetWorkspacesRequest, GetWorkspacesResponse, Pruefung, FileData } from "../../communication/Data.js";
import { dateToString } from "../../tools/StringTools.js";
import { DistributeToStudentsDialog } from "./DistributeToStudentsDialog.js";
import { WorkspaceSettingsDialog } from "./WorkspaceSettingsDialog.js";
import { SpritesheetData } from "../../spritemanager/SpritesheetData.js";
import { FileTypeManager } from './FileTypeManager.js';
import { ajax, ajaxAsync } from '../../communication/AjaxHelper.js';
import { TeacherExplorer } from './TeacherExplorer.js';
import { DatabaseNewLongPollingListener } from '../../tools/database/DatabaseNewLongPollingListener.js';


export class ProjectExplorer {

    programPointerModule: Module = null;
    programPointerPosition: TextPosition;
    programPointerDecoration: string[] = [];

    accordion: Accordion;
    fileListPanel: AccordionPanel;
    workspaceListPanel: AccordionPanel;

    $homeAction: JQuery<HTMLElement>;
    $synchronizeAction: JQuery<HTMLElement>;

    constructor(private main: Main, private $projectexplorerDiv: JQuery<HTMLElement>) {

    }

    initGUI() {

        this.accordion = new Accordion(this.main, this.$projectexplorerDiv);

        this.initFilelistPanel();

        this.initWorkspacelistPanel();

    }

    initFilelistPanel() {

        let that = this;

        this.fileListPanel = new AccordionPanel(this.accordion, "Kein Workspace gewählt", "3",
            "img_add-file-dark", "Neue Datei...", "emptyFile", true, false, "file", true, []);

        this.fileListPanel.newElementCallback =

            (accordionElement, successfulNetworkCommunicationCallback) => {

                if (that.main.currentWorkspace == null) {
                    alert('Bitte wählen Sie zuerst einen Workspace aus.');
                    return null;
                }

                let f: File = {
                    name: accordionElement.name,
                    dirty: false,
                    saved: true,
                    text: "",
                    text_before_revision: null,
                    submitted_date: null,
                    student_edited_after_revision: false,
                    version: 1,
                    panelElement: accordionElement,
                    identical_to_repository_version: false,
                };
                that.fileListPanel.setElementClass(accordionElement, FileTypeManager.filenameToFileType(accordionElement.name).iconclass)
                let m = new Module(f, that.main);
                let modulStore = that.main.currentWorkspace.moduleStore;
                modulStore.putModule(m);
                that.setModuleActive(m);
                that.fileListPanel.setCaption(that.main.currentWorkspace.name);
                that.main.networkManager.sendCreateFile(m, that.main.currentWorkspace, that.main.workspacesOwnerId,
                    (error: string) => {
                        if (error == null) {
                            successfulNetworkCommunicationCallback(m);
                        } else {
                            alert('Der Server ist nicht erreichbar!');

                        }
                    });

            };

        this.fileListPanel.renameCallback =
            (module: Module, newName: string, ae: AccordionElement) => {
                newName = newName.substr(0, 80);
                let file = module.file;
                
                this.main.currentWorkspace.moduleStore.rename(file.name, newName);

                file.name = newName;
                file.saved = false;
                let fileType = FileTypeManager.filenameToFileType(newName);
                that.fileListPanel.setElementClass(ae, fileType.iconclass)
                monaco.editor.setModelLanguage(module.model, fileType.language);


                that.main.networkManager.sendUpdates();
                return newName;
            }

        this.fileListPanel.deleteCallback =
            (module: Module, callbackIfSuccessful: () => void) => {
                that.main.networkManager.sendDeleteWorkspaceOrFile("file", module.file.id, (error: string) => {
                    if (error == null) {
                        that.main.currentWorkspace.moduleStore.removeModule(module);
                        if (that.main.currentWorkspace.moduleStore.getModules(false).length == 0) {

                            that.fileListPanel.setCaption("Keine Datei vorhanden");
                        }
                        callbackIfSuccessful();
                    } else {
                        alert('Der Server ist nicht erreichbar!');

                    }
                });
            }



        this.fileListPanel.contextMenuProvider = (accordionElement: AccordionElement) => {

            let cmiList: AccordionContextMenuItem[] = [];
            let that = this;

            // cmiList.push({
            //     caption: "Dateityp",
            //     callback: (element: AccordionElement) => { },
            //     subMenu: FileTypeManager.filetypes.map((ft) => { return {
            //         caption: ft.name,
            //         callback: (element: AccordionElement) => {
            //             that.fileListPanel.setElementClass(element, ft.iconclass);
            //             let m: Module = element.externalElement;
            //             m.file.saved = false;
            //             that.main.networkManager.sendUpdates()
            //         }
            //     } })
            // })

            cmiList.push({
                caption: "Duplizieren",
                callback: (element: AccordionElement) => {

                    let module: Module = element.externalElement;

                    let f: File = {
                        name: module.file.name + " - Kopie",
                        dirty: true,
                        saved: false,
                        text: module.file.text,
                        text_before_revision: null,
                        submitted_date: null,
                        student_edited_after_revision: false,
                        version: module.file.version,
                        panelElement: null,
                        identical_to_repository_version: false,
                    };

                    let m = new Module(f, that.main);
                    let workspace = that.main.currentWorkspace;
                    let modulStore = workspace.moduleStore;
                    modulStore.putModule(m);
                    that.main.networkManager.sendCreateFile(m, workspace, that.main.workspacesOwnerId,
                        (error: string) => {
                            if (error == null) {
                                let element: AccordionElement = {
                                    isFolder: false,
                                    name: f.name,
                                    path: [],
                                    externalElement: m,
                                    iconClass: FileTypeManager.filenameToFileType(f.name).iconclass,
                                    readonly: false,
                                    isPruefungFolder: false
                                }
                                f.panelElement = element;
                                that.fileListPanel.addElement(element, true);
                                that.fileListPanel.sortElements();
                                that.setModuleActive(m);
                                that.fileListPanel.renameElement(element);
                            } else {
                                alert('Der Server ist nicht erreichbar!');

                            }
                        });


                }
            });


            if (!(that.main.user.is_teacher || that.main.user.is_admin || that.main.user.is_schooladmin)) {
                let module: Module = <Module>accordionElement.externalElement;
                let file = module.file;

                if (file.submitted_date == null) {
                    cmiList.push({
                        caption: "Als Hausaufgabe markieren",
                        callback: (element: AccordionElement) => {

                            let file = (<Module>element.externalElement).file;
                            file.submitted_date = dateToString(new Date());
                            file.saved = false;
                            that.main.networkManager.sendUpdates(null, true);
                            that.renderHomeworkButton(file);
                        }
                    });
                } else {
                    cmiList.push({
                        caption: "Hausaufgabenmarkierung entfernen",
                        callback: (element: AccordionElement) => {

                            let file = (<Module>element.externalElement).file;
                            file.submitted_date = null;
                            file.saved = false;
                            that.main.networkManager.sendUpdates(null, true);
                            that.renderHomeworkButton(file);

                        }
                    });
                }

            }

            return cmiList;
        }



        this.fileListPanel.selectCallback =
            (module: Module) => {
                that.setModuleActive(module);
            }


        this.$synchronizeAction = jQuery('<div class="img_open-change jo_button jo_active" style="margin-right: 4px"' +
            ' title="Workspace mit Repository synchronisieren">');



        this.$synchronizeAction.on('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();

            this.main.getCurrentWorkspace().synchronizeWithRepository();

        })

        this.fileListPanel.addAction(this.$synchronizeAction);
        this.$synchronizeAction.hide();

    }

    renderHomeworkButton(file: File) {
        let $buttonDiv = file?.panelElement?.$htmlFirstLine?.find('.jo_additionalButtonHomework');
        if ($buttonDiv == null) return;

        $buttonDiv.find('.jo_homeworkButton').remove();

        let klass: string = null;
        let title: string = "";
        if (file.submitted_date != null) {
            klass = "img_homework";
            title = "Wurde als Hausaufgabe abgegeben: " + file.submitted_date
            if (file.text_before_revision) {
                klass = "img_homework-corrected";
                title = "Korrektur liegt vor."
            }
        }

        if (klass != null) {
            let $homeworkButtonDiv = jQuery(`<div class="jo_homeworkButton ${klass}" title="${title}"></div>`);
            $buttonDiv.prepend($homeworkButtonDiv);
            if (klass.indexOf("jo_active") >= 0) {
                $homeworkButtonDiv.on('mousedown', (e) => e.stopPropagation());
                $homeworkButtonDiv.on('click', (e) => {
                    e.stopPropagation();
                    // TODO
                });
            }

        }
    }



    initWorkspacelistPanel() {

        let that = this;

        this.workspaceListPanel = new AccordionPanel(this.accordion, "WORKSPACES", "4",
            "img_add-workspace-dark", "Neuer Workspace...", "workspace", true, true, "workspace", false, ["file"]);

        this.workspaceListPanel.newElementCallback =

            (accordionElement, successfulNetworkCommunicationCallback) => {

                let owner_id: number = that.main.user.id;
                if (that.main.workspacesOwnerId != null) {
                    owner_id = that.main.workspacesOwnerId;
                }

                let w: Workspace = new Workspace(accordionElement.name, that.main, owner_id);
                w.isFolder = false;
                w.path = accordionElement.path.join("/");
                that.main.workspaceList.push(w);

                that.main.networkManager.sendCreateWorkspace(w, that.main.workspacesOwnerId, (error: string) => {
                    if (error == null) {
                        that.fileListPanel.enableNewButton(true);
                        successfulNetworkCommunicationCallback(w);
                        that.setWorkspaceActive(w);
                        w.renderSynchronizeButton(accordionElement);
                    } else {
                        alert('Der Server ist nicht erreichbar!');

                    }
                });
            };

        this.workspaceListPanel.renameCallback =
            (workspace: Workspace, newName: string) => {
                newName = newName.substr(0, 80);
                workspace.name = newName;
                workspace.saved = false;
                that.main.networkManager.sendUpdates();
                return newName;
            }

        this.workspaceListPanel.deleteCallback =
            (workspace: Workspace, successfulNetworkCommunicationCallback: () => void) => {
                that.main.networkManager.sendDeleteWorkspaceOrFile("workspace", workspace.id, (error: string) => {
                    if (error == null) {
                        that.main.removeWorkspace(workspace);
                        that.fileListPanel.clear();
                        that.main.getMonacoEditor().setModel(null);
                        that.fileListPanel.setCaption('Bitte Workspace selektieren');
                        this.$synchronizeAction.hide();
                        successfulNetworkCommunicationCallback();
                    } else {
                        alert('Der Server ist nicht erreichbar!');

                    }
                });
            }

        this.workspaceListPanel.selectCallback =
            (workspace: Workspace) => {
                if (workspace != null && !workspace.isFolder) {
                    that.main.networkManager.sendUpdates(() => {
                        that.setWorkspaceActive(workspace);
                    });
                }

            }

        this.workspaceListPanel.newFolderCallback = (newElement: AccordionElement, successCallback) => {
            let owner_id: number = that.main.user.id;
            if (that.main.workspacesOwnerId != null) {
                owner_id = that.main.workspacesOwnerId;
            }

            let folder: Workspace = new Workspace(newElement.name, that.main, owner_id);
            folder.isFolder = true;

            folder.path = newElement.path.join("/");
            folder.panelElement = newElement;
            newElement.externalElement = folder;
            that.main.workspaceList.push(folder);

            that.main.networkManager.sendCreateWorkspace(folder, that.main.workspacesOwnerId, (error: string) => {
                if (error == null) {
                    successCallback(folder);
                } else {
                    alert("Fehler: " + error);
                    that.workspaceListPanel.removeElement(newElement);
                }
            });

        }

        this.workspaceListPanel.moveCallback = (ae: AccordionElement | AccordionElement[]) => {
            if (!Array.isArray(ae)) ae = [ae];
            for (let a of ae) {
                let ws: Workspace = a.externalElement;
                ws.path = a.path.join("/");
                ws.saved = false;
            }
            this.main.networkManager.sendUpdates();
        }

        this.workspaceListPanel.dropElementCallback = (dest: AccordionElement, droppedElement: AccordionElement, dropEffekt: "copy" | "move") => {
            let workspace: Workspace = dest.externalElement;
            let module: Module = droppedElement.externalElement;

            if (workspace.moduleStore.getModules(false).indexOf(module) >= 0) return; // module is already in destination workspace

            let f: File = {
                name: module.file.name,
                dirty: true,
                saved: false,
                text: module.file.text,
                text_before_revision: null,
                submitted_date: null,
                student_edited_after_revision: false,
                version: module.file.version,
                panelElement: null,
                identical_to_repository_version: false,
            };

            if (dropEffekt == "move") {
                // move file
                let oldWorkspace = that.main.currentWorkspace;
                oldWorkspace.moduleStore.removeModule(module);
                that.fileListPanel.removeElement(module);
                that.main.networkManager.sendDeleteWorkspaceOrFile("file", module.file.id, () => { });
            }

            let m = new Module(f, that.main);
            let modulStore = workspace.moduleStore;
            modulStore.putModule(m);
            that.main.networkManager.sendCreateFile(m, workspace, that.main.workspacesOwnerId,
                (error: string) => {
                    if (error == null) {
                    } else {
                        alert('Der Server ist nicht erreichbar!');

                    }
                });

        }

        this.$homeAction = jQuery('<div class="img_home-dark jo_button jo_active" style="margin-right: 4px"' +
            ' title="Meine eigenen Workspaces anzeigen">');
        this.$homeAction.on('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();

            that.main.networkManager.sendUpdates(() => {
                that.onHomeButtonClicked();
            });

            that.main.bottomDiv.hideHomeworkTab();

        })


        this.workspaceListPanel.addAction(this.$homeAction);
        this.$homeAction.hide();

        this.workspaceListPanel.contextMenuProvider = (workspaceAccordionElement: AccordionElement) => {

            let cmiList: AccordionContextMenuItem[] = [];

            cmiList.push({
                caption: "Duplizieren",
                callback: (element: AccordionElement) => {
                    let srcWorkspace: Workspace = element.externalElement;
                    this.main.networkManager.sendDuplicateWorkspace(srcWorkspace,
                        (error: string, workspaceData) => {
                            if (error == null && workspaceData != null) {
                                let newWorkspace: Workspace = Workspace.restoreFromData(workspaceData, this.main);

                                this.main.rightDiv.classDiagram.duplicateSerializedClassDiagram(srcWorkspace.id, newWorkspace.id);

                                this.main.workspaceList.push(newWorkspace);
                                let path = workspaceData.path.split("/");
                                if (path.length == 1 && path[0] == "") path = [];
                                newWorkspace.panelElement = {
                                    name: newWorkspace.name,
                                    externalElement: newWorkspace,
                                    iconClass: newWorkspace.repository_id == null ? 'workspace' : 'repository',
                                    isFolder: false,
                                    path: path,
                                    readonly: false,
                                    isPruefungFolder: false
                                };

                                this.workspaceListPanel.addElement(newWorkspace.panelElement, true);
                                this.workspaceListPanel.sortElements();
                            }
                            if (error != null) {
                                alert(error);
                            }
                        })
                }
            },
                {
                    caption: "Exportieren",
                    callback: (element: AccordionElement) => {
                        let ws: Workspace = <Workspace>element.externalElement;
                        let name: string = ws.name.replace(/\//g, "_");
                        downloadFile(ws.toExportedWorkspace(), name + ".json")
                    }
                }
            );

            if (this.main.user.is_teacher && this.main.teacherExplorer.classPanel.elements.length > 0) {
                cmiList.push({
                    caption: "An Klasse austeilen...",
                    callback: (element: AccordionElement) => { },
                    subMenu: this.main.teacherExplorer.classPanel.elements.map((ae) => {
                        return {
                            caption: ae.name,
                            callback: (element: AccordionElement) => {
                                let klasse = <any>ae.externalElement;

                                let workspace: Workspace = element.externalElement;

                                this.main.networkManager.sendDistributeWorkspace(workspace, klasse, null, (error: string) => {
                                    if (error == null) {
                                        let networkManager = this.main.networkManager;
                                        let dt = networkManager.updateFrequencyInSeconds * networkManager.forcedUpdateEvery;
                                        alert("Der Workspace " + workspace.name + " wurde an die Klasse " + klasse.name + " ausgeteilt. Er wird sofort in der Workspaceliste der Schüler/innen erscheinen.\n Falls das bei einer Schülerin/einem Schüler nicht klappt, bitten Sie sie/ihn, sich kurz aus- und wieder einzuloggen.");
                                    } else {
                                        alert(error);
                                    }
                                });

                            }
                        }
                    })
                },
                    {
                        caption: "An einzelne Schüler/innen austeilen...",
                        callback: (element: AccordionElement) => {
                            let classes: ClassData[] = this.main.teacherExplorer.classPanel.elements.map(ae => ae.externalElement);
                            let workspace: Workspace = element.externalElement;
                            new DistributeToStudentsDialog(classes, workspace, this.main);
                        }
                    }
                );
            }

            if (this.main.repositoryOn && this.main.workspacesOwnerId == this.main.user.id) {
                if (workspaceAccordionElement.externalElement.repository_id == null) {
                    cmiList.push({
                        caption: "Repository anlegen...",
                        callback: (element: AccordionElement) => {
                            let workspace: Workspace = element.externalElement;

                            that.main.repositoryCreateManager.show(workspace);
                        },
                        subMenu: null,
                        // [{ n: 0, text: "nur privat sichtbar" }, { n: 1, text: "sichtbar für die Klasse" },
                        // { n: 2, text: "sichtbar für die Schule" }].map((k) => {
                        //     return {
                        //         caption: k.text,
                        //         callback: (element: AccordionElement) => {


                        // this.main.networkManager.sendCreateRepository(workspace, k.n, (error: string, repository_id?: number) => {
                        //     if (error == null) {
                        //         this.workspaceListPanel.setElementClass(element, "repository");
                        //         workspace.renderSynchronizeButton();
                        //         this.showRepositoryButtonIfNeeded(workspace);
                        //     } else {
                        //         alert(error);
                        //     }
                        // });

                        //         }
                        //     }
                        // })
                    });
                } else {
                    cmiList.push({
                        caption: "Mit Repository synchronisieren",
                        callback: (element: AccordionElement) => {
                            let workspace: Workspace = element.externalElement;
                            workspace.synchronizeWithRepository();
                        }
                    });
                    cmiList.push({
                        caption: "Vom Repository loslösen",
                        color: "#ff8080",
                        callback: (element: AccordionElement) => {
                            let workspace: Workspace = element.externalElement;
                            workspace.repository_id = null;
                            workspace.saved = false;
                            this.main.networkManager.sendUpdates(() => {
                                that.workspaceListPanel.setElementClass(element, "workspace");
                                workspace.renderSynchronizeButton(element);
                            }, true);
                        }
                    });
                }
            }

            cmiList.push({
                caption: "Einstellungen...",
                callback: (element: AccordionElement) => {
                    let workspace: Workspace = element.externalElement;
                    new WorkspaceSettingsDialog(workspace, this.main).open();
                }
            })

            return cmiList;
        }

    }

    onHomeButtonClicked() {
        this.workspaceListPanel.$buttonNew.show();
        this.workspaceListPanel.$newFolderAction.show();                

        this.main.teacherExplorer.restoreOwnWorkspaces();
        this.main.networkManager.updateFrequencyInSeconds = this.main.networkManager.ownUpdateFrequencyInSeconds;
        this.$homeAction.hide();
        this.fileListPanel.enableNewButton(this.main.workspaceList.length > 0);
    }

    renderFiles(workspace: Workspace) {

        let name = workspace == null ? "Kein Workspace vorhanden" : workspace.name;

        this.fileListPanel.setCaption(name);
        this.fileListPanel.clear();

        if (this.main.getCurrentWorkspace() != null) {
            for (let module of this.main.getCurrentWorkspace().moduleStore.getModules(false)) {
                module.file.panelElement = null;
            }
        }

        if (workspace != null) {
            let moduleList: Module[] = [];

            for (let m of workspace.moduleStore.getModules(false)) {
                moduleList.push(m);
            }

            moduleList.sort((a, b) => { return a.file.name > b.file.name ? 1 : a.file.name < b.file.name ? -1 : 0 });

            for (let m of moduleList) {

                m.file.panelElement = {
                    name: m.file.name,
                    externalElement: m,
                    isFolder: false,
                    path: [],
                    iconClass: FileTypeManager.filenameToFileType(m.file.name).iconclass,
                    readonly: workspace.readonly,
                    isPruefungFolder: false
                };

                this.fileListPanel.addElement(m.file.panelElement, true);
                this.renderHomeworkButton(m.file);
            }

            this.fileListPanel.sortElements();

        }
    }

    renderWorkspaces(workspaceList: Workspace[]) {

        this.fileListPanel.clear();
        this.workspaceListPanel.clear();

        for (let w of workspaceList) {
            let path = w.path.split("/");
            if (path.length == 1 && path[0] == "") path = [];
            w.panelElement = {
                name: w.name,
                externalElement: w,
                iconClass: w.repository_id == null ? 'workspace' : 'repository',
                isFolder: w.isFolder,
                path: path,
                readonly: w.readonly,
                isPruefungFolder: false
            };

            this.workspaceListPanel.addElement(w.panelElement, false);

            w.renderSynchronizeButton(w.panelElement);
        }

        this.workspaceListPanel.sortElements();
        this.fileListPanel.enableNewButton(workspaceList.length > 0);
        // setTimeout(() => {
        //     this.workspaceListPanel.collapseAll();
        // }, 500);

    }

    renderErrorCount(workspace: Workspace, errorCountMap: Map<Module, number>) {
        if (errorCountMap == null) return;
        for (let m of workspace.moduleStore.getModules(false)) {
            let errorCount: number = errorCountMap.get(m);
            let errorCountS: string = ((errorCount == null || errorCount == 0) ? "" : "(" + errorCount + ")");

            this.fileListPanel.setTextAfterFilename(m.file.panelElement, errorCountS, 'jo_errorcount');
        }
    }

    showRepositoryButtonIfNeeded(w: Workspace) {
        if (w.repository_id != null && w.owner_id == this.main.user.id) {
            this.$synchronizeAction.show();

            if (!this.main.user.settings.helperHistory.repositoryButtonDone) {

                Helper.showHelper("repositoryButton", this.main, this.$synchronizeAction);

            }



        } else {
            this.$synchronizeAction.hide();
        }
    }

    setWorkspaceActive(w: Workspace, scrollIntoView: boolean = false) {

        DatabaseNewLongPollingListener.close();

        this.workspaceListPanel.select(w, false, scrollIntoView);

        if (this.main.interpreter.state == InterpreterState.running) {
            this.main.interpreter.stop();
        }

        this.main.currentWorkspace = w;
        this.renderFiles(w);

        if (w != null) {
            let nonSystemModules = w.moduleStore.getModules(false);

            if (w.currentlyOpenModule != null) {
                this.setModuleActive(w.currentlyOpenModule);
            } else if (nonSystemModules.length > 0) {
                this.setModuleActive(nonSystemModules[0]);
            } else {
                this.setModuleActive(null);
            }

            if (nonSystemModules.length == 0 && !this.main.user.settings.helperHistory.newFileHelperDone) {

                Helper.showHelper("newFileHelper", this.main, this.fileListPanel.$captionElement);

            }

            this.showRepositoryButtonIfNeeded(w);

            let spritesheet = new SpritesheetData();
            spritesheet.initializeSpritesheetForWorkspace(w, this.main).then(() => {
                for (let m of nonSystemModules) {
                    m.file.dirty = true;
                }
            });

            this.main.bottomDiv.gradingManager?.setValues(w); 

        } else {
            this.setModuleActive(null);
        }


    }

    writeEditorTextToFile() {
        let cem = this.getCurrentlyEditedModule();
        if (cem != null)
            cem.file.text = cem.getProgramTextFromMonacoModel(); // 29.03. this.main.monaco.getValue();
    }


    lastOpenModule: Module = null;
    setModuleActive(m: Module) {

        this.main.bottomDiv.homeworkManager.hideRevision();

        if (this.lastOpenModule != null) {
            this.lastOpenModule.getBreakpointPositionsFromEditor();
            this.lastOpenModule.file.text = this.lastOpenModule.getProgramTextFromMonacoModel(); // this.main.monaco.getValue();
            this.lastOpenModule.editorState = this.main.getMonacoEditor().saveViewState();
        }

        if (m == null) {
            this.main.getMonacoEditor().setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));
            this.main.getMonacoEditor().updateOptions({ readOnly: true });
            this.fileListPanel.setCaption('Keine Datei vorhanden');
        } else {
            this.main.getMonacoEditor().updateOptions({ readOnly: this.main.currentWorkspace.readonly && !this.main.user.is_teacher });
            this.main.getMonacoEditor().setModel(m.model);
            if (this.main.getBottomDiv() != null) this.main.getBottomDiv().errorManager.showParenthesisWarning(m.bracketError);

            if (m.file.text_before_revision != null) {
                this.main.bottomDiv.homeworkManager.showHomeWorkRevisionButton();
            } else {
                this.main.bottomDiv.homeworkManager.hideHomeworkRevisionButton();
            }
        }


    }

    setActiveAfterExternalModelSet(m: Module) {
        this.fileListPanel.select(m, false);

        this.lastOpenModule = m;

        if (m.editorState != null) {
            this.main.editor.dontPushNextCursorMove++;
            this.main.getMonacoEditor().restoreViewState(m.editorState);
            this.main.editor.dontPushNextCursorMove--;
        }

        m.renderBreakpointDecorators();

        this.setCurrentlyEditedModule(m);

        this.showProgramPointer();

        setTimeout(() => {
            if (!this.main.getMonacoEditor().getOptions().get(monaco.editor.EditorOption.readOnly)) {
                this.main.getMonacoEditor().focus();
            }
        }, 300);

    }


    private showProgramPointer() {

        if (this.programPointerModule == this.getCurrentlyEditedModule() && this.getCurrentlyEditedModule() != null) {
            let position = this.programPointerPosition;
            let range = {
                startColumn: position.column, startLineNumber: position.line,
                endColumn: position.column + position.length, endLineNumber: position.line
            };

            this.main.getMonacoEditor().revealRangeInCenterIfOutsideViewport(range);
            this.programPointerDecoration = this.main.getMonacoEditor().deltaDecorations(this.programPointerDecoration, [
                {
                    range: range,
                    options: {
                        className: 'jo_revealProgramPointer', isWholeLine: true,
                        overviewRuler: {
                            color: "#6fd61b",
                            position: monaco.editor.OverviewRulerLane.Center
                        },
                        minimap: {
                            color: "#6fd61b",
                            position: monaco.editor.MinimapPosition.Inline
                        }
                    }
                },
                {
                    range: range,
                    options: { beforeContentClassName: 'jo_revealProgramPointerBefore' }
                }
            ]);

        }
    }

    showProgramPointerPosition(file: File, position: TextPosition) {

        // console statement execution:
        if (file == null) {
            return;
        }

        let module = this.main.currentWorkspace.moduleStore.findModuleByFile(file);
        if (module == null) {
            return;
        }

        this.programPointerModule = module;
        this.programPointerPosition = position;

        if (module != this.getCurrentlyEditedModule()) {
            this.setModuleActive(module);
        } else {
            this.showProgramPointer();
        }

    }

    hideProgramPointerPosition() {
        if (this.getCurrentlyEditedModule() == this.programPointerModule) {
            this.main.getMonacoEditor().deltaDecorations(this.programPointerDecoration, []);
        }
        this.programPointerModule = null;
        this.programPointerDecoration = [];
    }

    getCurrentlyEditedModule(): Module {
        let ws = this.main.currentWorkspace;
        if (ws == null) return null;

        return ws.currentlyOpenModule;
    }

    setCurrentlyEditedModule(m: Module) {
        if (m == null) return;
        let ws = this.main.currentWorkspace;
        if (ws.currentlyOpenModule != m) {
            ws.currentlyOpenModule = m;
            ws.saved = false;
            m.file.dirty = true;
        }
    }

    setExplorerColor(color: string, usersFullName?: string) {
        let caption: string;

        if (color == null) {
            color = "transparent";
            caption = "Meine WORKSPACES";
        } else {
            caption = usersFullName;
        }

        this.fileListPanel.$listElement.parent().css('background-color', color);
        this.workspaceListPanel.$listElement.parent().css('background-color', color);

        this.workspaceListPanel.setCaption(caption);
    }

    getNewModule(fileData: FileData): Module {
        return Module.restoreFromData(fileData, this.main);
    }

    async fetchAndRenderOwnWorkspaces() {
        await this.fetchAndRenderWorkspaces(this.main.user);
    }

    async fetchAndRenderWorkspaces(ae: UserData, teacherExplorer?: TeacherExplorer, pruefung: Pruefung = null) {


        await this.main.networkManager.sendUpdates();

        let request: GetWorkspacesRequest = {
            ws_userId: ae.id,
            userId: this.main.user.id
        }

        let response: GetWorkspacesResponse = await ajaxAsync("/servlet/getWorkspaces", request);

        if (response.success == true) {

            if (this.main.workspacesOwnerId == this.main.user.id && teacherExplorer != null) {
                teacherExplorer.ownWorkspaces = this.main.workspaceList.slice();
                teacherExplorer.currentOwnWorkspace = this.main.currentWorkspace;
            }

            let isTeacherAndInPruefungMode = teacherExplorer?.classPanelMode == "tests";

            if (ae.id != this.main.user.id) {
                
                if (isTeacherAndInPruefungMode) {
                    response.workspaces.workspaces = response.workspaces.workspaces.filter(w => w.pruefung_id == pruefung.id);
                }

            }
                        
            this.main.workspacesOwnerId = ae.id;
            this.main.restoreWorkspaces(response.workspaces, false);
            
            if (ae.id != this.main.user.id) {
                this.main.projectExplorer.setExplorerColor("rgba(255, 0, 0, 0.2", ae.familienname + ", " + ae.rufname);
                this.main.projectExplorer.$homeAction.show();
                Helper.showHelper("homeButtonHelper", this.main);
                this.main.networkManager.updateFrequencyInSeconds = this.main.networkManager.teacherUpdateFrequencyInSeconds;
                this.main.networkManager.secondsTillNextUpdate = this.main.networkManager.teacherUpdateFrequencyInSeconds;

                if(!isTeacherAndInPruefungMode){
                    this.main.bottomDiv.homeworkManager.attachToWorkspaces(this.main.workspaceList);
                    this.main.bottomDiv.showHomeworkTab();
                }
            }

            if(pruefung != null){
                this.workspaceListPanel.$buttonNew.hide();
                this.workspaceListPanel.$newFolderAction.hide();
            } else {
                this.workspaceListPanel.$buttonNew.show();
                this.workspaceListPanel.$newFolderAction.show();                
            }
        }



    }


}