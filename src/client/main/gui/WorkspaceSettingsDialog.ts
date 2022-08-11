import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";
import { CheckboxState, Dialog } from "./Dialog.js";


type Library = {
    identifier: string,
    description: string,
    checkboxState?: CheckboxState
}

export class WorkspaceSettingsDialog{

    libraries: Library[] = [
        {identifier: "gng", description: "Graphics'n Games-Bibliothek zu den Informatikbüchern des Cornelsen-Verlages für das Land Bayern (Bemerkung: Die Klassen Turtle und Text heißen hier GTurtle und GText)"}
    ]

    constructor(private workspace: Workspace, private main: Main){

    }

    open(){
        let dialog = new Dialog();
        dialog.init();
        dialog.heading("Einstellungen zum Workspace " + this.workspace.name);
        dialog.subHeading("A. Verwendete Bibliotheken:");

        let currentLibraries = this.workspace.settings.libraries;

        for(let library of this.libraries){
            let cbs = dialog.addCheckbox(library.description, currentLibraries.indexOf(library.identifier) >= 0, library.identifier);
            library.checkboxState = cbs;
        }

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
                    let changed: boolean = false;
                    let newLibs: string[] = [];
                    for(let lib of this.libraries){
                        let used = lib.checkboxState();
                        changed = changed || (used != (currentLibraries.indexOf(lib.identifier) >= 0));
                        if(used) newLibs.push(lib.identifier);
                    }

                    if(changed){
                        this.workspace.settings.libraries = newLibs;
                        this.workspace.saved = false;
                        this.workspace.alterAdditionalLibraries();
                        this.main.networkManager.sendUpdates(null, true);
                    }

                    dialog.close();
                }
            },
        ])
 

    }
}