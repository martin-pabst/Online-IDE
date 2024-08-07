import jQuery from 'jquery';
import { TeachersWithClassesMI } from "../../administration/TeachersWithClasses.js";
import { RepositoryFileEntry } from "../../communication/Data.js";
import { File } from "../../compiler/parser/Module.js";
import { makeDiv } from "../../../tools/HtmlTools.js";
import { SynchronizationManager } from "./RepositorySynchronizationManager.js";
import { SynchroFile, SynchroWorkspace } from "./SynchroWorkspace.js";

type ButtonKind = "create" | "delete" | "update" | "commit" | "updateAll" | "commitAll";
export type LeftRight = "left" | "right";


export class SynchronizationListElement {

    $leftFileDiv: JQuery<HTMLDivElement>;
    $rightFileDiv: JQuery<HTMLDivElement>;
    $buttonLeftDiv: JQuery<HTMLDivElement>;
    $buttonRightDiv: JQuery<HTMLDivElement>;

    $markAsMergedButtonDiv: JQuery<HTMLDivElement>;
    $mergedFlag: JQuery<HTMLDivElement>;

    editorState: monaco.editor.IDiffEditorViewState;

    $buttons: JQuery<HTMLDivElement>[] = [];

    constructor(private manager: SynchronizationManager, public leftSynchroFile: SynchroFile, public rightSynchroFile: SynchroFile,
        public leftSynchroWorkspace: SynchroWorkspace, public rightSynchroWorkspace: SynchroWorkspace) {

        this.$leftFileDiv = makeDiv(null, "jo_synchro_workspaceFileDiv jo_synchro_listDiv");
        this.$buttonLeftDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonLeftDiv");
        this.$buttonRightDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonRightDiv");
        this.$rightFileDiv = makeDiv(null, "jo_synchro_repositoryFileDiv jo_synchro_listDiv");
        manager.$fileListDivs[0].append(this.$leftFileDiv);
        manager.$fileListDivs[1].append(this.$buttonLeftDiv);
        manager.$fileListDivs[2].append(this.$buttonRightDiv);
        manager.$fileListDivs[3].append(this.$rightFileDiv);

        if (leftSynchroFile != null && leftSynchroFile.state != "original") this.$leftFileDiv.addClass('jo_dirty');
        if (rightSynchroFile != null && rightSynchroFile.state != "original") this.$rightFileDiv.addClass('jo_dirty');



        let allDivs: JQuery<HTMLDivElement>[] = [this.$leftFileDiv, this.$buttonLeftDiv, this.$buttonRightDiv, this.$rightFileDiv];

        let that = this;

        for (let $div of allDivs) {
            $div.on("mouseenter", () => {
                for (let $div of allDivs) $div.addClass('jo_synchro_hoverLine');
            });
            $div.on("mouseleave", () => {
                for (let $div of allDivs) $div.removeClass('jo_synchro_hoverLine').removeClass("jo_synchro_hoverActiveLine");
            });

            $div.on("mousedown", () => {
                for (let $div of allDivs) $div.addClass('jo_synchro_hoverActiveLine')
            });
            $div.on("mouseup", () => { for (let $div of allDivs) $div.removeClass('jo_synchro_hoverActiveLine') });

            $div.on("click", () => {
                that.select();
            })
        }

        this.createLeftFileModel();
        this.createRightFileModel();

    }


    select() {
        let allDivs: JQuery<HTMLDivElement>[] = [this.$leftFileDiv, this.$buttonLeftDiv, this.$buttonRightDiv, this.$rightFileDiv];
        jQuery('#jo_synchro_fileListOuter').find('.jo_synchro_activeLine').removeClass('jo_synchro_activeLine');
        for (let $div of allDivs) $div.addClass('jo_synchro_activeLine');

        if (this.manager.lastShownSynchronizationElement != null) {
            this.manager.lastShownSynchronizationElement.editorState = this.manager.diffEditor.saveViewState()
        }

        this.manager.lastShownSynchronizationElement = this;

        this.setEditorModel();

        if (this.editorState != null) {
            this.manager.diffEditor.restoreViewState(this.editorState);
        }

        this.manager.diffEditor.updateOptions({
            originalEditable: this.leftSynchroFile?.originalText != null
        })

    }

