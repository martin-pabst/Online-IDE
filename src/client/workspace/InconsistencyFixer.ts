import { NetworkManager } from "../communication/NetworkManager.js";
import { MainBase } from "../main/MainBase.js";
import { Workspace } from "./Workspace.js";

export class InconsistencyFixer {
    start(workspaceList: Workspace[], networkManager: NetworkManager, main: MainBase) {
        let updateNeeded: boolean = false;

        // is there a folder which contains files?
        for (let ws of workspaceList) {
            if (ws.isFolder && ws.moduleStore.getModules(false).length > 0) {

                console.log("Folder " + ws.path + "/" + ws.name + " contains files. -> Make new folder and transforming existing one to workspace.")

                // create new Folder
                let newFolder: Workspace = new Workspace(ws.name, main, ws.owner_id);
                newFolder.isFolder = true;
                newFolder.path = ws.path;
                workspaceList.push(newFolder);

                networkManager.sendCreateWorkspace(newFolder, newFolder.owner_id, (error: string) => {
                    if(error == null || error == ""){
                        console.log("Successfully created new Folder.");
                    } else {
                        console.log("Error creating folder: " + error);
                    }
                });

                // transform old folder into real workspace
                ws.isFolder = false;
                ws.name += " (ws)";
                ws.saved = false;
                updateNeeded = true;

            }
        }

        // Are there several folders with identical path and name?
        let folderList = workspaceList.filter(ws => ws.isFolder);

        for (let ws1 of folderList) {
            let identicalFolders: Workspace[] = [];
            for (let ws2 of folderList) {
                if (ws2 != ws1 && ws2.path == ws1.path && ws2.name == ws1.name) {
                    identicalFolders.push(ws2);
                }
            }
            if (identicalFolders.length > 0) {
                console.log("" + (identicalFolders.length + 1) + " folders with name " + ws1.path + "/" + ws1.name + "=> renaming them with suffixes (1), (2), ...");
                for (let i = 0; i < identicalFolders.length; i++) {
                    identicalFolders[i].name += " (" + (i + 1) + ")";
                    identicalFolders[i].saved = false;
                }
                updateNeeded = true;
            }
        }

        // Is there a workspace which belongs to a folder that doesn't exist?
        let folderPathAndNames: string[] = [];
        for (let folder of folderList) {
            let fnap = folder.path;
            if (fnap != "" && !fnap.endsWith("/")) fnap += "/";
            fnap += folder.name;
            folderPathAndNames.push(fnap);
        }

        for (let ws of workspaceList) {
            if (!ws.isFolder && ws.pruefung_id == null && ws.path != "" && ws.path != null && folderPathAndNames.indexOf(ws.path) < 0) {
                console.log("Found workspace (" + ws.path + "/" + ws.name + ") with path not corresponding to any folder => Set path = ''.");
                ws.path = "";
                ws.saved = false;
                updateNeeded = true;
            }
        }


        if(updateNeeded){ 
            networkManager.sendUpdates(()=> {}, true);
        }

    }
}