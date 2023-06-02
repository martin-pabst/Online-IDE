import { Repository } from "../../communication/Data.js";
import { Main } from "../../main/Main.js";
import { Workspace } from "../../workspace/Workspace.js";
import { HistoryElement } from "./HistoryElement.js";
import { RepositoryHistoryEntry, RepositoryFileEntry, CommitFilesResponse, CommitFilesRequest } from "../../communication/Data.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { File, Module } from "../../compiler/parser/Module.js";
import { SynchronizationManager } from "./RepositorySynchronizationManager.js";


export type SynchroFileState = "original" | "changed" | "new" | "deleted";

export type SynchroFile = {
    idInsideRepository: number,
    idInsideWorkspace?: number,
    workspaceFile: File,
    committedFromFile?: SynchroFile,
    name: string,
    repository_file_version: number,
    identical_to_repository_version: boolean,
    text: string,
    synchroWorkspace: SynchroWorkspace,
    
    state: SynchroFileState,
    markedAsMerged: boolean,

    originalText?: string,
    monacoModel?: monaco.editor.ITextModel,
}


export class SynchroWorkspace {

    files: SynchroFile[] = [];
    copiedFromWorkspace: Workspace;
    isCurrentRepositoryVersion: boolean = false;

    name: string;

    constructor(private manager: SynchronizationManager) {

    }

    hasChanges(): boolean {
        for(let file of this.files){
            if(file.state != "original") return true;
        }
        return false;
    }


    isWritable(): boolean {
        return this.copiedFromWorkspace != null || (this.isCurrentRepositoryVersion && this.manager.repositoryIsWritable );
    }

    copyFromWorkspace(workspace: Workspace):SynchroWorkspace {

        this.files = [];
        workspace.moduleStore.getModules(false).forEach(module => {
            let file = module.file;

            if (module.model != null) {
                module.file.text = module.getProgramTextFromMonacoModel();
            }

            this.files.push({
                name: file.name,
                repository_file_version: file.repository_file_version,
                identical_to_repository_version: file.identical_to_repository_version,
                idInsideRepository: file.is_copy_of_id,
                idInsideWorkspace: file.id,
                workspaceFile: file,
                text: file.text.replace(/\r\n/g, "\n"),
                synchroWorkspace: this,
                
                state: "original",
                markedAsMerged: false,

                originalText: file.text,
                monacoModel: null
            })
        });

        this.name = "Workspace: " + workspace.name;
        this.copiedFromWorkspace = workspace;

        return this;
    }

    copyFromRepository(repository: Repository, isCurrentRepositoryVersion: boolean): SynchroWorkspace {
        this.isCurrentRepositoryVersion = isCurrentRepositoryVersion;
        this.files = [];
        repository.fileEntries.forEach((fileEntry) => {
            this.files.push({
                name: fileEntry.filename,
                idInsideRepository: fileEntry.id,
                idInsideWorkspace: null,
                workspaceFile: null,
                repository_file_version: fileEntry.version,
                identical_to_repository_version: true,
                text: fileEntry.text == null ? null : fileEntry.text.replace(/\r\n/g, "\n"),
                synchroWorkspace: this,
                
                state: "original",
                markedAsMerged: false,

                monacoModel: null
            })
        })

        this.name = "Repository: " + repository.name + " (V " + repository.version + ")";

        return this;
    }

    copyFromHistoryElement(historyElement: HistoryElement): SynchroWorkspace {
        let repo = historyElement.getRepositoryState();
        this.copyFromRepository(repo, false);
        this.name = "History-Version " + repo.version;
        return this;
    }