    createRightFileModel() {
        if (this.rightSynchroFile != null) {
            this.rightSynchroFile.monacoModel = monaco.editor.createModel(this.rightSynchroFile.text, "myJava");
        }
    }

    setEditorModel() {
        if (this.manager.lastShownSynchronizationElement == this) {
            this.manager.diffEditor.setModel({
                original: this.leftSynchroFile == null ? this.getEmptyMonacoModel() : this.leftSynchroFile.monacoModel,
                modified: this.rightSynchroFile == null ? this.getEmptyMonacoModel() : this.rightSynchroFile.monacoModel
            });
        }
    }

    getEmptyMonacoModel(): monaco.editor.ITextModel {
        return monaco.editor.createModel("", "myJava")
    }

    pending: boolean = false;
    createLeftFileModel() {
        if (this.leftSynchroFile != null) {
            this.leftSynchroFile.monacoModel = monaco.editor.createModel(this.leftSynchroFile.text, "myJava");
            this.leftSynchroFile.monacoModel.onDidChangeContent((event) => {

                // throttle comparison to avoid editor-slowdown
                if (!this.pending) {
                    this.pending = true;
                    setTimeout(() => {
                        if (this.leftSynchroFile != null && this.leftSynchroFile?.state != "deleted") {

                            let newText: string = this.leftSynchroFile.monacoModel.getValue(monaco.editor.EndOfLinePreference.LF, false);
                            if (this.leftSynchroFile?.originalText != null &&
                                newText == this.leftSynchroFile.originalText) {
                                this.$leftFileDiv.removeClass("jo_dirty");
                                this.leftSynchroFile.state = "original";
                            } else {
                                this.$leftFileDiv.addClass("jo_dirty");
                                this.leftSynchroFile.state = "changed";
                                this.leftSynchroFile.identical_to_repository_version = false;
                            }
                            this.manager.onContentChanged("left");
                            this.leftSynchroFile.text = newText;

                            this.compareFilesAndAdaptGUI();
                        }
                        this.pending = false;
                    }, 700);
                }

            });
        }
    }

    onFileChanged(leftRight: LeftRight) {
        if (leftRight == "left") {
            this.createLeftFileModel();
        } else {
            this.createRightFileModel();
        }
        this.setEditorModel();
        this.compareFilesAndAdaptGUI();
        switch (leftRight) {
            case "left":
                if (this.leftSynchroFile != null && this.leftSynchroFile.state != "original") {
                    this.$leftFileDiv.addClass("jo_dirty");
                } else {
                    this.$leftFileDiv.removeClass("jo_dirty");
                }
                break;
            case "right":
                if (this.rightSynchroFile != null && this.rightSynchroFile.state != "original") {
                    this.$rightFileDiv.addClass("jo_dirty");
                } else {
                    this.$rightFileDiv.removeClass("jo_dirty");
                }
                break;
        }
        this.manager.onContentChanged(leftRight);
    }

