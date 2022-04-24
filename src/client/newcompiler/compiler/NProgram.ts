import { TextPosition } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js"
import { NThread } from "../interpreter/NThreadPool.js";
import { NType } from "../types/NewType.js";
import { NSymbolTable } from "./NSymbolTable.js";


export type NHelper = any;

export type JumpDestination = {
    placeholder: string;
    destination: NStep;
}

export type NFragmentType = "constant" | "block" |
                             "expression" | "jumpDestination" | "jumpStatement";

export class NFragment {
    parts: any[] = [];      // NFragment || string || constant

    valuePushedToStack: boolean = false;
    ensuresReturnStatement: boolean = false;
    forceStepToEndAfterThisFragment: boolean = false;
    hasSideEffects: boolean = false;

    static popStatement = 's.pop();';
    static peekExpression = 's[s.length - 1]';

    constructor(public fragmentType: NFragmentType, public dataType: NType, public start: TextPosition, public end: TextPosition = null){
        
    }

    addFragmentToBlock(nextFragment: NFragment) {
        this.parts.push(nextFragment);
        this.end = nextFragment.end;
        this.ensuresReturnStatement = this.ensuresReturnStatement || nextFragment.ensuresReturnStatement;
    }

    addPop() {
        if(this.parts.length > 0 && this.parts[this.parts.length - 1] == NFragment.peekExpression + ";"){
            this.parts.pop();
        }
        this.parts.push(NFragment.popStatement);
        this.valuePushedToStack = false;
    }

    addPeek(endOfStatement: boolean) {
        this.parts.push(NFragment.peekExpression);
    }

}


export class NStep {
    // compiled function returns new programposition
    run?: (stack: any, stackBase: number, helper: NHelper, thread: NThread ) => number;
    
    codeAsString: string;
    start?: TextPosition;
    end?: TextPosition;
    stopStepOverBeforeStep?: boolean;
    isBreakpoint?: boolean;
    correspondingStepInOtherStepmode?: NStep;
    
}

export class NProgram {
    numberOfParameters: number = 0;
    numberOfLocalVariables: number = 0;
    
    stepsSingle: NStep[] = [];
    stepsMultiple: NStep[] = [];
    helper: NHelper[] = [];                  // (function or Program or class)[]
    
    /**
     * If program is a javascript function:
     */
    invoke: () => void; // with arbitrary signature...

    // only at compile time:
    fragments: NFragment[] = [];

    constructor(public module: Module, public symbolTable: NSymbolTable, public methodIdentifierWithClass: string){

    }
}