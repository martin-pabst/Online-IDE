import { TextPosition } from "../lexer/Token";
import { Module } from "./Module";
import { MainBase } from "../../main/MainBase";

type SemicolonPosition = {
    position: TextPosition;
    module: Module;
    firstSeenMs: number;
    isThereAgain: boolean;
}

export class SemicolonAngel {
    
    semicolonPositions: SemicolonPosition[] = [];
    time: number;

    constructor(private main: MainBase){

    }

    startRegistering(){
        this.semicolonPositions.forEach(p => p.isThereAgain = false);
        this.time = new Date().getTime();
        this.semicolonPositions = this.semicolonPositions.filter(sp => this.time - sp.firstSeenMs < 5000);
    }

    register(position: TextPosition, module: Module){
        let oldEvidence = this.semicolonPositions.find(p => p.position.line == position.line && p.position.column == position.column);
        if(oldEvidence){
            oldEvidence.isThereAgain = true;
        } else {
            this.semicolonPositions.push({position: position, firstSeenMs: this.time, isThereAgain: true, module: module});
        }
    }

    healSemicolons(){
        let time = new Date().getTime();
        this.semicolonPositions = this.semicolonPositions.filter(p => p.isThereAgain);

        let currentlyEditedModule = this.main.getCurrentlyEditedModule();
        
        let cursorPosition = this.main.getMonacoEditor().getPosition();
        if(cursorPosition == null) return;

        let cursorLine = this.main.getMonacoEditor().getPosition().lineNumber;

        this.semicolonPositions.filter(p => time - p.firstSeenMs > 2000).forEach(p => {

            let isCurrentModule = p.module.file.id != null && p.module.file.id == currentlyEditedModule.file.id;

            let editOperations: monaco.editor.IIdentifiedSingleEditOperation[] = [
                {
                    range: new monaco.Range(p.position.line, p.position.column, p.position.line, p.position.column),
                    text: ";",
                    forceMoveMarkers: true
                }
            ]

            if(isCurrentModule){
                if(Math.abs(cursorLine - p.position.line) > 1){

                    let line1 = p.module.model.getValueInRange(new monaco.Range(p.position.line, 0, p.position.line, 10000)).trim();
                    let linesFollowing = p.module.model.getValueInRange(new monaco.Range(p.position.line + 1, 0, p.position.line + 2, 10000)).trim();
        
                    let definitelyNoMethodDeclaration = !line1.endsWith(';') && !line1.endsWith('{') && !linesFollowing.startsWith('{');
        
                    if(definitelyNoMethodDeclaration){
                        let editor = this.main.getMonacoEditor();
                        const selection = editor.getSelection();
                        editor.executeEdits('Semicolon-Angel', editOperations);
                        editor.setSelection(selection);
                        this.semicolonPositions.splice(this.semicolonPositions.indexOf(p), 1);
                    }
                }
            } 


        });

    }

}