    commit(workspace: Workspace, oldRepository: Repository, comment: string, main: Main,
        callback: (repository: Repository, errormessage: string) => void) {

        let oldIdToFileMap: { [id: number]: RepositoryFileEntry } = {};
        let newIdToFileMap: { [id: number]: SynchroFile } = {};

        let newlyVersionedFileIds: number[] = [];

        oldRepository.fileEntries.forEach(file => oldIdToFileMap[file.id] = file);
        this.files.forEach(file => {
            if (file.idInsideRepository != null) {
                newIdToFileMap[file.idInsideRepository] = file;
            }
        });

        let repositoryHistoryEntry: RepositoryHistoryEntry = {
            comment: comment,
            name: main.user.rufname + " " + main.user.familienname,
            username: main.user.username,
            isIntermediateEntry: false,
            timestamp: new Date().toUTCString(),
            userId: main.user.id,
            version: oldRepository.version + 1,
            historyFiles: []
        }

        for (let file of this.files) {
            if(file.state == "deleted") continue;

            let oldFile = oldIdToFileMap[file.idInsideRepository];
            if (oldFile == null) {

                // if file.committedFromFile.
                if (file.idInsideRepository == null) {
                    newlyVersionedFileIds.push(file.committedFromFile.idInsideWorkspace);
                    file.committedFromFile.idInsideRepository = file.committedFromFile.idInsideWorkspace;
                    file.committedFromFile.repository_file_version = 1;
                    file.idInsideRepository = file.committedFromFile.idInsideWorkspace;
                    file.committedFromFile.idInsideRepository = file.committedFromFile.idInsideWorkspace;
                }

                repositoryHistoryEntry.historyFiles.push({
                    id: file.idInsideRepository,
                    type: "create",
                    version: 1,
                    content: file.text,
                    filename: file.name
                });
            } else if (oldFile.text != file.text) {
                oldFile.version++;
                let patch: string = this.getPatch(oldFile.text, file.text);
                if (patch == null) {
                    repositoryHistoryEntry.historyFiles.push({
                        id: oldFile.id,
                        type: "intermediate",
                        version: oldFile.version,
                        content: file.text,
                        filename: file.name
                    });
                } else {
                    repositoryHistoryEntry.historyFiles.push({
                        id: oldFile.id,
                        type: "change",
                        version: oldFile.version,
                        content: patch,
                        filename: (oldFile.filename == file.name) ? undefined : file.name
                    });
                }

                let cff = file.committedFromFile;
                if(cff != null){
                    cff.repository_file_version = oldFile.version;
                    cff.workspaceFile.repository_file_version = oldFile.version;
                    cff.workspaceFile.saved = false;                    
                }

            } else if (oldFile.filename != file.name) {
                repositoryHistoryEntry.historyFiles.push({
                    id: oldFile.id,
                    type: "intermediate",
                    version: oldFile.version,
                    filename: file.name
                });
            }
        }

        for (let oldFile of oldRepository.fileEntries) {
            if (newIdToFileMap[oldFile.id] == null || newIdToFileMap[oldFile.id].state == "deleted") {
                repositoryHistoryEntry.historyFiles.push({
                    id: oldFile.id,
                    type: "delete",
                    version: oldFile.version
                });

            }
        }

        let newFileEntries: RepositoryFileEntry[] = this.files.filter(file => file.state != "deleted").map((synchroFile) => {
            return {
                filename: synchroFile.name,
                id: synchroFile.idInsideRepository,
                text: synchroFile.text,
                version: synchroFile.repository_file_version
            }
        })


        let commitFilesRequest: CommitFilesRequest = {
            files: newFileEntries,
            repositoryVersionBeforeCommit: oldRepository.version,
            repository_id: oldRepository.id,
            workspace_id: workspace.id,
            repositoryHistoryEntry: repositoryHistoryEntry,
            newlyVersionedFileIds: newlyVersionedFileIds
        }

        let that = this;
        ajax("commitFiles", commitFilesRequest, (cfr: CommitFilesResponse) => {
            workspace.moduleStore.getModules(false).map(m => m.file).forEach((file) => {
                if (newlyVersionedFileIds.indexOf(file.id) >= 0) {
                    file.is_copy_of_id = file.id;
                    file.repository_file_version = 1;
                    file.identical_to_repository_version = true;
                    file.saved = false;
                }
            });
            that.manager.currentUserSynchroWorkspace.files.forEach(synchroFile => {
                let workspaceFile = synchroFile.workspaceFile;
                if(workspaceFile != null){
                    if(synchroFile.text == workspaceFile.text && 
                        (synchroFile.repository_file_version != workspaceFile.repository_file_version  || synchroFile.identical_to_repository_version != workspaceFile.identical_to_repository_version)){
                            workspaceFile.identical_to_repository_version = synchroFile.identical_to_repository_version;
                            workspaceFile.repository_file_version = synchroFile.repository_file_version;
                            workspaceFile.saved = false;
                    }
                }
                if(workspaceFile.is_copy_of_id != null){
                    synchroFile.idInsideRepository = workspaceFile.is_copy_of_id;
                }
            });
            that.manager.main.networkManager.sendUpdates(() => {
                callback(cfr.repository, null);
            }, true);
        }, (error: string) => { callback( null, error) })

    }

