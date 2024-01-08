import jQuery from 'jquery';
import { ajax } from "../../communication/AjaxHelper.js";
import { GetRepositoryRequest, GetRepositoryResponse, Repository, GainRepositoryLockRequest, GainRepositoryLockResponse, LeaseRepositoryLockRequest, LeaseRepositoryLockResponse } from "../../communication/Data.js";
import { EmbeddedSlider } from "../../embedded/EmbeddedSlider.js";
import { Main } from "../../main/Main.js";
import { makeDiv } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { HistoryElement } from "./HistoryElement.js";
import { RepositoryTool } from "./RepositoryTool.js";
import { LeftRight, SynchronizationListElement } from "./SynchronizationListElement.js";
import { SynchroFile, SynchroWorkspace } from "./SynchroWorkspace.js";
import { Dialog } from "../../main/gui/Dialog.js";
import { SpritesheetData } from "../../spritemanager/SpritesheetData.js";


type FileElement = {
    id: number,
    name: string,
    leftSynchroFile: SynchroFile,
    rightSynchroFile: SynchroFile
}

export class SynchronizationManager {

    $mainHeadingDiv: JQuery<HTMLDivElement>; // heading "Java-Online: Synchronize repositories"

    $writeWorkspaceChangesButton: JQuery<HTMLDivElement>;
    $writeRepositoryChangesButton: JQuery<HTMLDivElement>;

    $backToWorkspaceButton: JQuery<HTMLDivElement>;
    $backToCurrentRepositoryVersionButton: JQuery<HTMLDivElement>;

    $exitButton: JQuery<HTMLDivElement>;

    $belowMainHeadingDiv: JQuery<HTMLDivElement>; // contains all elements below main heading

    $leftDiv: JQuery<HTMLDivElement>; // contains headings, file lists and editors
    $historyOuterDiv: JQuery<HTMLDivElement>; // contains history
    $historyScrollDiv: JQuery<HTMLDivElement>;

    $leftUpperDiv: JQuery<HTMLDivElement>; // contains file list header, file list and file list footer

    $fileListHeaderOuterDiv: JQuery<HTMLDivElement>;
    $fileListHeaderDivs: JQuery<HTMLDivElement>[] = [];

    $fileListHeaderContainerRight: JQuery<HTMLDivElement>;

    $updateAllButton: JQuery<HTMLElement>;
    $commitAllButton: JQuery<HTMLElement>;


    $fileListOuterDiv: JQuery<HTMLDivElement>;
    $fileListDivs: JQuery<HTMLDivElement>[] = [];

    $fileListFooterDiv: JQuery<HTMLDivElement>;

    $editorDiv: JQuery<HTMLDivElement>;

    guiReady: boolean = false;
    diffEditor: monaco.editor.IStandaloneDiffEditor;

    currentUserSynchroWorkspace: SynchroWorkspace;
    currentRepositorySynchroWorkspace: SynchroWorkspace;
    currentRepository: Repository;

    leftSynchroWorkspace: SynchroWorkspace;
    rightSynchroWorkspace: SynchroWorkspace;

    lastShownSynchronizationElement: SynchronizationListElement;
    synchronizationListElements: SynchronizationListElement[] = [];

    lastShownHistoryElement: HistoryElement;
    historyElements: HistoryElement[] = [];

    timer: any;

    repositoryIsWritable: boolean;

    constructor(public main: Main) {
    }

    synchronizeWithWorkspace(workspace: Workspace) {

        this.gainRepositoryLock(workspace.repository_id, (success) => {
            if (success) {
                this.repositoryIsWritable = true;
                this.attachToWorkspaceAndRepository(workspace);
                this.show();

                this.timer = setInterval(() => {

                    this.gainRepositoryLock(this.currentRepository.id, (success) => {
                        if (!success) {
                            alert('Der Server ist temporär nicht erreichbar.');
                            window.history.back();
                        }
                    })

                }, 10000)
            } else {
                // User has no write permission to repository => no lock needed.
                this.attachToWorkspaceAndRepository(workspace);
                this.repositoryIsWritable = false;
                this.show();
            }
        });

    }

    gainRepositoryLock(repository_id: number, callback: (success: boolean) => void) {
        let request: GainRepositoryLockRequest = { repository_id: repository_id };
        ajax('gainRepositoryLock', request, (response: GainRepositoryLockResponse) => {
            callback(response.success);
            // console.log("Lock for repository_id " + repository_id + " has been granted.")
        }, (message) => {
            alert(message);
            callback(false);
        });
    }

