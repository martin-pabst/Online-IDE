import { Parameterlist, Variable } from "src/client/compiler/types/Types.js";
import { TokenType } from "../../compiler/lexer/Token.js";
import { NUnknownClasslike } from "../librarycompiler/UnknownClasslike.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NMethodInfo, NAttributeInfo, NParameterlist, NVariable } from "./NAttributeMethod.js";
import { NExpression, NType } from "./NewType.js";
import { NVisibility } from "./NVisibility.js";


export abstract class NClassLike extends NType {

    visibility: NVisibility = NVisibility.public;

    /**
     * To check types at runtime when casting we store all 
     * extended/implemented Types as string without 
     * generic information. 
     * E.g. for ArrayList this would be: ["Object", "AbstractCollection", "AbstractList", "Serializable", "Cloneable", "Iterable", "List"]
     */
    allExtendedImplementedTypes: string[] = [];

    abstract getAllMethods(): NMethodInfo[];

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return "null" + value2;
    }

    equals(otherType: NType): boolean {
        return otherType == this;
    }

    abstract bindGenericParameters(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike;

    bindGenericParametersHelper(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>, classLikes: NClassLike[], newList: NClassLike[]): boolean {
        let copyNecessary: boolean = false;

        for(let gp of classLikes){

            if(!(gp instanceof NUnknownClasslike)){
                let newGP = gp.bindGenericParameters(mapOldToNewGenericParameters);
                if(newGP != gp) copyNecessary = true;
                newList.push(newGP);
            } else {
                newList.push(gp);
            }
        }

        return copyNecessary;
    }

    propagateGenericParameterTypesToMethods(oldMethodList: NMethodInfo[], newMethodList: NMethodInfo[], typeMap: Map<NClassLike, NClassLike>){
        for(let m of oldMethodList){
            let newMethodNecessary: boolean = false;
            let newVariableTypes: NType[] = [];
        
            for(let parameter of m.parameterlist.parameters){
                let type = parameter.type;
                if(!(type instanceof NClassLike)){
                    newVariableTypes.push(type);
                    continue;
                }
                let newType = type.bindGenericParameters(typeMap);
                if(newType != type) newMethodNecessary = true;
                newVariableTypes.push(newType);
            }

            let newReturnType = m.returnType;
            if(newReturnType != null && (newReturnType instanceof NClassLike)){
                newReturnType = newReturnType.bindGenericParameters(typeMap);
                if(newReturnType != m.returnType) newMethodNecessary = true;
            }

            if(newMethodNecessary){
                let newMethod = m.getCopy();
                newMethod.returnType = newReturnType;
                let parameterList: NVariable[] = [];
                for(let i = 0; i < m.parameterlist.parameters.length; i++){
                    let oldParameter = m.parameterlist.parameters[i];
                    let newType = newVariableTypes[i];
                    if(oldParameter.type == newType){
                        parameterList.push(oldParameter);
                    } else {
                        let newVariable = oldParameter.getCopy();
                        newVariable.type = newType;
                        parameterList.push(newVariable);
                    }
                }
                newMethodList.push(newMethod);
            } else {
                newMethodList.push(m);
            }

        }

    }
    
}

export class NClass extends NClassLike {

    extends: NClass | NUnknownClasslike;
    implements: (NInterface | NUnknownClasslike)[] = [];

    genericParameters: NClassLike[] = [];
    isParameterizedTypeOf: NClass = null;

    /**
     * If you bind a generic class like e.g. ArrayList<Integer>
     * then a new NClass-object will be instantiated which a shallow copy of ArrayList class object. It
     * has a reference to it in field isParameterizedTypeOf and new values in fields
     * genericParameters, extends and implements. 
     * 
     * BUT: methodInfoList and attributeInfoList will at first be set to null because
     *      of recursive Polymorphism.
     * 
     * Call propagateGenericParameterTypes() to populate methodInfoList and attributeInfoList.
     * 
     */
    private methodInfoList: NMethodInfo[] = [];
    private attributeInfoList: NAttributeInfo[] = [];
    genericParametersPropagated: boolean = true;

    isAbstract: boolean = false;

    staticMethodInfoList: NMethodInfo[] = [];
    staticAttributeInfoList: NAttributeInfo[] = [];

