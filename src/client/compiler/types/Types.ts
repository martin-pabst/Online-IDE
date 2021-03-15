import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { TextPosition, TokenType } from "../lexer/Token.js";
import { Module } from "../parser/Module.js";
import { Program } from "../parser/Program.js";
import { ArrayType } from "./Array.js";
import { Visibility, TypeVariable } from "./Class.js";

export type UsagePositions = Map<Module, TextPosition[]>;

export type TextPositionWithModule = {
    module: Module,
    position: TextPosition,
    monacoModel?: monaco.editor.ITextModel
}

export type CastInformation = {
    automatic: boolean,
    needsStatement: boolean
}

export abstract class Type {

    public onlyFirstPass = false;

    public usagePositions: UsagePositions = new Map();
    public declaration: TextPositionWithModule;

    public identifier: string;
    public documentation: string = "";

    constructor() {
    }

    public abstract getResultType(operation: TokenType, secondOperandType?: Type): Type;

    public abstract compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any;

    public abstract canCastTo(type: Type): boolean;

    public abstract castTo(value: Value, type: Type): Value;

    public abstract equals(type: Type): boolean;

    public toTokenType(): TokenType {
        return null;
    };

    public abstract debugOutput(value: Value, maxLength?: number): string;

    clearUsagePositions() {
        this.usagePositions = new Map();
    }

}

export abstract class PrimitiveType extends Type {

    public initialValue: any = null;

    public description: string = "";

    protected operationTable: { [operation: number]: { [typename: string]: Type } }

    protected canCastToMap: { [type: string]: CastInformation };

    public equals(type: Type): boolean {
        return type == this;
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {

        let opTypeMap = this.operationTable[operation];

        if (opTypeMap == null) {
            return null; // Operation not possible
        }

        if (secondOperandType != null) {
            return opTypeMap[secondOperandType.identifier];
        }

        return opTypeMap["none"];

    }

    public canCastTo(type: Type): boolean {
        return this.canCastToMap[type.identifier] != null;
    }

    public getCastInformation(type: Type): CastInformation {
        return this.canCastToMap[type.identifier];
    }

}

export class Attribute {

    onlyFirstPass: boolean = false;

    identifier: string;

    index: number;

    type: Type;
    isStatic: boolean;
    isFinal: boolean;
    isTransient: boolean;
    visibility: Visibility;
    updateValue: (value: Value) => void;
    usagePositions: UsagePositions;
    declaration: TextPositionWithModule;
    documentation: string;
    annotation?: string;

    constructor(name: string, type: Type, updateValue: (value: Value) => void,
        isStatic: boolean, visibility: Visibility, isFinal: boolean, documentation?: string) {
        this.identifier = name;
        this.type = type;
        this.updateValue = updateValue;
        this.isStatic = isStatic;
        this.visibility = visibility;
        this.isFinal = isFinal;
        this.usagePositions = new Map();
        this.documentation = documentation;
    }
}

export class Method extends Type {

    onlyFirstPass: boolean = false;

    visibility: Visibility;

    isAbstract: boolean;
    isStatic: boolean;
    isConstructor: boolean = false;
    isVirtual: boolean = false; // true, if child class has method with same signature

    parameterlist: Parameterlist;
    returnType: Type;
    annotation?: string;

    invoke?: (parameters: Value[]) => any;  // only for system functions
    program?: Program;

    reserveStackForLocalVariables: number = 0;

    hasGenericTypes: boolean;

    genericTypeMap: { [identifier: string]: Type } = null;

    public signature: string;

    hasEllipsis(): boolean {
        if(this.parameterlist.parameters.length == 0) return false;
        return this.parameterlist.parameters[this.parameterlist.parameters.length - 1].isEllipsis;
    }


    getParameterType(index: number): Type {
        return this.parameterlist.parameters[index].type;
    }

    getParameter(index: number): Variable {
        return this.parameterlist.parameters[index];
    }

    getReturnType(): Type {
        return this.returnType;
    }

    getParameterCount() {
        return this.parameterlist.parameters.length;
    }

    getParameterList(): Parameterlist {
        return this.parameterlist;
    }



