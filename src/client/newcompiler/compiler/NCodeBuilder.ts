import { TextPosition } from "src/client/compiler/lexer/Token.js";
import { NType } from "../types/NewType.js"
import { NStep } from "./NProgram.js"





export class CodeBuilder {

    nextId: number = 0;
    jumpDestinationMap: {[id: number]:NStep} = {};
    jumpDestinationPraefix = "__jd";

    getJumpDestinationId(): number {

        return this.nextId++;

    }



}