    compareFilesAndAdaptGUI() {

        this.emptyGUI();
        let that = this;

        let leftCaption: string = "---";
        let leftVersionCaption: string = "";

        let needsMerge = false;

        if (this.leftSynchroFile != null) {
            leftCaption = this.leftSynchroFile.name;
            if (this.leftSynchroFile.repository_file_version == null) {
                leftVersionCaption = "(ohne Version)";
            } else {
                leftVersionCaption = "(V " + this.leftSynchroFile.repository_file_version;
                if (!(this.leftSynchroFile.identical_to_repository_version || this.leftSynchroFile?.text == this.rightSynchroFile?.text)) {
                    leftVersionCaption += '<span class="jo_synchro_withChanges"> mit Änderungen</span>';
                }
                if (this.rightSynchroFile != null && this.leftSynchroFile.synchroWorkspace.isWritable()) {
                    if (this.rightSynchroFile.repository_file_version > this.leftSynchroFile.repository_file_version) {
                        needsMerge = !this.leftSynchroFile.markedAsMerged;
                    }
                }

                leftVersionCaption += ")";
            }

            if (this.leftSynchroFile.state == "deleted") {
                leftCaption += " - GELÖSCHT";
                leftVersionCaption = "";
            }
        }

        let rightCaption = this.rightSynchroFile == null ? "---" : this.rightSynchroFile.name;
        let rightVersionCaption = this.rightSynchroFile == null ? "" : "(V " + this.rightSynchroFile.repository_file_version + ")";
        if (this.rightSynchroFile?.state == "deleted") {
            rightCaption += " - GELÖSCHT";
            rightVersionCaption = "";
        }

        let $spacer1 = makeDiv("", "jo_synchro_5px_spacer");
        let $spacer2 = makeDiv("", "jo_synchro_5px_spacer");

        this.$buttonRightDiv.append($spacer2);

        if (this.leftSynchroFile == null) {
            if (this.leftSynchroWorkspace.isWritable() && that.rightSynchroFile.state != "deleted") {
                this.$buttonLeftDiv.append(SynchronizationListElement.makeButton("create", "left", () => {
                    that.leftSynchroFile = {
                        name: that.rightSynchroFile.name,
                        idInsideRepository: that.rightSynchroFile.idInsideRepository,
                        repository_file_version: that.rightSynchroFile.repository_file_version,
                        identical_to_repository_version: true,
                        state: "new",
                        markedAsMerged: false,
                        text: this.rightSynchroFile.text,
                        synchroWorkspace: that.leftSynchroWorkspace,
                        idInsideWorkspace: null,
                        workspaceFile: null,
                        originalText: null,
                        monacoModel: null
                    };
                    that.leftSynchroWorkspace.files.push(that.leftSynchroFile);
                    that.onFileChanged("left");
                }, false));
            }
            if (that.rightSynchroWorkspace.isWritable() && that.rightSynchroFile.state != "deleted") {
                this.$buttonRightDiv.append(SynchronizationListElement.makeButton("delete", "right", () => {
                    that.rightSynchroFile.state = "deleted";
                    that.onFileChanged("right");
                }, false));
            }
        } else if (this.rightSynchroFile == null) {
            if (this.rightSynchroWorkspace.isWritable() && that.leftSynchroFile.state != "deleted") {
                this.$buttonRightDiv.append(SynchronizationListElement.makeButton("create", "right", () => {
                    that.rightSynchroFile = {
                        name: that.leftSynchroFile.name,
                        committedFromFile: that.leftSynchroWorkspace.isWritable() ? that.leftSynchroFile : null,
                        idInsideRepository: that.leftSynchroFile.idInsideRepository,
                        repository_file_version: that.leftSynchroFile.repository_file_version == null ? 1 : that.leftSynchroFile.repository_file_version,
                        identical_to_repository_version: that.leftSynchroFile.identical_to_repository_version,
                        state: "new",
                        markedAsMerged: false,
                        text: this.leftSynchroFile.text,
                        synchroWorkspace: that.rightSynchroWorkspace,
                        idInsideWorkspace: this.leftSynchroFile.idInsideWorkspace,
                        workspaceFile: null,
                        originalText: null,
                        monacoModel: null
                    }
                    that.rightSynchroWorkspace.files.push(that.rightSynchroFile);
                    that.leftSynchroFile.repository_file_version = that.rightSynchroFile.repository_file_version;
                    that.leftSynchroFile.identical_to_repository_version = true;
                    that.onFileChanged("right");
                }, false));
            }
            if (that.leftSynchroWorkspace.isWritable() && that.leftSynchroFile.state != "deleted") {
                this.$buttonLeftDiv.append(SynchronizationListElement.makeButton("delete", "left", () => {
                    that.leftSynchroFile.state = "deleted";
                    that.onFileChanged("left");
                },false));
            }
        } else {
            // Both SynchroFiles != null
            let isSynchronized: boolean = true;

            let isRename: boolean = this.leftSynchroFile.name != this.rightSynchroFile.name;
            let isUpdateOrCommit: boolean = this.leftSynchroFile.text != this.rightSynchroFile.text;
            let onlyRename = isRename && !isUpdateOrCommit;

            if (this.leftSynchroFile.repository_file_version == this.rightSynchroFile.repository_file_version) {
                if (isUpdateOrCommit || isRename) {
                    isSynchronized = false;
                }
            } else {
                isSynchronized = false;
            }

            if (isSynchronized) {
                this.$buttonLeftDiv.append(jQuery('<div>synchron - </div>'));
                this.$buttonRightDiv.append(jQuery('<div> - synchron</div>'));
            } else {
                if (this.leftSynchroWorkspace.isWritable()) {
                    this.$buttonLeftDiv.append(SynchronizationListElement.makeButton("update", "left", () => {
                        that.leftSynchroFile.text = that.rightSynchroFile.text;
                        that.leftSynchroFile.repository_file_version = that.rightSynchroFile.repository_file_version;
                        that.leftSynchroFile.identical_to_repository_version = true;
                        that.leftSynchroFile.name = that.rightSynchroFile.name;
                        that.leftSynchroFile.state = "changed";
                        that.onFileChanged("left");
                    }, onlyRename));
                }
                if (this.rightSynchroWorkspace.isWritable() && !needsMerge) {
                    this.$buttonRightDiv.append(SynchronizationListElement.makeButton("commit", "right", () => {
                        that.rightSynchroFile.text = that.leftSynchroFile.text;
                        that.rightSynchroFile.name = that.leftSynchroFile.name;
                        that.rightSynchroFile.repository_file_version++;
                        if (that.leftSynchroWorkspace.isWritable()) that.rightSynchroFile.committedFromFile = that.leftSynchroFile;
                        if (that.leftSynchroWorkspace.isWritable()) {
                            that.leftSynchroFile.repository_file_version = that.rightSynchroFile.repository_file_version;
                            this.leftSynchroFile.identical_to_repository_version = true;
                        }
                        that.rightSynchroFile.state = "changed";
                        that.onFileChanged("right");
                    }, onlyRename));
                }

            }

        }

        this.$buttonLeftDiv.append($spacer1);


        this.$leftFileDiv.append(jQuery(`<div class="jo_synchro_filename">${leftCaption}<span class="jo_synchro_fileVersion">${leftVersionCaption}</span></div>`));
        this.$rightFileDiv.append(jQuery(`<div class="jo_synchro_filename">${rightCaption}<span class="jo_synchro_fileVersion">${rightVersionCaption}</span></div>`));

        if (needsMerge) {
            this.$markAsMergedButtonDiv = jQuery(`<div class="jo_synchro_button jo_synchro_markAsMergedButton">Als "merged" markieren</div>`);
            this.$leftFileDiv.append(this.$markAsMergedButtonDiv);
            this.$markAsMergedButtonDiv.on("click", (e) => {
                e.stopPropagation();
                this.leftSynchroFile.markedAsMerged = true;
                this.compareFilesAndAdaptGUI();
            });
        }

        if (this.leftSynchroFile != null && this.leftSynchroFile.markedAsMerged) {
            this.showMergedDiv();
        }

        this.manager.updateCenterButtons();

    }

