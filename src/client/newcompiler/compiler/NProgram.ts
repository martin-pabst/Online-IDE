import { TextPosition, TokenType, TokenTypeReadable } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js"
import { NThread } from "../interpreter/NThreadPool.js";
import { NClassLike } from "../types/NClass.js";
import { NType } from "../types/NewType.js";
import { NSymbolTable } from "./NSymbolTable.js";


export type NHelper = any;

export type JumpDestination = {
    placeholder: string;
    destination: NStep;
}

export type NFragmentType = "constant" | "block" |
    "expression" | "jumpDestination" | "jumpStatement";

export class NBlock {
    statements: NFragment[] = [];
    ensuresReturnStatement: boolean = false;
}

type FragmentPart = {
    p: string,
    forceStepToEndAfterPart?: boolean
}

export class NFragment {
    parts: FragmentPart[] = [];

    static destinationCounter: number = 0;

    lastPartIsJSExpression: boolean = true;    // if this is false then last part pushed value on stack
    hasSideEffects: boolean = false;
    isAssignable: boolean = false;

    constantValue?: any;

    constructor(public fragmentType: NFragmentType, public dataType: NType, public start: TextPosition, public end: TextPosition = null) {

    }

    applyUnaryOperator(operator: TokenType) {
        let operatorString = TokenTypeReadable[operator];

        if (this.lastPartIsJSExpression) {
            this.parts[this.parts.length - 1].p = operatorString + this.parts[this.parts.length - 1].p;
        } else {
            this.addPart(`${operatorString}s.pop()`);
            this.lastPartIsJSExpression = true;
        }
    }

    addPart(p: string, forceStepToEndAfterPart: boolean = false) {
        this.parts.push({ p: p, forceStepToEndAfterPart: forceStepToEndAfterPart });
    }

    discardTopOfStack() {
        if (this.parts.length > 0 && !this.lastPartIsJSExpression) {
            let lastpart = this.parts[this.parts.length - 1].p;
            if (lastpart.startsWith("s.push(") && lastpart.endsWith(");")) {
                this.parts[this.parts.length - 1].p = lastpart.substring(7, lastpart.length - 2);
                this.lastPartIsJSExpression = true;
                return;
            }
        } else {
            this.addPart("pop()");
            this.lastPartIsJSExpression = true;
        }
    }

    applyBinaryOperator(rightFragment: NFragment, operator: TokenType, resultType: NType) {

        let leftExpression = this.lastPartIsJSExpression ? this.parts.pop().p : "s.pop()"
        let rightExpression = rightFragment.lastPartIsJSExpression ? rightFragment.parts.pop().p : "s.pop()"


        this.parts = rightFragment.parts.concat(this.parts);
        let template = this.dataType.getOperatorExpression(operator, rightFragment.dataType);
        if (template != null && template.e != null) {
            this.addPart(template.e.replace("$1", leftExpression).replace("$2", rightExpression));
        } else {
            this.addPart(leftExpression + " " + TokenTypeReadable[operator] + " " + rightExpression);
        }

        this.lastPartIsJSExpression = true;
        this.dataType = resultType;
    }

    applyTernaryOperator(secondFragment: NFragment, thirdFragment: NFragment, type: NType) {


        if(secondFragment.parts.length == 1 && secondFragment.lastPartIsJSExpression && thirdFragment.parts.length == 1 && thirdFragment.lastPartIsJSExpression){
            let leftExpression = this.lastPartIsJSExpression ? this.parts.pop().p : "s.pop()"
            this.addPart(`(${leftExpression}) ? (${secondFragment.parts.pop()}):(${thirdFragment.parts.pop()}) `);
            this.lastPartIsJSExpression = true;
            this.dataType = type;
            return;
        }

        let leftExpression = this.lastPartIsJSExpression ? this.parts.pop().p : "s.pop()"
        this.addPart(`if(${leftExpression})`);
        let jumpDestA = this.jumpToAndGetJumpDestination();
        thirdFragment.ensureLastPartIsPushedToStack();
        this.parts = this.parts.concat(thirdFragment.parts);

        let jumpDestB = this.jumpToAndGetJumpDestination();
        this.addJumpDestination(jumpDestA);
        secondFragment.ensureLastPartIsPushedToStack();
        this.parts = this.parts.concat(secondFragment.parts);
        this.addJumpDestination(jumpDestB);
        
        this.dataType = type;
        this.lastPartIsJSExpression = false;
    }

    addJumpDestination(destination?: string): string {
        if(destination == null){
            destination = this.getJumpDestination();
        }
        this.forceStepToEndAfterLastPart();
        this.addPart(destination);
        return destination;
    }

    forceStepToEndAfterLastPart(){
        if(this.parts.length > 0){
            this.parts[this.parts.length].forceStepToEndAfterPart = true;
        }
    }

    jumpToAndGetJumpDestination():string {
        let jumpDest = this.getJumpDestination();
        this.addPart(`return ${jumpDest}`, true);
        return jumpDest;
    }

    getJumpDestination(): string {
        return `#dest_${NFragment.destinationCounter++}`;
    }

    ensureLastPartIsPushedToStack() {
        if (this.lastPartIsJSExpression) {
            this.addPart(`s.push(${this.parts.pop()})`);
        }
    }

    addVirtualMethodCall(signature: string, parameterValues: NFragment[], returnType: NType) {
        // make shure "this"-Reference is on stack
        this.ensureLastPartIsPushedToStack();

        // push reference to thread
        this.addPart("s.push(thread);");

        // push parameters
        for (let pv of parameterValues) {
            pv.ensureLastPartIsPushedToStack();
            this.parts = this.parts.concat(pv.parts);
        }

        this.addPart(`thread.callVirtualMethod(${parameterValues.length},${signature});`)

        this.dataType = returnType;
        this.lastPartIsJSExpression = false;

    }

    checkClassCasting(typeTo: NClassLike) {
        if(this.lastPartIsJSExpression){
            this.parts[this.parts.length - 1].p = `thread.cast(${this.parts[this.parts.length - 1].p},${typeTo.identifier})`;
        } else {
            this.addPart(`thread.cast(s[s.length - 1],${typeTo.identifier})`);
        }
        this.dataType = typeTo;
    }

    applyCastExpression(expression: string, typeTo: NType) {
        if(this.lastPartIsJSExpression){
            this.parts[this.parts.length - 1].p = expression.replace("$1", this.parts[this.parts.length - 1].p);
        } else {
            this.addPart(expression.replace("$1", "s.pop()"));
            this.lastPartIsJSExpression = true;
        }
        this.dataType = typeTo;
    }


}

export type Breakpoint = {
    line: number,
    column: number,
    step: NStep,
}

export class NStep {
    // compiled function returns new programposition
    run?: (stack: any, stackBase: number, helper: NHelper, thread: NThread) => number;

    codeAsString: string;
    start?: TextPosition;
    end?: TextPosition;
    stopStepOverBeforeStep?: boolean;
    isBreakpoint?: boolean;
    correspondingStepInOtherStepmode?: NStep;

}

export class NProgram {
    numberOfParameters: number = 0;         // without "this"
    numberOfLocalVariables: number = 0;

    stepsSingle: NStep[] = [];
    stepsMultiple: NStep[] = [];
    helper: NHelper[] = [];                  // (function or Program or class)[]

    // only at compile time:
    fragments: NFragment[] = [];

    constructor(public module: Module, public symbolTable: NSymbolTable, public methodIdentifierWithClass: string) {

    }
}