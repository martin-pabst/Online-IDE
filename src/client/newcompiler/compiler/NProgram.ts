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

    discardTopOfStack() {
        if(this.parts.length > 0 && !this.lastPartIsExpression){
            let lastpart = this.parts[this.parts.length - 1];
            if(typeof lastpart == "string"){
                if(lastpart.startsWith("s.push(") && lastpart.endsWith(");")){
                    this.parts[this.parts.length - 1] = lastpart.substring(7, lastpart.length - 2);
                    this.lastPartIsExpression = true;
                    return;
                }
            } 

        } 
        this.parts.push(NFragment.popStatement);
        this.lastPartIsExpression = true;
    }

    applyBinaryOperator(rightFragment: NFragment, operator: TokenType, resultType: NType) {

        let leftExpression = this.lastPartIsExpression ? this.parts.pop() : "s.pop();"
        let rightExpression = rightFragment.lastPartIsExpression ? rightFragment.parts.pop() : "s.pop();"

        
        this.parts = rightFragment.parts.concat(this.parts);
        let template = this.dataType.getOperatorExpression(operator, rightFragment.dataType);
        if(template != null && template.e != null){

            if(template.condition != null){
                let cond: string = template.condition.replace("$1", leftExpression).replace("$2", rightExpression);
                this.parts.push("if(thread.check(" + cond + ",'" + template.errormessage + "')) return;");
            }

            this.parts.push(template.e.replace("$1", leftExpression).replace("$2", rightExpression));
        } else {
            this.parts.push(leftExpression + " " + TokenTypeReadable[operator] + " " + rightExpression);
        }

        this.lastPartIsExpression = true;
        this.dataType = resultType;
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