import { TextPosition } from "../compiler/lexer/Token.js";
import { Module } from "../compiler/parser/Module.js"
import { NThread } from "./NThreadPool.js";
import { NSymbolTable } from "./NSymbolTable.js";


export type NHelper = any;

export type NStep = {
    // returns new programposition
    run: (stack: any, stackBase: number, helper: NHelper, thread: NThread ) => number;
    codeAsString: string;
    position: TextPosition;
    isBreakpoint?: boolean;
    correspondingStepInOtherStepmode?: NStep;
}

export type NProgram = {
    module: Module;
    stepsSingle: NStep[];
    stepsMultiple: NStep[];

    methodIdentifierWithClass: string;
    helper: NHelper[];   // (function or Program or class)[]

    // to initially compute stack-base-offset:
    numberOfParamters: number;
    numberOfLocalVariables: number;
    symbolTable: NSymbolTable;
}