    showMergedDiv() {
        let $mergedDiv = jQuery(`<div class="jo_synchro_mergedDiv">merged</div><div class="img_errorfree"></div>`);
        this.$leftFileDiv.append($mergedDiv);
    }

    emptyGUI() {
        this.$leftFileDiv.empty();
        this.$rightFileDiv.empty();
        this.$buttonLeftDiv.empty();
        this.$buttonRightDiv.empty();
    }

    static makeButton(kind: ButtonKind, arrowDirection: LeftRight, callback: () => void, onlyRename: boolean): JQuery<HTMLDivElement> {

        let caption = "";
        let klass = "";

        switch (kind) {
            case "commit":
                caption = onlyRename ? "rename" : "commit"; klass = "jo_synchro_commitButton"; break;
            case "commitAll":
                caption = "commit all"; klass = "jo_synchro_commitButton"; break;
            case "update":
                caption = onlyRename ? "rename" : "update"; klass = "jo_synchro_updateButton"; break;
            case "updateAll":
                caption = "update all"; klass = "jo_synchro_updateButton"; break;
            case "create": caption = "create"; klass = "jo_synchro_createButton"; break;
            case "delete": caption = "delete"; klass = "jo_synchro_deleteButton"; break;
        }

        switch (arrowDirection) {
            case "left": klass += " jo_synchro_arrowLeft"; break;
            case "right": klass += " jo_synchro_arrowRight"; break;
        }

        let div: JQuery<HTMLDivElement> = jQuery(`<div class="jo_synchro_button ${klass}">${caption}</div>`);

        div.on("click", (e) => {
            e.stopPropagation();
            if (callback != null) callback();
        });

        div.on("mousedown", (e) => { e.stopPropagation() })

        return div;

    }


}