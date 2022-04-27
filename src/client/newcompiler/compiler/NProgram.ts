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

export class NBlock {
    statements: NFragment;
    ensuresReturnStatement: boolean = false;
}

type FragmentPart = {
    p: string,
    forceStepToEndAfterPart?: boolean
}

export class NFragment {
    parts: FragmentPart[] = [];

    lastPartIsExpression: boolean = true;    // if this is false then last part is statement
    hasSideEffects: boolean = false;
    isAssignable: boolean = false;

    constantValue?: any;

    constructor(public fragmentType: NFragmentType, public dataType: NType, public start: TextPosition, public end: TextPosition = null) {

    }

    applyUnaryOperator(operator: TokenType) {
        let operatorString = TokenTypeReadable[operator];

        if (this.lastPartIsExpression) {
            this.parts[this.parts.length - 1].p = operatorString + this.parts[this.parts.length - 1].p;
        } else {
            this.addPart(`${operatorString}s.pop()`);
            this.lastPartIsExpression = true;
        }
    }

    addPart(p: string) {
        this.parts.push({ p: p });
    }

    discardTopOfStack() {
        if (this.parts.length > 0 && !this.lastPartIsExpression) {
            let lastpart = this.parts[this.parts.length - 1].p;
            if (lastpart.startsWith("s.push(") && lastpart.endsWith(");")) {
                this.parts[this.parts.length - 1].p = lastpart.substring(7, lastpart.length - 2);
                this.lastPartIsExpression = true;
                return;
            }
        } else {
            this.addPart("pop()");
            this.lastPartIsExpression = true;
        }
    }

    applyBinaryOperator(rightFragment: NFragment, operator: TokenType, resultType: NType) {

        let leftExpression = this.lastPartIsExpression ? this.parts.pop().p : "s.pop()"
        let rightExpression = rightFragment.lastPartIsExpression ? rightFragment.parts.pop().p : "s.pop()"


        this.parts = rightFragment.parts.concat(this.parts);
        let template = this.dataType.getOperatorExpression(operator, rightFragment.dataType);
        if (template != null && template.e != null) {

            if (template.condition != null) {
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

    ensureLastPartIsPushedToStack() {
        if (this.lastPartIsExpression) {
            this.parts.push(`s.push(${this.parts.pop()})`);
        }
    }

    addVirtualMethodCall(signature: string, parameterValues: NFragment[], returnType: NType) {
        // make shure "this"-Reference is on stack
        this.ensureLastPartIsPushedToStack();

        // push reference to thread
        this.parts.push("s.push(thread);");

        // push parameters
        for (let pv of parameterValues) {
            pv.ensureLastPartIsPushedToStack();
            this.parts = this.parts.concat(pv.parts);
        }

        this.parts.push(`thread.callVirtualMethod(${parameterValues.length},${signature});`)

        this.dataType = returnType;
        this.lastPartIsExpression = false;

    }


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

    /**
     * If program is a javascript function:
     */
    invoke: () => void; // with arbitrary signature...

    // only at compile time:
    fragments: NFragment[] = [];

    constructor(public module: Module, public symbolTable: NSymbolTable, public methodIdentifierWithClass: string) {

    }
}