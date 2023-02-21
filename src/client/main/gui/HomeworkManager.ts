import jQuery from 'jquery';
import { MainBase } from "../MainBase.js";
import { makeDiv } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { File, Module } from "../../compiler/parser/Module.js";
import { stringToDate, dateToStringWithoutTime } from "../../tools/StringTools.js";
import { Main } from "../Main.js";

type ModuleWithWorkspace = {
    module: Module,
    workspace: Workspace
}

type DayWithModules = {
    date: Date;
    day: string;
    modules: ModuleWithWorkspace[];
}

export class HomeworkManager {

    $homeworkTab: JQuery<HTMLElement>;
    $homeworkTabLeft: JQuery<HTMLElement>;
    $homeworkTabRight: JQuery<HTMLElement>;

    $showRevisionButton: JQuery<HTMLElement>;
    showRevisionActive: boolean = false;

    diffEditor: monaco.editor.IStandaloneDiffEditor;

    constructor(private main: Main, public $bottomDiv: JQuery<HTMLElement>) {
        this.$homeworkTab = $bottomDiv.find('.jo_tabs>.jo_homeworkTab');
    }

    initGUI() {
        let that = this;
        this.$homeworkTab.append(this.$homeworkTabLeft = makeDiv("", "jo_homeworkTabLeft jo_scrollable"));
        this.$homeworkTab.append(this.$homeworkTabRight = makeDiv("", "jo_homeworkTabRight jo_scrollable"));
        this.$showRevisionButton = makeDiv("", "jo_button jo_active jo_homeworkRevisionButton", "")
        jQuery('#view-mode').prepend(this.$showRevisionButton);
        this.$showRevisionButton.on("click", () => {
            if (this.showRevisionActive) {
                this.hideRevision();
            } else {
                this.showRevision(that.main.getCurrentlyEditedModule());
            }
        });
        this.$showRevisionButton.hide();
        jQuery('#diffEditor').hide();
    }

    showHomeWorkRevisionButton() {
        this.$showRevisionButton.text(this.showRevisionActive ? "Normalansicht" : "Korrekturen zeigen");
        this.$showRevisionButton.show();
    }

    hideHomeworkRevisionButton() {
        this.$showRevisionButton.hide();
    }

    showRevision(module: Module) {

        module.file.text = module.getProgramTextFromMonacoModel();
        let file = module.file;

        jQuery('#editor').hide();
        jQuery('#diffEditor').show();

        var originalModel = monaco.editor.createModel(file.text_before_revision, "myJava");
        var modifiedModel = monaco.editor.createModel(file.text, "myJava");

        this.diffEditor = monaco.editor.createDiffEditor(document.getElementById("diffEditor"), {
            // You can optionally disable the resizing
            enableSplitViewResizing: true,
            originalEditable: false,
            readOnly: true,
            // Render the diff inline
            renderSideBySide: true
        });

        this.diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
        });

        this.showRevisionActive = true;
        this.showHomeWorkRevisionButton();
    }

    hideRevision() {
        if (this.showRevisionActive) {

            jQuery('#diffEditor').hide();
            this.diffEditor.dispose();
            this.diffEditor = null;
            jQuery('#editor').show();

            this.showRevisionActive = false;
            this.showHomeWorkRevisionButton();
        }
    }


    attachToWorkspaces(workspaces: Workspace[]) {

        let daysWithModules: DayWithModules[] = [];
        let map: { [day: string]: DayWithModules } = {};

        workspaces.forEach(ws => {
            ws.moduleStore.getModules(false).forEach(module => {

                let dateString = module.file.submitted_date;
                if (dateString != null) {

                    let date: Date = stringToDate(dateString);
                    let dateWithoutTime = dateToStringWithoutTime(date);
                    let dwm: DayWithModules = map[dateWithoutTime];
                    if (dwm == null) {
                        dwm = {
                            date: date,
                            day: dateWithoutTime,
                            modules: []
                        };
                        map[dateWithoutTime] = dwm;
                        daysWithModules.push(dwm);
                    }
                    dwm.modules.push({module: module, workspace: ws});

                }

            });

        });

        this.$homeworkTabLeft.empty();
        this.$homeworkTabRight.empty();

        let that = this;

        this.$homeworkTabLeft.append(makeDiv("", "jo_homeworkHeading", "Abgabetage:"));


        daysWithModules.sort((a, b) => {
            if (a.date.getFullYear() != b.date.getFullYear()) return -Math.sign(a.date.getFullYear() - b.date.getFullYear());
            if (a.date.getMonth() != b.date.getMonth()) return -Math.sign(a.date.getMonth() - b.date.getMonth());
            if (a.date.getDate() != b.date.getDate()) return -Math.sign(a.date.getDate() - b.date.getDate());
            return 0;
        });

        let first: boolean = true;

        daysWithModules.forEach(dwm => {

            dwm.modules.sort((m1, m2) => m1.module.file.name.localeCompare(m2.module.file.name));

            let $div = makeDiv("", "jo_homeworkDate", dwm.day);
            this.$homeworkTabLeft.append($div);

            $div.on("click", (e) => {
                this.$homeworkTabLeft.find('.jo_homeworkDate').removeClass('jo_active');
                $div.addClass('jo_active');
                that.select(dwm);
            });

            if (first) {
                first = false;
                $div.addClass('jo_active');
                that.select(dwm);
            }

        });

    }

    select(dwm: DayWithModules) {
        this.$homeworkTabRight.empty();
        this.$homeworkTabRight.append(makeDiv("", "jo_homeworkHeading", "Abgegebene Dateien:"));
        let that = this;
        dwm.modules.forEach(moduleWithWorkspace => {
            let $div = jQuery(`<div class="jo_homeworkEntry">Workspace <span class="jo_homework-workspace">
                    ${moduleWithWorkspace.workspace.name}</span>, Datei <span class="jo_homework-file">
                    ${moduleWithWorkspace.module.file.name}</span> (Abgabe: ${moduleWithWorkspace.module.file.submitted_date} )</div>`);
            that.$homeworkTabRight.append($div);
            $div.on("click", () => {
                    that.main.projectExplorer.setWorkspaceActive(moduleWithWorkspace.workspace, true);
                    that.main.projectExplorer.setModuleActive(moduleWithWorkspace.module);
                    that.main.projectExplorer.fileListPanel.select(moduleWithWorkspace.module, false);
            });
        })
        
    }



}