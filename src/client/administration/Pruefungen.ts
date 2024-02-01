import { ajax, ajaxAsync } from "../communication/AjaxHelper";
import { BaseResponse, CRUDPruefungRequest, CRUDPruefungResponse, GetPruefungStudentStatesRequest, GetPruefungStudentStatesResponse, GetPruefungenForLehrkraftResponse, KlassData, Pruefung, PruefungCaptions, PruefungState, StudentPruefungStateInfo, UpdatePruefungSchuelerDataRequest, UserData, WorkspaceData, WorkspaceShortData } from "../communication/Data";
import { PushClientManager } from "../communication/pushclient/PushClientManager";
import { w2event, w2grid, w2ui, w2utils } from "../lib/w2ui-2.0.es6";
import { GUIButton } from "../tools/components/GUIButton";
import { makeDiv } from "../tools/HtmlTools";
import { AdminMenuItem } from "./AdminMenuItem";
import { NewPruefungPopup } from "./NewPruefungPopup";

type GetPruefungForPrintingRequest = {
    pruefungId: number
}

type PFileData = {
    id: number;
    name: string;
    text: string;
    text_before_revision?: string
}

type PSchuelerData = {
    id: number;
    rufname: string;
    familienname: string;
    username: string;
    grade?: string;
    points?: string;
    comment?: string;
    attended_exam?: boolean;
    files: PFileData[];

    state?: string;

}

type GetPruefungForPrintingResponse = {
    pSchuelerDataList: PSchuelerData[];
    templates: PFileData[];
}


export class Pruefungen extends AdminMenuItem {

    states: PruefungState[] = ["preparing", "running", "correcting", "opening"];


    pruefungen: Pruefung[];
    klassen: KlassData[];
    workspaces: WorkspaceShortData[];

    pruefungTable: w2grid;
    studentTable: w2grid;

    $stateDiv: JQuery<HTMLDivElement>;
    buttonBack: GUIButton;
    buttonForward: GUIButton;

    selectedStateIndex: number;
    currentPruefung: Pruefung;

    oldPruefung: Pruefung;

    counter: number = 0;

    timerActive: boolean = false;

    getButtonIdentifier(): string {
        return "Prüfungen verwalten";
    }

