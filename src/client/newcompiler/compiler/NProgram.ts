import { TextPosition } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js"
import { NThread } from "../interpreter/NThreadPool.js";
import { NSymbolTable } from "./NSymbolTable.js";


export type NHelper = any;

export type JumpDestination = {
    placeholder: string;
    destination: NStep;
}

export type NStep = {
    // returns new programposition
    run?: (stack: any, stackBase: number, helper: NHelper, thread: NThread ) => number;
    codeAsString: string;
    position: TextPosition;
    isBreakpoint?: boolean;
    correspondingStepInOtherStepmode?: NStep;

    // Used during compilation:
    isOnlyJumpDestination?: boolean;
    isInlineExpression?: boolean;

}

export type NProgram = {
    module: Module;
    
    numberOfParameters: number;
    
    /**
     * If program is compiled:
     */
    stepsSingle: NStep[];
    stepsMultiple: NStep[];
    numberOfLocalVariables: number;
    
    methodIdentifierWithClass: string;
    helper: NHelper[];   // (function or Program or class)[]

    // to initially compute stack-base-offset:
    symbolTable: NSymbolTable;

    /**
     * If program is a javascript function:
     */
    invoke: () => void; // with arbitrary signature...


}