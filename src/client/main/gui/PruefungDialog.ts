import { ClassData, Pruefung, PruefungState } from "../../communication/Data.js";
import { ButtonClass } from "../../runtimelibrary/graphics/gui/Button.js";
import { setSelectItems } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";
import { CheckboxState, Dialog } from "./Dialog.js";
import jQuery from "jquery";
import { GUIButton } from "./controls/GUIButton.js";


export class PruefungDialog {

    states: PruefungState[] = ["preparing", "running", "correcting", "opening"];

    $stateDiv: JQuery<HTMLDivElement>;
    buttonBack: GUIButton;
    buttonForward: GUIButton;
    
    isNewPruefung: boolean;

    oldStateIndex: number;
    selectedStateIndex: number;

    constructor(private main: Main){

    }

    open(pruefung: Pruefung, classData: ClassData[]){

        this.isNewPruefung = pruefung == null;
        this.selectedStateIndex = pruefung == null ? 0 : this.states.indexOf(pruefung.state);
        this.oldStateIndex = this.selectedStateIndex;

        let dialog = new Dialog();
        dialog.init();
        dialog.heading(pruefung == null ? "Neue Prüfung anlegen" : `Daten zur Prüfung "${pruefung.name}" bearbeiten`);

        let $inputGrid = jQuery(`<div style="display: grid; grid-template-columns: 150px 1fr; align-items: baseline"></div>`);

        $inputGrid.append(`<div>Name der Prüfung:</div>`);
        let $nameInput = jQuery(`<input type="text" style="width: 200px; margin: 10px 0 0 20px"></input>`);
        $inputGrid.append($nameInput);
        
        if(pruefung != null){
            $nameInput.val(pruefung.name);
        }

        $inputGrid.append(`<div>Klasse:</div>`);
        let $classSelect = <JQuery<HTMLSelectElement>> jQuery(`<select style="width: 100px; margin: 10px 0 0 20px"></select>`)
        $inputGrid.append($classSelect);
        
        setSelectItems($classSelect, classData.map( cd => {
            
            return {
                caption: cd.name,
                object: cd,
                value: cd.id
            }

        }), pruefung == null ? undefined : pruefung.klasse_id);
        
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
        
        dialog.addDiv($inputGrid);

        this.buttonBack.onClick(() => {
            this.selectedStateIndex--;
            this.renderState(this.selectedStateIndex);
        })


        this.buttonForward.onClick(() => {
            this.selectedStateIndex++;
            this.renderState(this.selectedStateIndex);
        })


        dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => {dialog.close()}
            },
            {
                caption: "OK",
                color: "green",
                callback: () => {
 
                    dialog.close();
                }
            },
        ])
 

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

        if(newStateIndex <= 3 && newStateIndex == this.oldStateIndex + 1) return true;
        if((this.oldStateIndex == 2 || this.oldStateIndex == 3) && newStateIndex == this.oldStateIndex - 1) return true;

        return false;
    }



}