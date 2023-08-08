import { CRUDPruefungRequest, CRUDPruefungResponse, ClassData, GetPruefungStudentStatesRequest, GetPruefungStudentStatesResponse, Pruefung, PruefungCaptions, PruefungState, UserData } from "../../communication/Data.js";
import { ButtonClass } from "../../runtimelibrary/graphics/gui/Button.js";
import { setSelectItems } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";
import { CheckboxState, Dialog } from "./Dialog.js";
import jQuery from "jquery";
import { GUIButton } from "./controls/GUIButton.js";
import { getSelectedObject } from "../../tools/HtmlTools.js";
import { ajaxAsync } from "../../communication/AjaxHelper.js";


export class PruefungDialog {

    states: PruefungState[] = ["preparing", "running", "correcting", "opening"];

    $stateDiv: JQuery<HTMLDivElement>;
    buttonBack: GUIButton;
    buttonForward: GUIButton;
    
    $nameInput: JQuery<HTMLInputElement>;

    isNewPruefung: boolean;

    oldStateIndex: number;
    selectedStateIndex: number;
    $classSelect: JQuery<HTMLSelectElement>;

    resolve: (pruefung: Pruefung) => void;
    reject: (reason?: any) => void;

    pruefungCopy: Pruefung;

    dialog: Dialog;

    timer: any;

    constructor(private main: Main, private classData: ClassData[], private pruefung: Pruefung = null){
        this.pruefungCopy = Object.assign({}, this.pruefung);
    }