    attachToWorkspaceAndRepository(workspace: Workspace) {

        this.currentUserSynchroWorkspace = new SynchroWorkspace(this).copyFromWorkspace(workspace);
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;

        let that = this;

        let request: GetRepositoryRequest = { repository_id: workspace.repository_id, workspace_id: workspace.id };
        ajax("getRepository", request, (response: GetRepositoryResponse) => {

            that.attachToRepository(response.repository);
            if (response.repository.spritesheet_id && response.repository.spritesheet_id != workspace.spritesheetId) {
                {
                    workspace.spritesheetId = response.repository.spritesheet_id;
                    let spritesheet = new SpritesheetData();
                    spritesheet.initializeSpritesheetForWorkspace(workspace, this.main).then(() => {
                        for (let m of workspace.moduleStore.getModules(false)) {
                            m.file.dirty = true;
                        }
                    });
                }
            }

        }, (message: string) => {
            alert(message);
            window.history.back();
        })

    }

    attachToRepository(repository: Repository) {
        this.currentRepository = repository;
        RepositoryTool.deserializeRepository(this.currentRepository);
        this.currentRepositorySynchroWorkspace = new SynchroWorkspace(this).copyFromRepository(this.currentRepository, true);

        this.rightSynchroWorkspace = this.currentRepositorySynchroWorkspace;
        this.setupSynchronizationListElements();
        this.setupHistoryElements();
    }

    setupHistoryElements() {
        this.$historyScrollDiv.empty();
        this.historyElements = [];
        this.lastShownHistoryElement = null;

        this.currentRepository.historyEntries.forEach((he, index) => {
            this.historyElements.push(new HistoryElement(this, this.currentRepository, he, index));
        });
    }

    setupSynchronizationListElements() {

        let lastSynchroFileLeft = null;
        let lastSynchroFileRight = null;
        if (this.lastShownSynchronizationElement != null) {
            lastSynchroFileLeft = this.lastShownSynchronizationElement.leftSynchroFile;
            lastSynchroFileRight = this.lastShownSynchronizationElement.rightSynchroFile;
        }

        this.$fileListDivs.forEach($div => $div.empty());

        this.synchronizationListElements.forEach(se => se.emptyGUI());
        this.synchronizationListElements = [];
        this.lastShownSynchronizationElement = null;

        let fileElements: FileElement[] = [];
        let synchroFileMap: { [id: string]: FileElement } = {};

        this.leftSynchroWorkspace.files.forEach(sfile => {
            let fileElement = {
                id: sfile.idInsideRepository,
                name: sfile.name,
                leftSynchroFile: sfile,
                rightSynchroFile: null
            };

            fileElements.push(fileElement);
            if (sfile.idInsideRepository != null) {
                synchroFileMap["r" + sfile.idInsideRepository] = fileElement;
            } else {
                synchroFileMap["w" + sfile.idInsideWorkspace] = fileElement;
            }
        });

        this.rightSynchroWorkspace.files.forEach(sfile => {
            let fileElement: FileElement = null;
            if (sfile.idInsideRepository != null) {
                fileElement = synchroFileMap["r" + sfile.idInsideRepository];
            } else {
                fileElement = synchroFileMap["w" + sfile.idInsideWorkspace];
            }
            if (fileElement == null) {
                fileElement = {
                    id: sfile.idInsideRepository,
                    name: sfile.name,
                    leftSynchroFile: null,
                    rightSynchroFile: sfile
                };
                fileElements.push(fileElement);
            } else {
                fileElement.rightSynchroFile = sfile;
            }
        });

        fileElements.sort((fe1, fe2) => fe1.name.localeCompare(fe2.name));

        fileElements.forEach(fe => {

            let synchroListElement = new SynchronizationListElement(this, fe.leftSynchroFile, fe.rightSynchroFile, this.leftSynchroWorkspace, this.rightSynchroWorkspace);
            this.synchronizationListElements.push(synchroListElement);
            synchroListElement.compareFilesAndAdaptGUI();

        });

        this.diffEditor.setModel({
            original: monaco.editor.createModel("Wählen Sie oben eine Datei aus!", "myJava"),
            modified: monaco.editor.createModel("Wählen Sie oben eine Datei aus!", "myJava")
        });

        this.diffEditor.updateOptions({
            originalEditable: false
        })

        if (this.leftSynchroWorkspace == this.currentUserSynchroWorkspace) {
            this.setHeader("left", "Dein Workspace:");
            this.$backToWorkspaceButton.hide();
        } else {
            this.setHeader("left", this.leftSynchroWorkspace.name + ":");
            this.$backToWorkspaceButton.show();
            this.$writeWorkspaceChangesButton.hide();
        }

        if (this.rightSynchroWorkspace == this.currentRepositorySynchroWorkspace) {
            let writable: string = this.repositoryIsWritable ? ", mit Schreibzugriff" : ", ohne Schreibzugriff";
            this.setHeader("right", "Repository (aktuelle Version" + writable + "):");
            this.$backToCurrentRepositoryVersionButton.hide();
        } else {
            this.setHeader("right", this.rightSynchroWorkspace.name + ":");
            this.$backToCurrentRepositoryVersionButton.show();
            this.$writeRepositoryChangesButton.hide();
        }

        jQuery('#jo_synchro_main_heading_text').text(`Synchronisieren mit Repository "${this.currentRepository.name}"${this.repositoryIsWritable ? "" : " (read-only)"}`);

        let lastFileSelected: boolean = false;
        if (lastSynchroFileLeft != null || lastSynchroFileRight != null) {
            for (let sle of this.synchronizationListElements) {
                if (
                    sle.leftSynchroFile != null && sle.leftSynchroFile == lastSynchroFileLeft ||
                    sle.rightSynchroFile != null && sle.rightSynchroFile == lastSynchroFileRight
                ) {
                    sle.select();
                    lastFileSelected = true;
                    break;
                }
            }
        }

        if (!lastFileSelected && this.synchronizationListElements.length > 0) {
            this.synchronizationListElements[0].select();
        }

    }

