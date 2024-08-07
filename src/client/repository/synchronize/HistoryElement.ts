import { RepositoryHistoryEntry, Repository, RepositoryHistoryFileEntry, RepositoryFileEntry } from "../../communication/Data.js";
import { SynchronizationManager } from "./RepositorySynchronizationManager.js";
import { makeDiv, openContextMenu } from "../../../tools/HtmlTools.js";
import { SynchroWorkspace } from "./SynchroWorkspace.js";
import jQuery from "jquery";

export class HistoryElement {

    $historyElementDiv: JQuery<HTMLDivElement>;

    static currentlyDragged: HistoryElement;

    constructor(private manager: SynchronizationManager, private repository: Repository, private repositoryHistoryEntry: RepositoryHistoryEntry, private historyEntryIndex: number) {

        this.$historyElementDiv = makeDiv(null, "jo_synchro_historyElement");
        this.$historyElementDiv.attr("draggable", "true");

        let that = this;
        this.$historyElementDiv.on('drag', () => {
            HistoryElement.currentlyDragged = that;
        });

        let line1 = makeDiv(null, "jo_synchro_historyElementLine1");
        line1.append(jQuery(`<div class="jo_synchro_he_version">V ${repositoryHistoryEntry.version}</div>`));
        line1.append(jQuery(`<div class="jo_synchro_he_name">${repositoryHistoryEntry.name}</div>`));
        this.$historyElementDiv.append(line1);

        let line2 = makeDiv(null, "jo_synchro_historyElementLine2");
        line2.append(jQuery(`<div class="jo_synchro_he_timestamp">${repositoryHistoryEntry.timestamp}</div>`))
        this.$historyElementDiv.append(line2);

        let line3 = makeDiv(null, "jo_synchro_historyElementLine3");
        line3.append(jQuery(`<div class="jo_synchro_he_comment">${repositoryHistoryEntry.comment}</div>`))
        this.$historyElementDiv.append(line3);

        manager.$historyScrollDiv.prepend(this.$historyElementDiv);

        this.$historyElementDiv.on("click contextmenu", (ev) => {
            ev.preventDefault();
            openContextMenu([
                {
                    caption: "Auf der linken Seite darstellen",
                    callback: () => {
                        let sw = new SynchroWorkspace(this.manager).copyFromHistoryElement(this);
                        this.manager.leftSynchroWorkspace = sw;
                        this.manager.setupSynchronizationListElements();
                    }
                },
                {
                    caption: "Auf der rechten Seite darstellen",
                    callback: () => {
                        let sw = new SynchroWorkspace(this.manager).copyFromHistoryElement(this);
                        this.manager.rightSynchroWorkspace = sw;
                        this.manager.setupSynchronizationListElements();
                    }
                },
            ],
                ev.pageX + 2, ev.pageY + 2)
        });

    }

    getRepositoryState(): Repository {

        let entries = this.repository.historyEntries;

        // get last intermediate state
        let startIndex = this.historyEntryIndex;

        while (startIndex > 0 && !(entries[startIndex].isIntermediateEntry)) {
            startIndex--;
        }

        let files: RepositoryFileEntry[] = [];

        for (let index = startIndex; index <= this.historyEntryIndex; index++) {

            let entry = entries[index];
            for (let fileEntry of entry.historyFiles) {

                if (entry.isIntermediateEntry) {
                    this.setIntermediateState(fileEntry, files);
                } else {
                    switch (fileEntry.type) {
                        case "create":
                            this.createFile(fileEntry, files);
                            break;
                        case "delete":
                            this.deleteFile(fileEntry, files);
                            break;
                        case "change":
                            this.changeFile(fileEntry, files);
                            break;
                        case "intermediate":
                            this.setIntermediateState(fileEntry, files);
                            break;
                    }
                }

            }

        }

        let repository: Repository = Object.assign({}, this.repository);
        repository.fileEntries = files;
        repository.version = this.repositoryHistoryEntry.version;

        return repository;

    }

    setIntermediateState(fileEntry: RepositoryHistoryFileEntry, files: RepositoryFileEntry[]) {
        let file: RepositoryFileEntry = files.find(file => file.id == fileEntry.id);
        if (file != null) {
            file.text = fileEntry.content;
            file.version = fileEntry.version;
        }
    }

    changeFile(fileEntry: RepositoryHistoryFileEntry, files: RepositoryFileEntry[]) {
        let file: RepositoryFileEntry = files.find(file => file.id == fileEntry.id);
        if (file != null) {
            if (fileEntry.content != null) {
                //@ts-ignore
                let patch: patch_obj[] = JSON.parse(fileEntry.content);
                let oldText = file.text;
                //@ts-ignore
                let dmp: diff_match_patch = new diff_match_patch();
                let newText: [string, boolean[]] = dmp.patch_apply(patch, oldText);
                file.text = newText[0];
                file.version = fileEntry.version;
            }
        }
    }

    deleteFile(fileEntry: RepositoryHistoryFileEntry, files: RepositoryFileEntry[]) {
        let index: number = files.findIndex(file => file.id == fileEntry.id);
        if (index != null) {
            files.splice(index, 1);
        }
    }

    createFile(fileEntry: RepositoryHistoryFileEntry, files: RepositoryFileEntry[]) {
        let file: RepositoryFileEntry = {
            id: fileEntry.id,
            text: fileEntry.content,
            filename: fileEntry.filename,
            version: fileEntry.version
        }
        files.push(file);
    }




}