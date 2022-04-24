import { UsagePositions, TextPositionWithModule } from "src/client/compiler/types/Types.js";
import { NProgram } from "../compiler/NProgram.js";
import { NType } from "./NewType.js";
import { NVisibility } from "./NVisibility.js";

export class NMethodInfo {
    usagePositions: UsagePositions = new Map();
    declaration: TextPositionWithModule;

    identifier: string;
    documentation: string = "";
    signature: string;

    visibility: NVisibility = NVisibility.public;
    isAbstract: boolean = false;
    isStatic: boolean = false;
    isConstructor: boolean = false;
    isVirtual: boolean = false; // true, if child class has method with same signature

    parameterlist: NParameterlist;
    returnType?: NType;
    annotation?: string;

    program?: NProgram;
    expression?: string;    // e.g. "$this.charAt($1)" 

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

export class NVariable {
    stackPos?: number = -1;
    usagePositions: UsagePositions = new Map();
    declaration: TextPositionWithModule = null;
    isFinal: boolean = false;
    isEllipsis?: boolean = false;
    usedBeforeInitialization?: boolean = false;
    initialized?: boolean = false;

    constructor(public identifier: string, public type: NType){

    }
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