    show() {
        if (!this.guiReady) {
            this.initGUI();
        }
        let $synchroDiv = jQuery('#synchronize-div');
        $synchroDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');

        this.$writeWorkspaceChangesButton.hide();
        this.$writeRepositoryChangesButton.hide();

        let that = this;
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });
    }

    hide() {
        let $synchroDiv = jQuery('#synchronize-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');

        clearInterval(this.timer);

        if (this.currentRepository == null) return;   // Testuser...

        let request: LeaseRepositoryLockRequest = { repository_id: this.currentRepository.id };
        ajax('leaseRepositoryLock', request, (response: LeaseRepositoryLockResponse) => {
            // console.log("Lock for repository_id " + request.repository_id + " has been released.")
        }, (message) => {
        });
    }

    initGUI() {
        this.guiReady = true;
        let $synchroDiv = jQuery('#synchronize-div');
        let that = this;

        $synchroDiv.append(

            this.$mainHeadingDiv = jQuery('<div id="jo_synchro_main_heading"><span id="jo_synchro_main_heading_text">Java-Online: Workspace mit Repository synchronisieren</span></div>'),

            this.$belowMainHeadingDiv = makeDiv("jo_synchro_below_main_heading"));

        let $buttonsTopRightDiv = makeDiv("jo_synchro_buttonsTopRight");
        this.$mainHeadingDiv.append($buttonsTopRightDiv);

        $buttonsTopRightDiv.append(this.$exitButton = jQuery('<div id="jo_synchro_exitButton" class="jo_synchro_button">Zurück zum Programmieren</div>'));

        this.$exitButton.on('click', () => {
            window.history.back();
        });

        this.$leftDiv = makeDiv("jo_synchro_leftDiv");
        this.$historyOuterDiv = makeDiv("jo_synchro_historyOuterDiv");

        this.$historyOuterDiv.append(jQuery('<div id="jo_synchro_historyHeader"><div class="jo_synchro_tabHeading">History:</div></div>)'));

        this.$belowMainHeadingDiv.append(this.$leftDiv, this.$historyOuterDiv);

        new EmbeddedSlider(this.$historyOuterDiv, true, false, () => { this.diffEditor.layout(); }).$sliderDiv.css('left', '-3px');
        this.$historyOuterDiv.find('.joe_slider').css('position', 'absolute');

        this.$historyScrollDiv = makeDiv("historyScrollDiv", "jo_scrollable");
        this.$historyOuterDiv.append(this.$historyScrollDiv);


        this.$leftDiv.append(
            this.$leftUpperDiv = makeDiv("jo_synchro_leftUpper"),
            this.$editorDiv = makeDiv("jo_synchro_editor")
        );

        this.$leftUpperDiv.append(
            this.$fileListHeaderOuterDiv = makeDiv("jo_synchro_fileListHeaderOuter"),
            this.$fileListOuterDiv = makeDiv("jo_synchro_fileListOuter", "jo_scrollable"),
            this.$fileListFooterDiv = makeDiv("jo_synchro_fileListFooter")
        )

        this.$fileListHeaderContainerRight = makeDiv(null, "jo_synchro_fileListHeaderContainerRight");
        let fileListHeaderRight = makeDiv(null, "jo_synchro_fileListHeader");
        this.$fileListHeaderContainerRight.append(fileListHeaderRight);

        let $fileListHeaderCenter = makeDiv(null, "jo_synchro_fileListHeaderCenter");
        $fileListHeaderCenter.append(this.$updateAllButton = SynchronizationListElement.makeButton("updateAll", "left", () => { that.updateAll() }, false));
        $fileListHeaderCenter.append(this.$commitAllButton = SynchronizationListElement.makeButton("commitAll", "right", () => { that.commitAll() }, false));

        this.$fileListHeaderDivs.push(makeDiv(null, "jo_synchro_fileListHeader", "", { "flex": "2 0" }), $fileListHeaderCenter, this.$fileListHeaderContainerRight, makeDiv(null, "jo_synchro_scrollbarPlaceholder"));
        this.$fileListDivs.push(makeDiv(null, "jo_synchro_fileList"), makeDiv(null, "jo_synchro_fileListButtonsLeft"), makeDiv(null, "jo_synchro_fileListButtonsRight"), makeDiv(null, "jo_synchro_fileList"));

        this.$fileListHeaderOuterDiv.append(this.$fileListHeaderDivs);
        this.$fileListOuterDiv.append(this.$fileListDivs);

        this.$fileListHeaderDivs[0].append("<div class='jo_synchro_tabHeading'>Dein Workspace:</div>");
        fileListHeaderRight.append("<div class='jo_synchro_tabHeading'>Repository (aktuelle Version):</div>");


        this.$fileListHeaderDivs[0].append(this.$backToWorkspaceButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige eigenen Workspace</div>'));
        this.$backToWorkspaceButton.on('click', () => {
            that.backToWorkspace();
        });
        this.$backToWorkspaceButton.hide();




        fileListHeaderRight.append(this.$backToCurrentRepositoryVersionButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige aktuelle Repository-Version</div>'));
        this.$backToCurrentRepositoryVersionButton.on('click', () => {
            that.backToCurrentRepositoryVersion();
        });
        this.$backToWorkspaceButton.hide();

        this.$fileListHeaderDivs[0].append(this.$writeWorkspaceChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Workspace (rot!) speichern</div>'));
        this.$writeWorkspaceChangesButton.on('click', () => {
            that.writeWorkspaceChanges();
        });
        this.$writeWorkspaceChangesButton.hide();

        fileListHeaderRight.append(this.$writeRepositoryChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Repository (rot!) speichern</div>'));
        this.$writeRepositoryChangesButton.on('click', () => {
            that.writeRepositoryChanges();
        });
        this.$writeRepositoryChangesButton.hide();




        let horizontalSlider = new EmbeddedSlider(this.$editorDiv, true, true, () => { this.diffEditor.layout(); });
        horizontalSlider.setColor('var(--slider)');

        this.makeDroppable("left", this.$fileListDivs[0]);
        this.makeDroppable("right", this.$fileListDivs[3]);

        this.initEditor();
    }

    backToWorkspace() {
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        this.setupSynchronizationListElements();
        this.onContentChanged("left");
    }

    backToCurrentRepositoryVersion() {
        this.rightSynchroWorkspace = this.currentRepositorySynchroWorkspace;
        this.setupSynchronizationListElements();
        this.onContentChanged("right");
    }

    makeDroppable(leftRight: LeftRight, $dropZoneDiv: JQuery<HTMLDivElement>) {
        let that = this;
        $dropZoneDiv.on("dragover", (e) => {
            $dropZoneDiv.addClass('jo_synchro_dragZone');
            e.preventDefault();
        });
        $dropZoneDiv.on("dragleave", () => {
            $dropZoneDiv.removeClass('jo_synchro_dragZone');
        });
        $dropZoneDiv.on("drop", (e) => {
            let sw = new SynchroWorkspace(that).copyFromHistoryElement(HistoryElement.currentlyDragged);
            switch (leftRight) {
                case "left":
                    that.leftSynchroWorkspace = sw;
                    break;
                case "right":
                    that.rightSynchroWorkspace = sw;
                    break;
            }
            that.setupSynchronizationListElements();
            $dropZoneDiv.removeClass('jo_synchro_dragZone');
        })

    }

    setHeader(leftRight: LeftRight, caption: string) {
        let index: number = leftRight == "left" ? 0 : 2;
        this.$fileListHeaderDivs[index].find('.jo_synchro_tabHeading').text(caption);
    }

    writeRepositoryChanges() {

        let that = this;
        this.$writeRepositoryChangesButton.hide();

        let $dialogDiv = makeDiv("", "jo_synchro_commitDialogDiv");
        $dialogDiv.hide();
        this.$fileListHeaderContainerRight.append($dialogDiv);

        $dialogDiv.append(makeDiv("", "jo_synchro_commitDialogCaption", "Bitte beschreibe kurz die vorgenommenen Änderungen am Repository:"));
        let $dialogTextarea: JQuery<HTMLTextAreaElement> = jQuery('<textarea class="jo_synchro_commitDialogTextarea"></textarea>');
        $dialogDiv.append($dialogTextarea);

        let $dialogButtonDiv = makeDiv("", "jo_synchro_commitDialogButtonDiv");
        $dialogDiv.append($dialogButtonDiv);

        let $buttonCancel = makeDiv("", "jo_synchro_button", "Abbrechen", { "background-color": "var(--updateButtonBackground)", "color": "var(--updateButtonColor)" })
        $dialogButtonDiv.append($buttonCancel);

        $buttonCancel.on("click", () => {
            $dialogDiv.remove();
            that.$writeRepositoryChangesButton.show();
        })

        let $buttonOK = makeDiv("", "jo_synchro_button", "OK", { "background-color": "var(--createButtonBackground)", "color": "var(--createButtonColor)" })
        $dialogButtonDiv.append($buttonOK);

        $dialogDiv.show(600);

        $buttonOK.on("click", () => {
            let comment = <string>$dialogTextarea.val();
            $dialogDiv.remove();

            this.currentRepositorySynchroWorkspace.commit(this.currentUserSynchroWorkspace.copiedFromWorkspace, this.currentRepository, comment,
                this.main, (repository: Repository, errorMessage: string) => {

                    if (errorMessage != null) {
                        alert(errorMessage);
                        this.attachToWorkspaceAndRepository(this.currentRepositorySynchroWorkspace.copiedFromWorkspace);
                    } else {
                        this.attachToRepository(repository);
                        this.$writeRepositoryChangesButton.hide();
                    }

                });

        })

        $dialogTextarea.focus();

    }

    writeWorkspaceChanges() {
        this.currentUserSynchroWorkspace.writeChangesToWorkspace();
        this.currentUserSynchroWorkspace = new SynchroWorkspace(this).copyFromWorkspace(this.currentUserSynchroWorkspace.copiedFromWorkspace);
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        this.setupSynchronizationListElements();
        this.$writeWorkspaceChangesButton.hide();
    }

    initEditor() {
        this.diffEditor = monaco.editor.createDiffEditor(document.getElementById("jo_synchro_editor"), {
            originalEditable: true, // for left pane
            readOnly: true,         // for right pane
            automaticLayout: true
        });
    }

    onContentChanged(leftRight: LeftRight) {
        let $button: JQuery<HTMLDivElement> = leftRight == "left" ? this.$writeWorkspaceChangesButton : this.$writeRepositoryChangesButton
        let synchroWorkspace: SynchroWorkspace = leftRight == "left" ? this.currentUserSynchroWorkspace : this.currentRepositorySynchroWorkspace;

        if (synchroWorkspace.hasChanges()) {
            $button.show();
        } else {
            $button.hide();
        }

    }

    updateAll() {
        let updateButtons = this.$fileListDivs[1].find('.jo_synchro_updateButton');
        updateButtons.click();
    }

    commitAll() {
        let commitButtons = this.$fileListDivs[2].find('.jo_synchro_commitButton');
        commitButtons.click();
    }


    updateCenterButtons() {
        let updateButtons = this.$fileListDivs[1].find('.jo_synchro_updateButton');
        if (updateButtons.length > 0) {
            this.$updateAllButton.css("visibility", "inherit");
        } else {
            this.$updateAllButton.css("visibility", "hidden");
        }

        let commitButtons = this.$fileListDivs[2].find('.jo_synchro_commitButton');
        if (commitButtons.length > 0) {
            this.$commitAllButton.css("visibility", "inherit");
        } else {
            this.$commitAllButton.css("visibility", "hidden");
        }
    }


}