    constructor(name: string, parameterlist: Parameterlist, returnType: Type,
        invokeOrAST: ((parameters: Value[]) => any) | Program,
        isAbstract: boolean, isStatic: boolean, documentation?: string, isConstructor: boolean = false) {
        super();
        this.identifier = name;
        this.parameterlist = parameterlist;
        this.returnType = returnType;
        this.isAbstract = isAbstract;
        this.isStatic = isStatic;
        this.visibility = 0;
        this.documentation = documentation;
        this.isConstructor = isConstructor;

        if (invokeOrAST != null) {
            if (typeof invokeOrAST == "function") {
                this.invoke = invokeOrAST;
            } else {
                this.program = invokeOrAST;
                invokeOrAST.method = this;
            }
        }

        this.signature = name + parameterlist.id;

        for (let p of parameterlist.parameters) {
            if (p["isTypeVariable"] == true) {
                this.hasGenericTypes = true; break;
            }
        }

        this.hasGenericTypes = this.hasGenericTypes || (this.returnType != null && this.returnType["isTypeVariable"] == true);
    }

    getSignatureWithReturnParameter(){
        if(this.returnType != null){
            return this.returnType.identifier + " " + this.signature;
        } else {
            return "void " + this.signature;
        }
    }

    getCompletionLabel() {

        let label = "";

        if (this.returnType != null && this.returnType.identifier != "void") {
            label += getTypeIdentifier(this.returnType) + " ";
        }

        label += this.identifier + "(";

        let parameters = this.parameterlist.parameters;
        for (let i = 0; i < parameters.length; i++) {

            let p = parameters[i];
            if(p.isEllipsis){
                let arrayType: ArrayType = <any>p.type;
                label += getTypeIdentifier(arrayType.arrayOfType) + "... " + p.identifier;
            } else {
                label += getTypeIdentifier(p.type) + " " + p.identifier;
            }

            if (i < parameters.length - 1) {
                label += ", ";
            }

        }

        label += ")";

        return label;
    }


    getCompletionSnippet(leftBracketAlreadyThere: boolean) {

        if (leftBracketAlreadyThere) return this.identifier + "($0";

        let snippet = "";

        snippet += this.identifier + "(";

        let isVoidReturn = this.returnType == null || this.returnType.identifier == "void";
        let isVoidReturnDelta = isVoidReturn ? 1 : 0;

        let parameters = this.parameterlist.parameters;
        for (let i = 0; i < parameters.length; i++) {

            let p = parameters[i];
            snippet += "${" + ((i + 1) % (parameters.length + isVoidReturnDelta)) + ":" + p.identifier + "}";

            if (i < parameters.length - 1) {
                snippet += ", ";
            }

        }

        snippet += ")";

        if(this.returnType == null || this.returnType.identifier == "void"){
            snippet += ";$0";
        }

        return snippet;
    }

    public debugOutput(value: Value): string {
        return "";
    }

    public equals(type: Type): boolean {
        return type == this;
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {
        return null;
    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value): any {
        return null;
    }

    public canCastTo(type: Type): boolean {
        return false;
    }

    public castTo(value: Value, type: Type): Value { return value }


}

export class Parameterlist {

    id: string;

    parameters: Variable[];

    constructor(parameters: Variable[]) {
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

export type Variable = {
    identifier: string,
    type: Type,
    stackPos?: number;
    usagePositions: UsagePositions,
    declaration: TextPositionWithModule,
    isFinal: boolean,
    isEllipsis?: boolean,
    value?: Value // only for variables on heap,
    declarationError?: any,     // if v.declarationError != null then variable has been used before initialization.
    usedBeforeInitialization?: boolean,
    initialized?: boolean
}

export type Heap = { [identifier: string]: Variable };

export type Value = {
    type: Type;
    value: any;
    updateValue?: (value: Value) => void;
    object?: RuntimeObject;
}


export function getTypeIdentifier(type: Type): string {
    if(type["typeVariables"]){
        if(type["typeVariables"].length > 0){
            let s: string = (type["isTypeVariable"] ? (type.identifier + " extends " + type["isGenericVariantFrom"]?.identifier) : type.identifier) 
            + "<";
               s += type["typeVariables"].map(tv => getTypeIdentifier(tv.type)).join(", ");
            return s + ">";
        }
    }

    return type["isTypeVariable"] ? (type.identifier + " extends " + type["isGenericVariantFrom"]?.identifier) : type.identifier;
}