    runtimeObjectPrototype: NRuntimeObject;              // contains all methods and reference to class object; contains NOT __a 
    runtimeObjectPrototypeIsClass: boolean = false;     // true for system classes
    initialAttributeValues: any[];                      // used only vor non-system classes

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }

    canCastTo(otherType: NType): boolean {
        // TODO        
    }

    castTo(otherType: NType, value: any) {
        return value;
    }

    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }

    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

    bindGenericParameters(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {
    
        let copyClassNecessary: boolean = false;

        let newGenericParameterTypes: NClassLike[] = [];
        copyClassNecessary = copyClassNecessary || this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.genericParameters, newGenericParameterTypes);

        let newExtends = this.extends;
        if(newExtends != null && (newExtends instanceof NClass)){
            newExtends = <NClass>newExtends.bindGenericParameters(mapOldToNewGenericParameters);
            if(newExtends != this.extends){
                copyClassNecessary = true;
            }
        }

        let newImplements: NInterface[] = [];
        copyClassNecessary = copyClassNecessary || this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.implements, newImplements);

        if(!copyClassNecessary){
            return this;
        }

        let parameterizedType = new NClass(this.identifier);
        parameterizedType.isAbstract = this.isAbstract;
        parameterizedType.staticMethodInfoList = this.staticMethodInfoList;
        parameterizedType.staticAttributeInfoList = this.staticAttributeInfoList;
        parameterizedType.runtimeObjectPrototype = this.runtimeObjectPrototype;
        parameterizedType.runtimeObjectPrototypeIsClass = this.runtimeObjectPrototypeIsClass;
        parameterizedType.initialAttributeValues = this.initialAttributeValues;

        parameterizedType.genericParameters = newGenericParameterTypes;
        parameterizedType.extends = newExtends;
        parameterizedType.implements = newImplements;

        parameterizedType.isParameterizedTypeOf = this;
        parameterizedType.genericParametersPropagated = false;

        return parameterizedType;

    }

    propagateGenericParameterTypesToAttributesAndMethods() {
        
        let typeMap: Map<NClassLike, NClassLike> = new Map();
        for(let i = 0; i < this.genericParameters.length; i++){
            typeMap.set(this.isParameterizedTypeOf.genericParameters[i], this.genericParameters[i]);
        }

        for(let a of this.isParameterizedTypeOf.attributeInfoList){
            if(a.type instanceof NClassLike){
                let newType = a.type.bindGenericParameters(typeMap);
                if(newType != a.type){
                    let newAtt = a.getCopy();
                    newAtt.type = newType;
                    this.attributeInfoList.push(newAtt);
                    continue;
                }
            }
            this.attributeInfoList.push(a);
        }

        this.methodInfoList = [];
        this.propagateGenericParameterTypesToMethods(this.isParameterizedTypeOf.methodInfoList, this.methodInfoList, typeMap);
        this.genericParametersPropagated = true;
    }




    toString(){
        let s: string = this.identifier;
        if(this.genericParameters.length > 0){
            s += "<" + this.genericParameters.map((gp) => {return gp.toString()}).join(", ") + ">";
        }
        return s;
    }

    addMethod(mi: NMethodInfo){
        this.methodInfoList.push(mi);
    }

    addAttribute(ai: NAttributeInfo){
        this.attributeInfoList.push(ai);
    }


}

export class NInterface extends NClassLike {

    extends: (NInterface|NUnknownClasslike)[];

    genericParameters: NClassLike[] = [];
    isParameterizedTypeOf: NInterface = null;

    methodInfoList: NMethodInfo[] = [];
    genericParametersPropagated: boolean = true;
    

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

    toString(){
        let s: string = this.identifier;
        if(this.genericParameters.length > 0){
            s += "<" + this.genericParameters.map((gp) => {return gp.toString()}).join(", ") + ">";
        }
        return s;
    }

    bindGenericParameters(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {
    
        let copyInterfaceNecessary: boolean = false;

        let newGenericParameterTypes: NClassLike[] = [];
        copyInterfaceNecessary = copyInterfaceNecessary || this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.genericParameters, newGenericParameterTypes);

        let newExtends: NInterface[] = [];
        copyInterfaceNecessary = copyInterfaceNecessary || this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.extends, newExtends);

        if(!copyInterfaceNecessary){
            return this;
        }

        let parameterizedType = new NInterface(this.identifier);

        parameterizedType.genericParameters = newGenericParameterTypes;
        parameterizedType.extends = newExtends;

        parameterizedType.isParameterizedTypeOf = this;
        parameterizedType.genericParametersPropagated = false;

        return parameterizedType;

    }

    propagateGenericParameterTypesToAttributesAndMethods() {
        
        let typeMap: Map<NClassLike, NClassLike> = new Map();
        for(let i = 0; i < this.genericParameters.length; i++){
            typeMap.set(this.isParameterizedTypeOf.genericParameters[i], this.genericParameters[i]);
        }

        this.methodInfoList = [];
        this.propagateGenericParameterTypesToMethods(this.isParameterizedTypeOf.methodInfoList, this.methodInfoList, typeMap);
        this.genericParametersPropagated = true;

    }

    addMethod(mi: NMethodInfo){
        this.methodInfoList.push(mi);
    }

}

export class NGenericParameter extends NClassLike {

    extends: (NClassLike | NInterface)[] = [];
    super: NClass | NUnknownClasslike = null;

    constructor(identifier: string, type?: (NClassLike | NInterface), public isBound: boolean = false){
        super(identifier);
        if(type != null){
            this.extends.push(type);
        }
    }

    bindGenericParameters(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {
    
        let copyNecessary: boolean = false;

        let newGP = <NGenericParameter>mapOldToNewGenericParameters.get(this);
        if(newGP != null) return newGP;

        let newExtends: NClassLike[] = [];
        copyNecessary = copyNecessary || this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.extends, newExtends);

        let newSuper = this.super;
        if(newSuper != null && !(newSuper instanceof NUnknownClasslike)){
            newSuper = <NClass>newSuper.bindGenericParameters(mapOldToNewGenericParameters);
            if(newSuper != this.super) copyNecessary = true;
        }

        if(!copyNecessary){
            return this;
        }

        let parameterizedType = new NGenericParameter(this.identifier);

        parameterizedType.extends = newExtends;
        parameterizedType.super = newSuper;

        return parameterizedType;

    }


    toString(): string {
        let s = this.identifier? this.identifier + " " : "";
        if(this.extends.length > 0){
            s += " extends " + this.extends.map((c)=>{c.toString()}).join(" & ") + " ";
        }
        if(this.super != null){
            s += " super " + this.super.toString();
        }
        return s;
    }

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }
    castTo(otherType: NType, value: any) {
        return value;
    }
    getOperatorExpression(operator: TokenType, otherType?: NType): NExpression {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            // TODO: Aufruf von toString richtig compilieren
            return { e: '($1 == null ? "null" : $1.toString()) + $2' }
        }
        return null;
    }
    getOperatorResultType(operator: TokenType, otherType: NType): NType {
        if (operator == TokenType.plus && otherType.identifier == "String") {
            return otherType;
        }
        return null;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    getAllMethods(): NMethodInfo[]{
        // TODO
        return null;
    }

}