    async onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>, $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>): Promise<void> {

        //@ts-ignore
        w2utils.settings.dateEndYear = 2050;
        //@ts-ignore
        w2utils.settings.dateStartYear = 1990;

        let response: GetPruefungenForLehrkraftResponse = await ajaxAsync("/servlet/getPruefungenForLehrkraft", {});
        if (response == null) return;
        this.pruefungen = response.pruefungen;
        this.klassen = response.klassen;
        this.workspaces = response.workspaces;
        this.workspaces.forEach(ws => {
            if (ws.path == null || ws.path.length == 0) {
                ws.path = "";
                ws.text = ws.name;
            } else {
                ws.text = ws.path + "/" + ws.name;
            }
        });
        this.workspaces = this.workspaces.sort((wsa, wsb) => { return this.compareWithPath(wsa.name, wsa.path.split("/"), wsb.name, wsb.path.split("/")) });

        this.workspaces.unshift({
            name: "Kein Vorlage-Workspace",
            text: "Kein Vorlage-Workspace",
            id: -1,
            files: [],
            path: ""
        })

        for (let p of this.pruefungen) {
            p["klasse"] = this.klassen.find((c) => c.id == p.klasse_id)?.text;
        }

        this.setupGUI($tableLeft, $tableRight);

        this.onUnselectPruefung();

        this.fillPruefungTable();

        this.initTimer();

        PushClientManager.getInstance().subscribe("onGradeChangedInMainWindow", (data: WorkspaceData) => {
            let record: PSchuelerData = <any>this.studentTable.records.find((r: PSchuelerData) => r.id == data.owner_id);
            if (record == null) return;
            record.grade = data.grade;
            record.points = data.points;
            record.attended_exam = data.attended_exam;
            this.studentTable.refreshRow(record["recid"]);
        })

    }
    destroy() {
        this.pruefungTable.destroy();
        this.studentTable.destroy();
        this.timerActive = false;
        jQuery('.joe_pruefung_timerbar').remove();
        PushClientManager.getInstance().unsubscribe("onGradeChangedInMainWindow");
    }

    checkPermission(user: UserData): boolean {
        return user.is_teacher == true;
    }


    initTimer() {

        let $timerBar = makeDiv(null, 'joe_pruefung_timerbar', null, null, jQuery('#outer'));
        this.timerActive = true;

        let timer = async () => {
            if (!this.timerActive) return;

            setTimeout(timer, 1000);
            if (this.currentPruefung?.state == "running") {
                $timerBar.empty();
                for (let i = 0; i < 5 - this.counter % 5; i++) {
                    $timerBar.append(`<span class="joe_pruefung_timerspan"></span>`)
                }

                if (this.counter % 5 == 0) {
                    let request: GetPruefungStudentStatesRequest = { pruefungId: this.currentPruefung.id }

                    let pruefungStates: GetPruefungStudentStatesResponse = await ajaxAsync("/servlet/getPruefungStates", request);

                    this.displayStudentStates(pruefungStates);
                }
                this.counter++;

            } else {
                $timerBar.empty();
            }
        }

        timer();
    }

    displayStudentStates(pruefungStates: GetPruefungStudentStatesResponse) {

        for (let record of this.studentTable.records as PSchuelerData[]) {
            let isOnline = pruefungStates.pruefungStudentStates[record.id]?.running;
            record.state = isOnline ? "online" : "offline";
            this.studentTable.refreshCell(record["recid"], "state");

            if (isOnline) {
                record.attended_exam = true;
                this.studentTable.refreshCell(record["recid"], "attended_exam");
            }
        }

    }

    resetStudentStates() {
        for (let record of this.studentTable.records as PSchuelerData[]) {
            record.state = null;
            this.studentTable.refreshCell(record["recid"], "state");
        }
    }

    setupGUI($tableLeft: JQuery<HTMLElement>, $tableRight: JQuery<HTMLElement>) {
        let that = this;

        $tableLeft.empty();
        $tableRight.empty();

        makeDiv("pruefungTable", null, null, null, $tableLeft);
        makeDiv("pruefungActions", null, null, null, $tableLeft);
        makeDiv("studentTable", null, null, null, $tableRight);

        w2ui["pruefungTable"]?.destroy();
        this.pruefungTable = new w2grid({
            name: "pruefungTable",
            header: 'Prüfungen',
            multiSelect: false,
            show: {
                header: true,
                toolbar: true,
                toolbarDelete: true,
                toolbarAdd: true,
            },
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'name', text: 'Bezeichnung', size: '15%', sortable: true, resizable: true, editable: { type: 'text' } },
                {
                    field: 'klasse_id', text: 'Klasse', size: '10%', sortable: true, resizable: true,
                    editable: { type: 'list', items: this.klassen, showAll: true, openOnFocus: true, align: 'left' },
                    render: (e) => {
                        return this.klassen.find(c => c.id == e.klasse_id).text
                    }
                },
                {
                    field: 'datum', text: 'Datum', size: '15%', sortable: true, resizable: true, editable: { type: 'date' },
                    render: (e) => {
                        return e.datum == null ? '----' : e.datum;
                    }
                },
                {
                    field: 'template_workspace_id', text: 'Vorlage-Workspace', size: '25%', sortable: true, resizable: true,
                    editable: {
                        type: 'list', items: this.workspaces, showAll: true, openOnFocus: true, align: 'left',
                        style: 'width: 400px'
                    },
                    render: (e) => {
                        let ws = this.workspaces.find(c => c.id == e.template_workspace_id);
                        return ws == null ? "Kein Vorlage-Workspace" : ws.name;
                    }
                },
                {
                    field: 'state', caption: 'Zustand', size: '15%', sortable: true, resizable: true,
                    render: (e, extra) => `<div class="jo_pruefung_state_cell">
                    <div class="jo_pruefung_state_cell_icon img_test-state-${e.state}"></div>
                    <div class="jo_pruefung_state_text">${PruefungCaptions[e.state]}</div></div>`
                }
            ],
            sortData: [{ field: 'klasse', direction: 'ASC' }, { field: 'name', direction: 'ASC' }],
            onSelect: (event) => {
                setTimeout(() => {
                    this.onSelectPruefung(event.detail.clicked.recid)
                }, 100);
            },
            onDelete: (event) => {
                let selected = this.pruefungTable.getSelection();
                event.done((e) => { this.deletePruefung(<number>selected[0]) })
            },
            onAdd: (event) => {  this.addPruefung() },
            onChange: (event) => { this.onUpdatePruefung(event) }
        })

        this.pruefungTable.render($('#pruefungTable')[0]);

        //@ts-ignore
        let oldGetCellEditable: (ind: number, col_ind: number) => any = this.pruefungTable.getCellEditable;

        //@ts-ignore
        this.pruefungTable.getCellEditable = (ind: number, col_ind: number) => {
            let record = this.pruefungTable.records[ind];
            if (col_ind != 1 && col_ind != 3 && record['state'] != 'preparing') {
                return null;
            } else {
                return oldGetCellEditable.call(this.pruefungTable, ind, col_ind);
            }
        }


        w2ui["studentTable"]?.destroy();

        this.studentTable = new w2grid({
            name: "studentTable",
            header: 'Schüler/innen',
            show: {
                header: true
            },
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'familienname', text: 'Familienname', size: '20%', sortable: true, resizable: true, sortMode: 'i18n' },
                { field: 'rufname', text: 'Rufname', size: '20%', sortable: true, resizable: true, sortMode: 'i18n' },
                { field: 'username', text: 'Username', size: '20%', sortable: true, resizable: true, sortMode: 'i18n' },
                { field: 'grade', text: 'Note', size: '13%', sortable: true, resizable: true, editable: { type: "text" } },
                { field: 'points', text: 'Punkte', size: '13%', sortable: true, resizable: true, editable: { type: "text" } },
                {
                    field: 'attended_exam', text: 'anwesend', size: '13%', sortable: true, resizable: true,
                    editable: { type: 'checkbox', style: 'text-align: center' }
                },
                // see https://w2ui.com/web/docs/2.0/w2grid.columns
                {
                    field: 'state', text: 'Status', size: '20%', sortable: true, resizable: true,
                    render: (record: PSchuelerData) => {
                        let state = record.state;
                        if (state == null) state = "---";
                        switch (state) {
                            case "online": return "<div class='jo_stateOnline'>online</div>";
                            case "offline": return "<div class='jo_stateOffline'>offline</div>";
                            case "---": return "---"
                        }

                    }
                },

            ],
            sortData: [{ field: 'familienname', direction: 'ASC' }, { field: 'rufname', direction: 'ASC' }],
            onSelect: (event) => { event.done((e) => { }) },
            onChange: (event) => { this.onUpdateStudent(event) }

        })

        this.studentTable.render($('#studentTable')[0]);

        // Actions
        let $actionsDiv = jQuery('#pruefungActions');

        makeDiv(null, 'jo_action_caption', "Zustand der ausgewählten Prüfung:", null, $actionsDiv);

        this.$stateDiv = jQuery(`<div style="display: flex; flex-direction: column; width: 400px">
            <div style="display: flex; flex-direction: row; justify-content: space-between">
            <div class="pruefungState" id="joe_z0">Vorbereitung</div><div class="img_arrow-right-blue"></div>
            <div class="pruefungState" id="joe_z1">Prüfung läuft</div><div class="img_arrow-leftright-blue"></div>
            <div class="pruefungState" id="joe_z2">Korrektur</div><div class="img_arrow-leftright-blue"></div>
            <div class="pruefungState" id="joe_z3">Herausgabe</div>
            </div>
            </div>
        `)

        let $leftRightButtonDiv = jQuery(`<div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 5px"></div>`);
        this.buttonBack = new GUIButton("<- Zustand zurück", $leftRightButtonDiv);
        this.buttonForward = new GUIButton("Zustand vor ->", $leftRightButtonDiv);

        this.$stateDiv.append($leftRightButtonDiv);

        $actionsDiv.append(this.$stateDiv);

        let lastTimeClicked: number = 0;
        this.buttonBack.onClick(async () => {
            if (performance.now() - lastTimeClicked < 1000) return;
            lastTimeClicked = performance.now();
            if (this.selectedStateIndex == 1) {
                alert("Die Prüfung läuft schon. Sie kann nicht mehr in den Zustand " + PruefungCaptions[0] + " versetzt werden.");
                return;
            }
            if (this.selectedStateIndex == 2) {
                if (!confirm("Soll die Prüfung wirklich sofort erneut gestartet werden?")) return;
            }

            let oldState = this.selectedStateIndex;

            this.selectedStateIndex--;
            this.currentPruefung.state = this.states[this.selectedStateIndex];
            if (await this.savePruefung()) {
                this.renderState();
                this.resetStudentStates();
            } else {
                this.selectedStateIndex = oldState;
                this.currentPruefung.state = this.states[this.selectedStateIndex];
            }

            that.updatePruefungTable();
        })


        this.buttonForward.onClick(async () => {
            if (performance.now() - lastTimeClicked < 1000) return;
            lastTimeClicked = performance.now();
            if (this.selectedStateIndex == 0) {
                if (!confirm("Soll die Prüfung wirklich sofort gestartet werden?")) return;
            }

            let oldState = this.selectedStateIndex;

            this.selectedStateIndex++;
            this.currentPruefung.state = this.states[this.selectedStateIndex];
            if (await this.savePruefung()) {
                this.renderState();
                this.resetStudentStates();
            } else {
                this.selectedStateIndex = oldState;
                this.currentPruefung.state = this.states[this.selectedStateIndex];
            }

            that.updatePruefungTable();

        })

        let $actions2Div = makeDiv(null, "joe_pruefung_actionsDiv", "", null, $actionsDiv);

        makeDiv(null, 'jo_action_caption', "Aktionen für die ausgewählte Prüfung:", null, $actions2Div);

        let $actionButtonsDiv = makeDiv(null, "joe_pruefung_actionButtonsDiv", "", null, $actions2Div);


        new GUIButton(" Alle Arbeiten drucken...", $actionButtonsDiv, "#5050ff", () => {
            this.print();
        });



    }

    updatePruefungTable() {
        this.pruefungTable.refresh();
    }

    async deletePruefung(pruefungId: number) {
        let request: CRUDPruefungRequest = { requestType: "delete", pruefung: this.pruefungen.find(p => p.id = pruefungId) }
        let response: CRUDPruefungResponse = await ajaxAsync('/servlet/crudPruefung', request);

        this.onUnselectPruefung();
        this.pruefungen.splice(this.pruefungen.findIndex(p => p.id == pruefungId), 1);
    }

    addPruefung() {
        NewPruefungPopup.open(this.klassen, this.workspaces, () => { },
            async (pruefung: Pruefung) => {
                let request: CRUDPruefungRequest = { requestType: "create", pruefung: pruefung }
                let response: CRUDPruefungResponse = await ajaxAsync('/servlet/crudPruefung', request);
                if (response.success) {
                    this.pruefungTable.add(response.newPruefungWithIds);
                    this.pruefungen.push(response.newPruefungWithIds);
                }
            })
    }

    async print() {
        let request: GetPruefungForPrintingRequest = { pruefungId: this.currentPruefung.id };

        let p: GetPruefungForPrintingResponse = await ajaxAsync("/servlet/getPruefungForPrinting", request);

        if (p == null) return;

        let $printingDiv = jQuery('#print');
        $printingDiv.empty();

        p.pSchuelerDataList = p.pSchuelerDataList.sort((sda, sdb) => {
            if (sda.familienname != sdb.familienname) return sda.familienname.localeCompare(sdb.familienname);
            return sda.rufname.localeCompare(sdb.rufname);
        })

        let klasse = this.klassen.find(k => k.id == this.currentPruefung.klasse_id).text;

        let datumText = this.currentPruefung.datum == null ? "" : ", am " +
            w2utils.formatDate(this.currentPruefung.datum, 'dd.mm.yyyy');

        for (let sd of p.pSchuelerDataList) {
            $printingDiv.append(`<h1>${sd.familienname}, ${sd.rufname} (Klasse ${klasse})</h1>`);
            $printingDiv.append(`<h1>${this.currentPruefung.name}${datumText}</h1>`);
            for (let f of sd.files) {

                makeDiv(null, 'jo_fileCaption', 'Datei: ' + f.name, null, $printingDiv);

                if (f.text_before_revision != null) {
                    let $twoColumnDiv = makeDiv(null, 'jo_twoColumnDiv', null, null, $printingDiv);
                    let $leftDiv = makeDiv(null, 'jo_leftColumn', null, null, $twoColumnDiv);
                    let $rightDiv = makeDiv(null, 'jo_rightColumn', null, null, $twoColumnDiv);

                    makeDiv(null, 'jo_originalCaption', 'Datei der Schülerin/des Schülers:', null, $leftDiv);
                    makeDiv(null, 'jo_originalCaption', 'Korrektur:', null, $rightDiv);

                    let $codeLeft = makeDiv(null, 'jo_codeBlock', null, null, $leftDiv);
                    this.insertCodeIntoDiv(f.text_before_revision, $codeLeft);

                    let $codeRight = makeDiv(null, 'jo_codeBlock', null, null, $rightDiv);
                    this.insertCodeIntoDiv(f.text, $codeRight);

                } else {
                    let $leftDiv = makeDiv(null, 'jo_leftColumn', null, null, $printingDiv);

                    let $codeLeft = makeDiv(null, 'jo_codeBlock', null, null, $leftDiv);
                    this.insertCodeIntoDiv(f.text, $codeLeft);

                }

            }

            makeDiv(null, 'jo_pagebreak', null, null, $printingDiv);
        }

        window.print();

    }

    insertCodeIntoDiv(code: string, div: JQuery<HTMLElement>) {
        let lines = code.split("\n");
        for (let line of lines) {
            makeDiv(null, null, line, null, div);
        }
    }

    onUpdatePruefung(event: any) {

        let data: Pruefung = <Pruefung>this.pruefungTable.records[event.detail.index];

        let field = this.pruefungTable.columns[event.detail.column]["field"];

        let oldData: any;

        switch (field) {
            case "name":
                oldData = data[field];
                data[field] = event.detail.value.new;
                break;
            case "klasse_id":
                if (data.state != this.states[0]) {
                    alert('Die Klasse kann nur im Zustand "Vorbereitung" noch geändert werden.');
                    event.isCancelled = true;
                    return;
                }
                oldData = data[field];
                data[field] = event.detail.value.new.id;
                break;
            case "datum":
                oldData = data[field];
                data[field] = event.detail.value.new;
                break;
            case "template_workspace_id":
                if (data.state != this.states[0]) {
                    alert('Der Vorlagenworkspace kann nur im Zustand "Vorbereitung" noch geändert werden.');
                    event.isCancelled = true;
                    return;
                }
                oldData = data[field];
                data[field] = event.detail.value.new.id;
                break;
        }

        let request: CRUDPruefungRequest = { requestType: "update", pruefung: data }
        ajax('/crudPruefung', request, (response: CRUDPruefungResponse) => {
            if (response.success == true) {
                delete data["w2ui"]["changes"][field];
                this.pruefungTable.refreshCell(data["recid"], field);

            } else {
                data[field] = event.detail.value.original;
                delete data["w2ui"]["changes"][field];
                this.pruefungTable.refreshCell(data["recid"], field);
            }
        });



    }

    onUpdateStudent(event: any) {

        let data = <PSchuelerData>this.studentTable.records[event.detail.index];

        let field = this.studentTable.columns[event.detail.column]["field"];

        let oldData = data[field];
        data[field] = event.detail.value.new;

        let request: UpdatePruefungSchuelerDataRequest = {
            pruefungId: this.currentPruefung.id,
            schuelerId: data.id,
            grade: data.grade,
            points: data.points,
            attended_exam: data.attended_exam,
            attributesToUpdate: field
        }

        ajax('/updatePruefungSchuelerData', request, (response: BaseResponse) => {
            if (response.success == true) {
                if (data["w2ui"] && data["w2ui"]["changes"]) {
                    delete data["w2ui"]["changes"][field];
                }
                this.studentTable.refreshCell(data["recid"], field);

            } else {
                data[field] = event.detail.value.original;
                if (data["w2ui"] && data["w2ui"]["changes"]) {
                    delete data["w2ui"]["changes"][field];
                }
                this.studentTable.refreshCell(data["recid"], field);
            }
        });

    }

    renderState() {
        this.$stateDiv.find('.pruefungState').css({ "border-bottom": "none", "color": "inherit", "font-weight": "unset" });
        this.$stateDiv.find("#joe_z" + this.selectedStateIndex).css({
            "border-bottom": "2px solid #30ff30",
            "color": "#0000b0",
            "font-weight": "bold"
        })

        this.buttonForward.setActive(this.isTransitionAllowed(this.selectedStateIndex + 1));
        this.buttonBack.setActive(this.isTransitionAllowed(this.selectedStateIndex - 1));

    }

    /* only transitions preparing -> running <-> correcting <-> opening possible
   running -> preparing is possible only if template hasn't been copied to student-workspaces */
    isTransitionAllowed(newStateIndex: number): boolean {
        if (newStateIndex == this.selectedStateIndex) return true;
        if (newStateIndex < 0 || newStateIndex > this.states.length - 1) return false;

        if (newStateIndex == 0 && this.selectedStateIndex == 1) return false;

        return true;
    }


    async fillPruefungTable() {
        this.pruefungTable.add(this.pruefungen);
        this.pruefungTable.refresh();
    }

    async onSelectPruefung(recId: number) {
        let request: GetPruefungForPrintingRequest = { pruefungId: recId };

        let p: GetPruefungForPrintingResponse = await ajaxAsync("/servlet/getPruefungForPrinting", request);

        this.studentTable.unlock();
        this.studentTable.clear();
        this.studentTable.add(p.pSchuelerDataList);
        // this.studentTable.refresh();

        this.currentPruefung = <any>this.pruefungTable.records.find(p => p["recid"] == recId);
        this.selectedStateIndex = this.states.indexOf(this.currentPruefung.state);
        this.renderState();
        jQuery('#pruefungActions').removeClass('jo_inactive');
    }

    onUnselectPruefung() {
        jQuery('#pruefungActions').addClass('jo_inactive');
        this.studentTable.clear();
        this.studentTable.lock("Keine Prüfung ausgewählt", false);
    }

    async savePruefung(): Promise<boolean> {

        let request: CRUDPruefungRequest = { requestType: "update", pruefung: this.currentPruefung }
        let response: CRUDPruefungResponse = await ajaxAsync('/servlet/crudPruefung', request);

        return response.success;

    }


    compareWithPath(name1: string, path1: string[], name2: string, path2: string[]) {

        path1 = path1.slice();
        path1.push(name1);
        name1 = "";

        path2 = path2.slice();
        path2.push(name2);
        name2 = "";

        if (path1[0] == '_Prüfungen' && path2[0] != '_Prüfungen') return 1;
        if (path2[0] == '_Prüfungen' && path1[0] != '_Prüfungen') return -1;

        let i = 0;
        while (i < path1.length && i < path2.length) {
            let cmp = path1[i].localeCompare(path2[i]);
            if (cmp != 0) return cmp;
            i++;
        }

        if (path1.length < path2.length) return -1;
        if (path1.length > path2.length) return 1;

        return name1.localeCompare(name2);


        // let nameWithPath1 = path1.join("/");
        // if (nameWithPath1 != "" && name1 != "") nameWithPath1 += "/";
        // nameWithPath1 += name1;

        // let nameWithPath2 = path2.join("/");
        // if (nameWithPath2 != "" && name2 != "") nameWithPath2 += "/";
        // nameWithPath2 += name2;

        // return nameWithPath1.localeCompare(nameWithPath2);
    }

}
