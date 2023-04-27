import { AccordionPanel, AccordionElement } from "./Accordion.js";
import { Main } from "../Main.js";
import { ClassData, UserData, CRUDUserRequest, CRUDClassRequest, GetWorkspacesResponse, GetWorkspacesRequest, Workspaces, Pruefung, PruefungCaptions } from "../../communication/Data.js";
import { ajax, ajaxAsync } from "../../communication/AjaxHelper.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Helper } from "./Helper.js";
import { GUIToggleButton } from "./controls/GUIToggleButton.js";
import jQuery from "jquery";
import { PruefungDialog } from "./PruefungDialog.js";

export class TeacherExplorer {

    studentPanel: AccordionPanel;
    classPanel: AccordionPanel;

    // save them here when displaying pupils workspaces:
    ownWorkspaces: Workspace[];
    currentOwnWorkspace: Workspace;

    pruefungen: Pruefung[] = [];

    classPanelMode: "classes" | "tests" = "classes";

    constructor(private main: Main, private classData: ClassData[]) {
        this.fetchPruefungen();
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
            "Schüler/innen", "3", null,
            "", "student", false, false, "student", false, []);

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

                        that.main.restoreWorkspaces(response.workspaces, false);
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

        let $buttonContainer = jQuery('<div class="joe_teacherExplorerClassButtons"></div>');
        let toggleButtonClass = new GUIToggleButton("Klassen", $buttonContainer, true);
        let toggleButtonTest = new GUIToggleButton("Prüfungen", $buttonContainer, false);
        toggleButtonClass.linkTo(toggleButtonTest);

        this.classPanel = new AccordionPanel(this.main.projectExplorer.accordion,
            $buttonContainer, "2", "", "", "class", false, false, "class", false, []);

        let $buttonNew = jQuery('<div class="jo_button jo_active img_add-test-dark" title="Neue Prüfung erstellen">');
            this.classPanel.$captionElement.find('.jo_actions').append($buttonNew);


        $buttonNew.attr("title", "Neue Prüfung erstellen").hide();

        this.classPanel.selectCallback = (ea) => {

            if(this.classPanelMode == "classes"){
                that.main.networkManager.sendUpdates(() => {
    
                    let classData = <ClassData>ea;
                    if (classData != null) {
                        this.renderStudents(classData.students);
                    }
    
                });
            } else {
                this.onSelectPruefung(<Pruefung>ea);
            }

        }

        toggleButtonTest.onChange(async (checked) => {
            $buttonNew.toggle(200);
            that.classPanelMode = checked ? "tests" : "classes";
            if(checked){
                if (that.main.workspacesOwnerId == that.main.user.id) {
                    that.ownWorkspaces = that.main.workspaceList.slice();
                    that.currentOwnWorkspace = that.main.currentWorkspace;
                }
                
                this.renderPruefungen();
            } else {
                this.main.projectExplorer.workspaceListPanel.show();
                this.studentPanel.show();    
                this.renderClasses(this.classData);
                this.main.projectExplorer.onHomeButtonClicked();
            }
        })

        $buttonNew.on('pointerdown', (e) => {
            e.stopPropagation();
        })

        $buttonNew.on('pointerup', async (e) => {
            e.stopPropagation();
            try {
                let newPruefung = await new PruefungDialog(this.main).open(this.classData);
                this.addPruefungToClassPanel(newPruefung);
            } catch(error) {

            }
            
        })

    }
    onSelectPruefung(p: Pruefung) {

        let projectExplorer = this.main.projectExplorer;
        projectExplorer.workspaceListPanel.clear();
        projectExplorer.fileListPanel.clear();

        this.main.projectExplorer.setExplorerColor(null);
        this.main.projectExplorer.$homeAction.hide();

        if(p.state == "preparing"){
            this.studentPanel.clear();    
            let workspace = this.main.workspaceList.find(w => w.id == p.template_workspace_id);
            projectExplorer.setWorkspaceActive(workspace);
            projectExplorer.workspaceListPanel.hide();

            this.studentPanel.hide();
        } else {
            projectExplorer.workspaceListPanel.show();
            this.studentPanel.show();
            let klass = this.classData.find(c => c.id = p.klasse_id);
            if(klass != null){
                this.renderStudents(klass.students);
            }
        }

    }

    renderStudents(userDataList: UserData[]) {
        this.studentPanel.clear();

        userDataList.sort((a, b) => {
            if (a.familienname > b.familienname) return -1;
            if (b.familienname > a.familienname) return 1;
            if (a.rufname > b.rufname) return -1;
            if (b.rufname > a.rufname) return 1;
            return 0;
        })

        for(let i = 0; i < userDataList.length; i++){
            let ud = userDataList[i];
            let ae: AccordionElement = {
                name: ud.familienname + ", " + ud.rufname,
                sortName: ud.familienname + " " + ud.rufname,
                externalElement: ud,
                isFolder: false,
                path: []
            }
            this.studentPanel.addElement(ae, true);
        }

    }

    renderClasses(classDataList: ClassData[]) {
        this.studentPanel.clear();
        this.classPanel.clear();
        
        classDataList.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (b.name > a.name) return -1;
            return 0;
        })

        for (let cd of classDataList) {
            let ae: AccordionElement = {
                name: cd.name,
                externalElement: cd,
                isFolder: false,
                path: []
            }
            this.classPanel.addElement(ae, true);
        }

    }

    renderPruefungen(){
        this.classPanel.clear();
        
        this.pruefungen.forEach(p => this.addPruefungToClassPanel(p));
    }

    addPruefungToClassPanel(p: Pruefung){
        let ae: AccordionElement = {
            name: p.name,
            externalElement: p,
            isFolder: false,
            path: [],
            iconClass: "test"
        }
        this.classPanel.addElement(ae, true);
        this.updateClassNameAndState(p);

    }

    updateClassNameAndState(p: Pruefung){
        let ae: AccordionElement = this.classPanel.findElement(p);
        if(ae != null){
            let klasse = this.classData.find(c => c.id = p.klasse_id);
            if(klasse != null){
                let $text = jQuery('<span></span>');
                $text.addClass('joe_pruefung_klasse');
                $text.text(`(${klasse.name}, ${PruefungCaptions[p.state]})`);
                $text.css('margin', '0 4px');
                ae.$htmlFirstLine.find('.jo_textAfterName').empty().append($text);            
            }    
            let $buttonDiv = ae.$htmlFirstLine?.find('.jo_additionalButtonRepository');
            if($buttonDiv != null){
                let $button = jQuery('<div class="img_edit-dark jo_button jo_active" title="Bearbeiten..."></div>');
                $buttonDiv.append($button);
                $buttonDiv.on('pointerdown', (e) => {
                    e.stopPropagation();
                    new PruefungDialog(this.main, p).open(this.classData);
                })
            }

        }
    }

    async fetchPruefungen(){

        let response = await ajaxAsync("/servlet/getPruefungenForLehrkraft", {})
        this.pruefungen = response.pruefungen;

    }


}