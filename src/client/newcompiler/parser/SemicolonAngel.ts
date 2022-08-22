import { TextPosition } from "../lexer/Token";
import { Module } from "../compiler/Module";
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
                    let editor = this.main.getMonacoEditor();
                    const selection = editor.getSelection();
                    editor.executeEdits('Semicolon-Angel', editOperations);
                    editor.setSelection(selection);
                    this.semicolonPositions.splice(this.semicolonPositions.indexOf(p), 1);
                }
            } 


        });

    }

}