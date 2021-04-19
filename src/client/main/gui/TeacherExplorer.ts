import { AccordionPanel, AccordionElement } from "./Accordion.js";
import { Main } from "../Main.js";
import { ClassData, UserData, CRUDUserRequest, CRUDClassRequest, GetWorkspacesResponse, GetWorkspacesRequest, Workspaces } from "../../communication/Data.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Helper } from "./Helper.js";

export class TeacherExplorer {

    studentPanel: AccordionPanel;
    classPanel: AccordionPanel;

    // save them here when displaying pupils workspaces:
    ownWorkspaces: Workspace[];
    currentOwnWorkspace: Workspace;

    constructor(private main: Main, private classData: ClassData[]) {

    }

    removePanels() {
        this.classPanel.remove();
        this.studentPanel.remove();
    }

    initGUI() {

        this.initStudentPanel();

        this.initClassPanel();

        this.renderClasses(this.classData);

    }

    initStudentPanel() {

        let that = this;

        this.studentPanel = new AccordionPanel(this.main.projectExplorer.accordion,
            "Schüler/innen", "2", null,
            "", "student", false);

        this.studentPanel.selectCallback = (ae: UserData) => {

            that.main.networkManager.sendUpdates(() => {

                let request: GetWorkspacesRequest = {
                    ws_userId: ae.id,
                    userId: this.main.user.id,
                    language: 0
                }

                ajax("getWorkspaces", request, (response: GetWorkspacesResponse) => {
                    if (response.success == true) {

                        if (that.main.workspacesOwnerId == that.main.user.id) {
                            that.ownWorkspaces = that.main.workspaceList.slice();
                            that.currentOwnWorkspace = that.main.currentWorkspace;
                        }

                        that.main.restoreWorkspaces(response.workspaces);
                        that.main.workspacesOwnerId = ae.id;
                        that.main.projectExplorer.setExplorerColor("rgba(255, 0, 0, 0.2");
                        that.main.projectExplorer.$homeAction.show();
                        Helper.showHelper("homeButtonHelper", this.main);

                        that.main.bottomDiv.showHomeworkTab();
                        that.main.bottomDiv.homeworkManager.attachToWorkspaces(that.main.workspaceList);
                    }

                    this.main.networkManager.updateFrequencyInSeconds = this.main.networkManager.teacherUpdateFrequencyInSeconds;
                    this.main.networkManager.secondsTillNextUpdate = this.main.networkManager.teacherUpdateFrequencyInSeconds;

                });

            });
        }

    }

    restoreOwnWorkspaces() {
        let main = this.main;

        // main.monaco.setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));
        main.getMonacoEditor().updateOptions({ readOnly: true });

        main.workspaceList = this.ownWorkspaces;
        main.currentWorkspace = this.currentOwnWorkspace;
        main.workspacesOwnerId = main.user.id;
        main.projectExplorer.setExplorerColor(null);

        main.projectExplorer.renderWorkspaces(main.workspaceList);

        if (main.currentWorkspace == null && main.workspaceList.length > 0) {
            main.currentWorkspace = main.workspaceList[0];
        }

        if (main.currentWorkspace != null) {
            main.projectExplorer.setWorkspaceActive(main.currentWorkspace, true);
        }

        this.studentPanel.select(null, false);

    }

    initClassPanel() {
        let that = this;

        this.classPanel = new AccordionPanel(this.main.projectExplorer.accordion,
            "Klassen", "1", null, "", "class", false);

        this.classPanel.selectCallback = (ea) => {
            that.main.networkManager.sendUpdates(() => {

                let classData = <ClassData>ea;
                if (classData != null) {
                    this.renderStudents(classData.students);
                }

            });
        }


    }

    renderStudents(userDataList: UserData[]) {
        this.studentPanel.clear();

        userDataList.sort((a, b) => {
            if (a.familienname > b.familienname) return 1;
            if (b.familienname > a.familienname) return -1;
            if (a.rufname > b.rufname) return 1;
            if (b.rufname > a.rufname) return -1;
            return 0;
        })

        for (let ud of userDataList) {
            let ae: AccordionElement = {
                name: ud.rufname + " " + ud.familienname,
                sortName: ud.familienname + " " + ud.rufname,
                externalElement: ud
            }
            this.studentPanel.addElement(ae);
        }

    }

    renderClasses(classDataList: ClassData[]) {
        this.studentPanel.clear();

        classDataList.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (b.name > a.name) return -1;
            return 0;
        })

        for (let cd of classDataList) {
            let ae: AccordionElement = {
                name: cd.name,
                externalElement: cd
            }
            this.classPanel.addElement(ae);
        }

    }


}