    getPatch(contentOld: string, contentNew: string): string {
        //@ts-ignore
        let dmp: diff_match_patch = new diff_match_patch();
        //@ts-ignore
        let patchObject: patch_obj[] = dmp.patch_make(contentOld, contentNew);

        let patch: string = JSON.stringify(patchObject);

        // Test patch and only return it if it is valid!
        let deSerializedPatchObject = JSON.parse(patch);

        let result: [string, boolean[]] = dmp.patch_apply(deSerializedPatchObject, contentOld);

        if (result == null || result[0] == null) return null;

        if (result[0] == contentNew) {
            return patch;
        } else {
            return null;
        }

    }

    writeChangesToWorkspace() {
        let workspace = this.copiedFromWorkspace;
        let oldIdToModuleMap: { [id: number]: Module } = {};
        let newIdToFileMap: { [id: number]: SynchroFile } = {};

        workspace.moduleStore.getModules(false).forEach(m => {
            if (m.file.is_copy_of_id != null) oldIdToModuleMap[m.file.is_copy_of_id] = m;
        });

        this.files.forEach(file => {
            if (file.idInsideWorkspace != null) newIdToFileMap[file.idInsideWorkspace] = file;
        });

        let main = this.manager.main;
        for (let module of workspace.moduleStore.getModules(false)) {

            let synchroFile = newIdToFileMap[module.file.id];
            if (synchroFile != null && synchroFile.state != 'deleted') {
                module.file.text = synchroFile.monacoModel.getValue(monaco.editor.EndOfLinePreference.LF, false);
                synchroFile.text = module.file.text;
                module.file.is_copy_of_id = synchroFile.idInsideRepository;
                module.file.repository_file_version = synchroFile.repository_file_version;
                module.model.setValue(synchroFile.text);
                module.file.identical_to_repository_version = synchroFile.identical_to_repository_version;
                module.file.saved = false;
                module.file.dirty = true;
                module.file.name = synchroFile.name;
                if(module.file.panelElement != null){
                    module.file.panelElement.$htmlFirstLine.find('.jo_filename');
                }
            } else {

                main.networkManager.sendDeleteWorkspaceOrFile("file", module.file.id, (error: string) => {
                    if (error == null) {
                    } else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });

                this.files.splice(this.files.indexOf(synchroFile), 1);
                workspace.moduleStore.removeModule(module);
                main.projectExplorer.fileListPanel.removeElement(module);
                if (main.currentWorkspace == workspace && main.projectExplorer.getCurrentlyEditedModule() == module) {
                    main.projectExplorer.setModuleActive(null);
                }
                
            }

        }

        for (let synchroFile of this.files) {
            if (synchroFile.idInsideRepository != null && oldIdToModuleMap[synchroFile.idInsideRepository] == null) {

                let f: File = {
                    name: synchroFile.name,
                    dirty: true,
                    saved: true,
                    text: synchroFile.text,
                    text_before_revision: null,
                    submitted_date: null,
                    student_edited_after_revision: false,
                    version: 1,
                    is_copy_of_id: synchroFile.idInsideRepository,
                    repository_file_version: synchroFile.repository_file_version,
                    identical_to_repository_version: synchroFile.identical_to_repository_version,
                };
                let m = new Module(f, main);
                workspace.moduleStore.putModule(m);
                main.networkManager.sendCreateFile(m, workspace, main.user.id,
                    (error: string) => {
                        if (error == null) {
                        } else {
                            alert('Der Server ist nicht erreichbar!');

                        }
                    });

            }
        }

        main.networkManager.sendUpdates(null, true);

        if (main.currentWorkspace == workspace) {
            let cem = main.getCurrentlyEditedModule();
            main.projectExplorer.setWorkspaceActive(workspace, true);

            // if module hadn't been deleted while synchronizing:
            if(workspace.moduleStore.getModules(false).indexOf(cem) >= 0){
                main.projectExplorer.setModuleActive(cem);
                main.projectExplorer.fileListPanel.select(cem, false);
            }

        }

        workspace.moduleStore.dirty = true;

    }

}