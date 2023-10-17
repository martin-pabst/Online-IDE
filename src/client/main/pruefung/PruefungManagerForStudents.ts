import { ajaxAsync } from "../../communication/AjaxHelper.js";
import { Pruefung, ReportPruefungStudentStateRequest, ReportPruefungStudentStateResponse, WorkspaceData } from "../../communication/Data.js";
import { PushClientManager } from "../../communication/pushclient/PushClientManager.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import jQuery from "jquery";

type MessagePruefungStart = { pruefung: Pruefung }

export class PruefungManagerForStudents {

    pruefung: Pruefung;

    timer: any;

    constructor(private main: Main){
        PushClientManager.subscribe("startPruefung", (message: MessagePruefungStart ) => {
            this.startPruefung(message.pruefung);
        })
        PushClientManager.subscribe("stopPruefung", (message: MessagePruefungStart ) => {
            this.stopPruefung(true);
        })
    }

    close(){
        if(this.pruefung != null){
            PushClientManager.unsubscribe("startPruefung");
            PushClientManager.unsubscribe("stopPruefung");
            if(this.timer != null) clearInterval(this.timer);
            this.main.networkManager.sendUpdates(() => {
                let projectExplorer = this.main.projectExplorer;
                projectExplorer.workspaceListPanel.show();
                projectExplorer.fetchAndRenderOwnWorkspaces();
            }, true, false, false)
            this.pruefung = null;
        }

    }

    startPruefung(pruefung: Pruefung) {
        
        if(this.pruefung != null) return;

        this.pruefung = pruefung;

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
            
            // this.pruefung = pruefung;

            jQuery('#pruefunglaeuft').css('display', 'block');
            if(this.timer != null){
                clearInterval(this.timer);
                this.timer = null;
            } 

            this.timer = setInterval(async () => {
                let request: ReportPruefungStudentStateRequest = {pruefungId: this.pruefung.id, clientState: "", running: true}
                let response: ReportPruefungStudentStateResponse = await ajaxAsync('/servlet/reportPruefungState',  request)
                if(response.pruefungState != "running"){
                    this.stopPruefung(true);
                }
            }, 3000)
            
        }, true, false, false);

    }
    
    async stopPruefung(renderWorkspaces: boolean){
        // await this.main.networkManager.sendUpdatesAsync();  // is done by fetchAndRenderOwnWorkspaces later on

        console.log("Stopping pruefung...");

        if(this.timer != null) clearInterval(this.timer);
        this.timer = null;

        if(this.pruefung == null){
            return;
        } 

        this.pruefung = null;
        
        this.main.projectExplorer.workspaceListPanel.show();
        
        if(renderWorkspaces){
            await this.main.projectExplorer.fetchAndRenderOwnWorkspaces();
        }

        jQuery('#pruefunglaeuft').css('display', 'none');
    }


    
}