import { ajaxAsync } from "../../communication/AjaxHelper.js";
import { Pruefung, ReportPruefungStudentStateRequest, ReportPruefungStudentStateResponse, WorkspaceData } from "../../communication/Data.js";
import { SSEManager } from "../../communication/SSEManager.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";

type MessagePruefungStart = { pruefung: Pruefung }

export class PruefungManagerForStudents {

    pruefung: Pruefung;

    timer: any;

    constructor(private main: Main){
        SSEManager.subscribe("startPruefung", (message: MessagePruefungStart ) => {
            this.startPruefung(message.pruefung);
        })
        SSEManager.subscribe("stopPruefung", (message: MessagePruefungStart ) => {
            this.stopPruefung();
        })
    }

    close(){
        SSEManager.unsubscribe("startPruefung");
        SSEManager.unsubscribe("stopPruefung");
        if(this.timer != null) clearInterval(this.timer);
        this.main.networkManager.sendUpdates(() => {
            let projectExplorer = this.main.projectExplorer;
            projectExplorer.workspaceListPanel.show();
            projectExplorer.fetchAndRenderOwnWorkspaces();
        })

    }
    
    startPruefung(pruefung: Pruefung) {
        
        if(this.pruefung != null) return;

        this.main.networkManager.sendUpdates(() => {
            
            let wss = this.main.workspaceList.filter(ws => ws.pruefung_id == pruefung.id);
            if(wss.length == 0) alert('Es fehlt der Prüfungsworkspace.');
            
            let pruefungWorkspace = wss[0];
            this.main.workspaceList = [pruefungWorkspace];
            this.main.currentWorkspace = pruefungWorkspace;
            let projectExplorer = this.main.projectExplorer;
            projectExplorer.workspaceListPanel.clear();
            projectExplorer.fileListPanel.clear();
            projectExplorer.workspaceListPanel.hide();

            projectExplorer.setWorkspaceActive(pruefungWorkspace);
            
            this.pruefung = pruefung;
            this.timer = setInterval(async () => {
                let request: ReportPruefungStudentStateRequest = {pruefungId: this.pruefung.id, clientState: "", running: true}
                let response: ReportPruefungStudentStateResponse = await ajaxAsync('/servlet/reportPruefungState',  request)
                if(response.pruefungState != "running"){
                    this.stopPruefung();
                }
            }, 5000)
            
        }, true);

    }
    
    stopPruefung(){
        this.main.projectExplorer.fetchAndRenderOwnWorkspaces();
        this.pruefung == null;
        if(this.timer != null) clearInterval(this.timer);
        this.timer = null;
    }


    
}