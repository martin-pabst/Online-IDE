import { TextPosition } from "src/client/compiler/lexer/Token.js";
import { NType } from "../types/NewType.js"
import { NStep } from "./NProgram.js"


export class NProgramBlock {
    steps: NStep[] = [];
    type: NType = null;
    isInlineExpressionWithoutPush?: boolean;
    withReturnStatement?: boolean;
    endPosition?: TextPosition;
    
}



export class CodeBuilder {

    nextId: number = 0;
    jumpDestinationMap: {[id: number]:NStep} = {};
    jumpDestinationPraefix = "__jd";

    getJumpDestinationWithPlaceholder(): {step: NStep, placeholder: string} {
        let id = this.nextId++;

        let dest: NStep = {
            codeAsString: null,
            position: null,
            isOnlyJumpDestination: true
        }

        return { step: dest, placeholder: this.jumpDestinationPraefix + id }
    }



}