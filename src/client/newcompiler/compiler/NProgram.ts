import { TextPosition, TokenType, TokenTypeReadable } from "../../compiler/lexer/Token.js";
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

    lastPartIsExpression: boolean = true;    // if this is false then last part is statement
    ensuresReturnStatement: boolean = false;
    forceStepToEndAfterThisFragment: boolean = false;
    hasSideEffects: boolean = false;
    isAssignable: boolean = false;

    constantValue?: any;

    static stackIdentifier = 's';
    static popStatement = 's.pop();';
    static peekExpression = 's[s.length - 1]';

    constructor(public fragmentType: NFragmentType, public dataType: NType, public start: TextPosition, public end: TextPosition = null){
        
    }

    applyUnaryOperator(operator: TokenType) {
        let operatorString = TokenTypeReadable[operator];
        if(this.lastPartIsExpression){
            this.parts[this.parts.length - 1] = operatorString + this.parts[this.parts.length - 1];
        } else {
            this.parts.push(`${operatorString}${NFragment.popStatement}`);
            this.lastPartIsExpression = true;
        }
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
        this.lastPartIsExpression = true;
    }

    addPeek(endOfStatement: boolean) {
        this.parts.push(NFragment.peekExpression);
    }

    assign(rightFragment: NFragment, operator: TokenType) {
        
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