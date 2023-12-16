import { AccordionPanel, AccordionElement } from "./Accordion.js";
import { Main } from "../Main.js";
import { ClassData, UserData, Pruefung, PruefungCaptions } from "../../communication/Data.js";
import { ajaxAsync, csrfToken } from "../../communication/AjaxHelper.js";
import { Workspace } from "../../workspace/Workspace.js";
import { GUIToggleButton } from "../../tools/components/GUIToggleButton.js";
import jQuery from "jquery";
import { PushClientManager } from "../../communication/pushclient/PushClientManager.js";

export class TeacherExplorer {

    studentPanel: AccordionPanel;
    classPanel: AccordionPanel;

    // save them here when displaying pupils workspaces:
    ownWorkspaces: Workspace[];
    currentOwnWorkspace: Workspace;

    pruefungen: Pruefung[] = [];

    classPanelMode: "classes" | "tests" = "classes";

    currentPruefung: Pruefung = null;


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

        PushClientManager.subscribe("onPruefungChanged", async () => {
            if (this.classPanelMode == "tests") {
                await this.fetchPruefungen()
                this.renderPruefungen();
            }
        });

    }

    initStudentPanel() {

        this.studentPanel = new AccordionPanel(this.main.projectExplorer.accordion,
            "Schüler/innen", "3", null,
            "", "student", false, false, "student", false, []);

        this.studentPanel.selectCallback = (ae: UserData) => {
            if (this.classPanelMode == "classes") {
                this.main.projectExplorer.fetchAndRenderWorkspaces(ae, this);
            } else {
                this.main.projectExplorer.fetchAndRenderWorkspaces(ae, this, this.currentPruefung);
            }
        }

    }

    restoreOwnWorkspaces() {
        let main = this.main;

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

        let $buttonPruefungAdministration = jQuery(`<a href='administration_mc.html?csrfToken=${csrfToken}' target='_blank'><div class="jo_button jo_active img_gear-dark" style="margin-right: 6px" title="Prüfungen verwalten..."></d>`);
        this.classPanel.$captionElement.find('.jo_actions').append($buttonPruefungAdministration);


        $buttonPruefungAdministration.attr("title", "Neue Prüfung erstellen").hide();

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
            $buttonPruefungAdministration.toggle(200);
            that.classPanelMode = checked ? "tests" : "classes";
            that.main.networkManager.sendUpdates(() => {
                if (checked) {
                    if (that.main.workspacesOwnerId == that.main.user.id) {
                        that.ownWorkspaces = that.main.workspaceList.slice();
                        that.currentOwnWorkspace = that.main.currentWorkspace;
                    }
                    this.renderPruefungen();
                    let firstPruefung = this.pruefungen.find(p => ["preparing", "running"].indexOf(p.state) < 0);
                    if (firstPruefung != null) {
                        this.classPanel.select(firstPruefung, true, true);
                    }
                } else {
                    this.renderClasses(this.classData);
                    this.main.projectExplorer.onHomeButtonClicked();
                }
            })
        })

        $buttonPruefungAdministration.on('pointerdown', (e) => {
            e.stopPropagation();
        })

    }

    onSelectPruefung(p: Pruefung) {

        this.currentPruefung = p;
        let projectExplorer = this.main.projectExplorer;

        if (p.state == "preparing" || p.state == "running") {
            alert('Die Prüfung befindet sich im Zustand "' + PruefungCaptions[p.state] + ", daher kann noch keine Schülerliste zur Korrektur angezeigt werden." +
                "\nKlicken Sie auf das Zahnrad rechts oberhalb der Prüfungsliste, um zur Prüfungsverwaltung zu gelangen. Dort können Sie den Zustand der Prüfung ändern.");

            projectExplorer.fileListPanel.clear();
            projectExplorer.fileListPanel.setCaption("---");
            projectExplorer.workspaceListPanel.clear();
            this.studentPanel.clear();
            this.main.getMonacoEditor().setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));


        } else {
            let klass = this.classData.find(c => c.id == p.klasse_id);
            if (klass != null) {
                this.renderStudents(klass.students);
                if (klass.students.length > 0) {
                    this.studentPanel.select(klass.students[0], true, true);
                }
            }
        }

    }

    renderStudents(userDataList: UserData[]) {
        this.studentPanel.clear();

        this.studentPanel.setCaption(userDataList.length + " Schüler/innen");

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
                readonly: false,
                isPruefungFolder: false
            }
            this.studentPanel.addElement(ae, true);
        }

    }

    renderClasses(classDataList: ClassData[]) {
        this.studentPanel.clear();
        this.studentPanel.setCaption("Schüler/innen");
        this.classPanel.clear();

        classDataList.sort((a, b) => {
            return a.name.localeCompare(b.name);
        })

        for (let cd of classDataList) {
            let ae: AccordionElement = {
                name: cd.name,
                externalElement: cd,
                isFolder: false,
                path: [],
                readonly: false,
                isPruefungFolder: false
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
            readonly: false,
            isPruefungFolder: false
        }
        this.classPanel.addElement(ae, true);
        this.updateClassNameAndState(p);

    }

    updateClassNameAndState(p: Pruefung) {
        let ae: AccordionElement = this.classPanel.findElement(p);
        if (ae != null) {
            let klasse = this.classData.find(c => c.id == p.klasse_id);
            if (klasse != null) {
                let $text = ae.$htmlFirstLine.find(".joe_pruefung_klasse");
                if ($text.length == 0) {
                    $text = jQuery('<span class="joe_pruefung_klasse"></span>');
                    $text.css('margin', '0 4px');
                    ae.$htmlFirstLine.find(".jo_filename").append($text);
                }
                $text.text(`(${klasse.name})`);
            }

            this.classPanel.setElementClass(ae, "test-" + p.state, PruefungCaptions[p.state]);
        }
    }

    async fetchPruefungen() {

        let response = await ajaxAsync("/servlet/getPruefungenForLehrkraft", {})
        this.pruefungen = response.pruefungen;

    }


}