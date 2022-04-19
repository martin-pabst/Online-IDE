import { Token, TokenType } from "../compiler/lexer/Token.js";
import { Module } from "../compiler/parser/Module.js";
import { TextPositionWithModule, UsagePositions } from "../compiler/types/Types.js";
import { NProgram } from "./NProgram.js";

export enum NVisibility { public, protected, private };

export type NExpression = {
    condition?: string;
    errormessage?: string;
    e: string; // Expression
}

export abstract class NType {

    public usagePositions: UsagePositions = new Map();
    public declaration: TextPositionWithModule;

    public identifier: string;
    public documentation: string = "";

    abstract getCastExpression(otherType: NType): NExpression;        // e.g. Math.floor($1)
    abstract castTo(otherType: NType, value: any): any;

    canCastTo(otherType: NType): boolean {
        return this.getCastExpression(otherType) != null;
    }

    abstract getOperatorExpression(operator: TokenType, otherType?: NType): NExpression;       // e.g. $1 + $2
    abstract getOperatorResultType(operator: TokenType, otherType: NType): NType;
    abstract compute(operator: TokenType, otherType: NType, value1: any, value2?: any): any;

    abstract equals(otherType: NType): boolean;

    public abstract debugOutput(value: any, maxLength?: number): string;

    public isPrimitive(): boolean {
        return false;
    }

}

export class NMethodInfo {
    usagePositions: UsagePositions = new Map();
    declaration: TextPositionWithModule;

    identifier: string;
    documentation: string = "";
    signature: string;

    isAbstract: boolean = false;
    isStatic: boolean = false;
    isConstructor: boolean = false;
    isVirtual: boolean = false; // true, if child class has method with same signature

    parameterlist: NParameterlist;
    returnType?: NType;
    annotation?: string;

    program?: NProgram;

    reserveStackForLocalVariables: number = 0;

    implements(m: NMethodInfo): boolean {
        if(this.identifier != m.identifier) return false;
        if(this.returnType == null || this.returnType.identifier == "void"){
            if(m.returnType != null && m.returnType.identifier != "void") return false;
        } else {

            if(m.returnType.isPrimitive()){
                if(m.returnType != this.returnType) {
                    return false;
                }
            } else if(!this.returnType.canCastTo(m.returnType)){
                return false;
            }
        }

        if(this.parameterlist.parameters.length != m.parameterlist.parameters.length) return false;

        for(let i = 0; i < this.parameterlist.parameters.length; i++){
            let myParameter = this.parameterlist.parameters[i];
            let mParameter = m.parameterlist.parameters[i];

            if(mParameter.type.isPrimitive()){
                if(mParameter.type != myParameter.type){
                    return false;
                }
            } else if(!mParameter.type.canCastTo(myParameter.type)) return false;
        }

        return true;
    }

    hasEllipsis(): boolean {
        if(this.parameterlist.parameters.length == 0) return false;
        return this.parameterlist.parameters[this.parameterlist.parameters.length - 1].isEllipsis;
    }


    getParameterType(index: number): NType {
        return this.parameterlist.parameters[index].type;
    }

    getParameter(index: number): NVariable {
        return this.parameterlist.parameters[index];
    }


}

export class NParameterlist {
    id: string;

    parameters: NVariable[];

    constructor(parameters: NVariable[]) {
        this.parameters = parameters;
        this.computeId();
    }

    computeId() {
        this.id = "(";
        let i = 0;
        while (i < this.parameters.length) {
            this.id += this.parameters[i].type.identifier;
            if (i < this.parameters.length - 1) {
                this.id += ", ";
            }
            i++;
        }
        this.id += ")";
    }
}

export type NVariable = {
    identifier: string,
    type: NType,
    stackPos?: number;
    usagePositions: UsagePositions,
    declaration: TextPositionWithModule,
    isFinal: boolean,
    isEllipsis?: boolean,
    value?: any // only for variables on heap,
    declarationError?: any,     // if v.declarationError != null then variable has been used before initialization.
    usedBeforeInitialization?: boolean,
    initialized?: boolean

}

export class NAttributeInfo {
    identifier: string;

    index: number;

    type: NType;
    isStatic: boolean;
    isFinal: boolean;
    isTransient: boolean;
    visibility: NVisibility;
    usagePositions: UsagePositions;
    declaration: TextPositionWithModule;
    documentation: string;
    annotation?: string;

    constructor(name: string, type: NType, isStatic: boolean, visibility: NVisibility, 
        isFinal: boolean, documentation?: string) {
        this.identifier = name;
        this.type = type;
        this.isStatic = isStatic;
        this.visibility = visibility;
        this.isFinal = isFinal;
        this.usagePositions = new Map();
        this.documentation = documentation;
    }

}