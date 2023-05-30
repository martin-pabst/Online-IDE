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


    constructor(private main: Main, public classData: ClassData[]) {
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

        this.studentPanel = new AccordionPanel(this.main.projectExplorer.accordion,
            "Schüler/innen", "3", null,
            "", "student", false, false, "student", false, []);

        this.studentPanel.selectCallback = (ae: UserData) => {
            if (this.classPanelMode == "classes") {
                this.main.projectExplorer.fetchAndRenderWorkspaces(ae);
            } else {
                let selectedPruefung = this.classPanel.getSelectedElement().externalElement;
                this.main.projectExplorer.fetchAndRenderWorkspaces(ae, this, selectedPruefung);
            }
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
        let projectExplorer = this.main.projectExplorer;

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

            that.main.networkManager.sendUpdates(() => {

                if (this.classPanelMode == "classes") {

                    let classData = <ClassData>ea;
                    if (classData != null) {
                        this.renderStudents(classData.students);
                    }

                } else {
                    this.onSelectPruefung(<Pruefung>ea);
                }
            });

        }

        toggleButtonTest.onChange(async (checked) => {
            $buttonNew.toggle(200);
            that.classPanelMode = checked ? "tests" : "classes";
            that.main.networkManager.sendUpdates(() => {
                if (checked) {
                    if (that.main.workspacesOwnerId == that.main.user.id) {
                        that.ownWorkspaces = that.main.workspaceList.slice();
                        that.currentOwnWorkspace = that.main.currentWorkspace;
                    }
                    projectExplorer.workspaceListPanel.hide();
                    projectExplorer.fileListPanel.clear();
                    projectExplorer.fileListPanel.setCaption("---");
                    if(this.pruefungen.length == 0){
                        this.studentPanel.hide();
                    }
                    this.renderPruefungen();
                    this.main.getMonacoEditor().setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));
                    if(this.pruefungen.length > 0){
                        this.classPanel.select(this.pruefungen[0], true, true);
                    }
                } else {
                    this.main.projectExplorer.workspaceListPanel.show();
                    this.studentPanel.show();
                    this.renderClasses(this.classData);
                    this.main.projectExplorer.onHomeButtonClicked();
                }
            })
        })

        $buttonNew.on('pointerdown', (e) => {
            e.stopPropagation();
        })

        $buttonNew.on('pointerup', async (e) => {
            e.stopPropagation();
            try {
                let newPruefung = await new PruefungDialog(this.main, this.classData).open();
                let w = new Workspace("Prüfungsvorlage", this.main, this.main.user.id);
                w.id = newPruefung.template_workspace_id;
                w.pruefung_id = newPruefung.id;
                this.main.workspaceList.push(w);
                this.ownWorkspaces = this.main.workspaceList;
                this.pruefungen.push(newPruefung);
                this.addPruefungToClassPanel(newPruefung);
                this.classPanel.select(newPruefung, true, true);
            } catch (error) {

            }

        })

    }

    onSelectPruefung(p: Pruefung) {

        let projectExplorer = this.main.projectExplorer;
        projectExplorer.workspaceListPanel.clear();
        projectExplorer.fileListPanel.clear();

        this.main.projectExplorer.setExplorerColor(null);
        this.main.projectExplorer.$homeAction.hide();

        if (p.state == "preparing" || p.state == "running") {
            this.studentPanel.clear();
            this.restoreOwnWorkspaces();
            let workspace = this.main.workspaceList.find(w => w.id == p.template_workspace_id);
            projectExplorer.setWorkspaceActive(workspace);
            this.studentPanel.hide();
        } else {
            this.studentPanel.show();
            projectExplorer.fileListPanel.setCaption("---");
            let klass = this.classData.find(c => c.id == p.klasse_id);
            if (klass != null) {
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

        for (let i = 0; i < userDataList.length; i++) {
            let ud = userDataList[i];
            let ae: AccordionElement = {
                name: ud.familienname + ", " + ud.rufname,
                sortName: ud.familienname + " " + ud.rufname,
                externalElement: ud,
                isFolder: false,
                path: [],
                readonly: false
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
                path: [],
                readonly: false
            }
            this.classPanel.addElement(ae, true);
        }

    }

    renderPruefungen() {
        this.classPanel.clear();

        this.pruefungen.forEach(p => this.addPruefungToClassPanel(p));
    }

    addPruefungToClassPanel(p: Pruefung) {
        let ae: AccordionElement = {
            name: p.name,
            externalElement: p,
            isFolder: false,
            path: [],
            iconClass: "test",
            readonly: false
        }
        this.classPanel.addElement(ae, true);
        this.updateClassNameAndState(p);

    }

    updateClassNameAndState(p: Pruefung) {
        let ae: AccordionElement = this.classPanel.findElement(p);
        if (ae != null) {
            let klasse = this.classData.find(c => c.id == p.klasse_id);
            if (klasse != null) {
                let $text = jQuery('<span></span>');
                $text.addClass('joe_pruefung_klasse');
                $text.text(`(${klasse.name})`);
                $text.css('margin', '0 4px');
                ae.$htmlFirstLine.find('.jo_textAfterName').empty().append($text);
            }
            let $buttonDiv = ae.$htmlFirstLine?.find('.jo_additionalButtonRepository');
            $buttonDiv.empty();
            if ($buttonDiv != null) {
                let $button = jQuery('<div class="img_gear-dark jo_button jo_active" title="Bearbeiten..." style="top: 2px; position: relative"></div>');
                $buttonDiv.append($button);
                $buttonDiv.on('pointerdown', async (e) => {
                    e.stopPropagation();
                    this.main.networkManager.sendUpdates(async () => {
                        try {
                            await new PruefungDialog(this.main, this.classData, p).open();
                            this.updateClassNameAndState(p);
                        } catch (ex) {
    
                        }
                    })
                })
            }
            this.classPanel.setElementClass(ae, "test-" + p.state, PruefungCaptions[p.state]);
        }
    }

    async fetchPruefungen() {

        let response = await ajaxAsync("/servlet/getPruefungenForLehrkraft", {})
        this.pruefungen = response.pruefungen;

    }


}