    open(): Promise<Pruefung> {

        this.isNewPruefung = this.pruefung == null;
        this.selectedStateIndex = this.pruefung == null ? 0 : this.states.indexOf(this.pruefung.state);
        this.oldStateIndex = this.selectedStateIndex;

        this.dialog = new Dialog();
       
        this.dialog.init();
        this.dialog.heading(this.pruefung == null ? "Neue Prüfung anlegen" : `Daten zur Prüfung "${this.pruefung.name}" bearbeiten`);

        let $inputGrid = jQuery(`<div style="display: grid; grid-template-columns: 150px 1fr; align-items: baseline"></div>`);

        $inputGrid.append(`<div>Name der Prüfung:</div>`);
        this.$nameInput = <JQuery<HTMLInputElement>> jQuery(`<input type="text" style="width: 200px; margin: 10px 0 0 20px"></input>`);
        $inputGrid.append(this.$nameInput);
        
        if(this.pruefung != null){
            this.$nameInput.val(this.pruefung.name);
        }

        $inputGrid.append(`<div>Klasse:</div>`);
        this.$classSelect = <JQuery<HTMLSelectElement>> jQuery(`<select style="width: 100px; margin: 10px 0 0 20px"></select>`)
        $inputGrid.append(this.$classSelect);
        
        setSelectItems(this.$classSelect, this.classData.map( cd => {
            
            return {
                caption: cd.name,
                object: cd,
                value: cd.id
            }

        }), this.pruefung == null ? undefined : this.pruefung.klasse_id);

        this.enableOrDisableClassSelect();
        
        $inputGrid.append(`<div style="margin-top: 15px">Zustand:</div>`);

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
        
        $inputGrid.append(this.$stateDiv);

        this.renderState(this.selectedStateIndex);
        
        this.dialog.addDiv($inputGrid);

        this.buttonBack.onClick(() => {
            if(this.selectedStateIndex == 1){
                alert("Die Prüfung läuft schon. Sie kann nicht mehr in den Zustand " + PruefungCaptions[0] + " versetzt werden.");
                return;
            }
            if(this.selectedStateIndex == 2){
                if(!confirm("Soll die Prüfung wirklich sofort erneut gestartet werden?")) return;
            }

            this.selectedStateIndex--;
            this.renderState(this.selectedStateIndex);
            this.savePruefung();
        })


        this.buttonForward.onClick(() => {
            if(this.selectedStateIndex == 0){
                if(!confirm("Soll die Prüfung wirklich sofort gestartet werden?")) return;
            }
            this.selectedStateIndex++;
            this.renderState(this.selectedStateIndex);
            this.savePruefung();
        })


        this.dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => {
                    this.close();
                    this.reject("Canceled")
                }
            },
            {
                caption: "OK",
                color: "green",
                callback: async () => {
                    await this.savePruefung();
                    this.close();
                    this.resolve(this.pruefung)
                }
            },
        ])
 
        
        if(!this.isNewPruefung && this.pruefung.state == "running"){
            this.startDisplayingStudentStates();
        } else {
            this.initFooter(this.dialog.$dialogFooter);
        }

        return new Promise<Pruefung>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });

    }
    
    enableOrDisableClassSelect() {
        let classSelectDisabled: boolean = this.pruefung != null && this.pruefung.state != 'preparing';

        if(classSelectDisabled){
            this.$classSelect.prop('disabled', 'disabled');
        } else {
            this.$classSelect.prop('disabled', false);
        }
    }

    async savePruefung() {

        if(this.pruefung == null){
            this.pruefung = {
                id: -1,
                klasse_id: -1,
                name: "",
                state: "preparing",
                template_workspace_id: -1
            }
        }

        this.pruefung.name = <string>this.$nameInput.val();
        this.pruefung.klasse_id = (<ClassData>getSelectedObject(this.$classSelect)).id;
        this.pruefung.state = this.states[this.selectedStateIndex];

        if(this.isNewPruefung){
            let request: CRUDPruefungRequest = {requestType: "create", pruefung: this.pruefung}
            let response: CRUDPruefungResponse = await ajaxAsync('/servlet/crudPruefung', request);
            if(response.success){
                this.pruefung.id = response.newPruefungWithIds.id;
                this.pruefung.template_workspace_id = response.newPruefungWithIds.template_workspace_id;
            } else {
            }
        } else {
            let request: CRUDPruefungRequest = {requestType: "update", pruefung: this.pruefung}
            let response: CRUDPruefungResponse = await ajaxAsync('/servlet/crudPruefung', request);
            if(response.success){
                if(this.pruefungCopy.state != this.pruefung.state){
                    this.onStateChanged(this.pruefungCopy.state, this.pruefung.state);
                }
                this.pruefungCopy = Object.assign({}, this.pruefung);
            } else {
                this.pruefung = Object.assign({}, this.pruefungCopy);
            }
        }

    }

    
    onStateChanged(oldState: PruefungState, newState: PruefungState) {

        if(oldState == "running" && newState != "running"){
            this.stopDisplayingStudentStates();
        } else if(oldState != "running" && newState == "running"){
            if(this.timer == null) this.startDisplayingStudentStates();
        }

        this.enableOrDisableClassSelect();

    }

    close(){
        if(this.timer != null){
            this.stopDisplayingStudentStates();
        }
        this.dialog.close();
    }

    renderState(stateIndex: number){
        this.$stateDiv.find('.pruefungState').css({"border-bottom": "none", "color": "inherit"});
        this.$stateDiv.find("#joe_z" + stateIndex).css({
            "border-bottom": "2px solid #30ff30",
            "color": "#fff"
        })

         this.buttonForward.setActive(this.isTransitionAllowed(stateIndex + 1));
         this.buttonBack.setActive(this.isTransitionAllowed(stateIndex - 1));

    }
    
    /* only transitions preparing -> running <-> correcting <-> opening possible
       running -> preparing is possible only if template hasn't been copied to student-workspaces */
    isTransitionAllowed(newStateIndex: number): boolean {
        if(newStateIndex == this.oldStateIndex) return true;
        if(newStateIndex < 0 || newStateIndex > this.states.length - 1) return false;

        if(newStateIndex == 0 && this.oldStateIndex == 1) return false;

        return true;
    }

    startDisplayingStudentStates(){
        
        let $footer = this.dialog.$dialogFooter;
        $footer.empty();

        let $captionDiv = jQuery(`<div style="position: relative"></div>`)
        $footer.append($captionDiv);
        $captionDiv.append(`<h2><span class="img_test-state-running joe_pruefung_clock_before_caption"></span>Prüfung läuft!</h2>`)

        let $timerBar = jQuery(`<div class="joe_pruefung_timerbar"></div>`)
        $captionDiv.append($timerBar);

        let $stateList = <JQuery<HTMLDivElement>> jQuery(`<div class="joe_pruefung_studentStateList"></div>`)
        $footer.append($stateList);

        let counter: number = 0;
        let that = this;

        this.timer = setInterval(async () => {
            $timerBar.empty();
            for(let i = 0; i <  counter % 5; i++){
                $timerBar.append(`<span class="joe_pruefung_timerspan"></span>`)
            }

            if(counter % 5 == 0){
                let request: GetPruefungStudentStatesRequest = {pruefungId: this.pruefung.id}

                let pruefungStates: GetPruefungStudentStatesResponse  = await ajaxAsync("/servlet/getPruefungStates", request);

                that.displayStudentState(pruefungStates, $stateList);
            }
            counter++;
        }, 1000)


    }

    displayStudentState(pruefungStates: GetPruefungStudentStatesResponse, $list: JQuery<HTMLDivElement>){
        let klass = this.classData.find( c => c.id == this.pruefung.klasse_id);
        $list.empty();
        let i = 0;
        for(let student of klass.students){
            let column = (i % 2 == 0) ? 1 : 5;
            let state = pruefungStates.pruefungStudentStates[student.id];

            let running = (state == null || !state.running) ? `<span class="joe_pruefung_not_connected">(nicht verbunden)</span>` : `<span class="joe_pruefung_connected">verbunden</span>`;

            let $studentDiv = jQuery(`<div style="grid-column: ${column}">${student.familienname}, ${student.rufname}</div>
            <div style="grid-column: ${column + 2}">${running}</div>`);
            $list.append($studentDiv);
            i++;
        }
        

    }

    stopDisplayingStudentStates(){
        if(this.timer != null) clearInterval(this.timer);
        this.dialog.$dialogFooter.empty();
        this.initFooter(this.dialog.$dialogFooter);
        this.timer = null;
    }


    initFooter($dialogFooter: JQuery<HTMLElement>) {
        $dialogFooter.append(`
        <div>
        <h3>Zu den Zuständen:</h3>
        <ul>
            <li>Jede Prüfung durchläuft (i.d.R. der Reihe nach) die vier Zustände "Vorbereitung", "Prüfung läuft", "Korrektur" und "Herausgabe". 
                 Je nach Zustand ändert sich die Ansicht der Prüfung bei den Schüler/innen und bei der Lehrkraft (s.u.).</li>
            <li>Mit den Buttons "Zustand vor" und "Zustand zurück" oben können Sie die Prüfung in den jeweils nächsten/vorhergehenden Zustand versetzen. 
                <div style="font-weight: bold">Die Zustandsänderung wird erst nach Klick auf den OK-Button wirksam.</div></li>
            <li><span class="joe_pruefung_state">Zustand "Vorbereitung": </span><span class="img_test-state-preparing joe_pruefung_preview_img"></span> 
                <div>
                In diesem Zustand sehen die Schüler/innen die Prüfung noch nicht. Klickt die Lehrkraft die Prüfung im Navigator links an, dann sieht sie darüber 
                den Vorlagen-Workspace der Prüfung. Jede Datei, die sie dort erstellt, wird beim Übergang zum Zustand "Prüfung läuft" in den Prüfungsworkspace jeder Schülerin/jedes Schülers kopiert.
                </div>
            </li>
            <li><span class="joe_pruefung_state">Zustand "Prüfung läuft": </span> <span class="img_test-state-running joe_pruefung_preview_img"></span>
                <div>
                Beim Übergang in den Zustand "Prüfung läuft" werden die Prüfungsworkspaces der Schüler/innen erstellt. Sie enthalten Kopien aller Dateien aus dem Vorlagen-Workspace der Prüfung.
                Die Schüler/innen sehen ab jetzt nur noch den Prüfungs-Workspace und können schreibend darauf zugreifen. Die Menüzeile der Online-IDE erscheint rot gefärbt, so dass die Lehrkraft 
                schnell sehen kann, auf welchen Rechnern der Prüfungsmodus aktiv ist.
                </div>
            </li>
            <li><span class="joe_pruefung_state">Zustand "Korrektur": </span> <span class="img_test-state-correcting joe_pruefung_preview_img"></span>
                <div>
                Die Schüler/innen sehen in diesem Zustand wieder ihre normalen Workspaces. Den Prüfungsworkspace sehen sie nicht mehr. Klickt die Lehrkraft im Navigator links auf die Prüfung. So sieht sie darüber die Liste der Schüler/innen der zugeordneten Klasse.
                Klickt sie auf eine/n der Schüler/innen, so sieht sie deren/dessen Prüfungsworkspace und kann dort Korrekturen vornehmen. Oberhalb des Editorbereichs erscheint der Button "Korrekturen zeigen". Durch Klick darauf werden die Korrekturen der Lehrkraft
                in einer Diff-Ansicht gezeigt.
                </div>
            </li>
            <li><span class="joe_pruefung_state">Zustand "Herausgabe": </span> <span class="img_test-state-opening joe_pruefung_preview_img"></span>
                <div>
                Die Schüler/innen sehen in diesem Zustand in der Liste ihrer Workspaces einen Ordner "Prüfungen". Er enthält den Prüfungsworkspace. Klicken sie auf diesen, so können sie 
                <span style="font-weight: bold"> nur lesend</span> auf die enthaltenen Dateien zugreifen. Wurde eine Datei durch die Lehrkraft verändert, so erscheint oberhalb des Editor-Bereichs der Button "Korrekturen zeigen". Nach
                Klick darauf zeigt die IDE die Korrekturen in einer Diff-Ansicht. 
                <div>Die Lehrkraft sieht die Prüfung genau so wie im Zustand "Korrektur".</div>
                </div>
            </li>
    
        </ul>
        </div>
        `)
    }
    

}

