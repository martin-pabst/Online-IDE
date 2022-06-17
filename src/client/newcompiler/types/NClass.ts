import { TokenType } from "../../compiler/lexer/Token.js";
import { NProgram } from "../compiler/NProgram.js";
import { NRuntimeObject, NStaticClassObject } from "../NRuntimeObject.js";
import { NMethodInfo, NAttributeInfo, NParameterlist, NVariable } from "./NAttributeMethod.js";
import { NPrimitiveType } from "./NewPrimitiveType.js";
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
    allExtendedImplementedTypes:Object = {};

    /**
     * Cache all types which contain a non-resolved generic parameter
     */
    typeCache: Map<string, NClassLike> = new Map();
    signature: string;

    getSignature(){
        if(this.signature == null) this.signature = this.getSignatureIntern();
        return this.signature;
    }

    abstract getSignatureIntern(): string;

    abstract containsUnresolvedGenericParameters():boolean;

    compute(operator: TokenType, otherType: NType, value1: any, value2?: any) {
        return "null" + value2;
    }

    equals(otherType: NType): boolean {
        return otherType == this;
    }

    abstract buildShallowGenericCopy(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike;

    extendsOtherClasslike(classlike: NClassLike): boolean{
        if(classlike instanceof NGenericParameter){
            for(let ext of classlike.extends){
                if(!this.extendsOtherClasslike(ext)) return false;
            }
        } else {
            return this.allExtendedImplementedTypes[classlike.identifier] != null;
        }
    }
    
    bindGenericParametersHelper(mapGenericParametersToActualParamters: Map<NClassLike, NClassLike>, genericParameters: NClassLike[]): NClassLike[] {
        let newList: NClassLike[] = [];
        let copyNecessary: boolean = false;
    
        for (let gp of genericParameters) {
            let newGP = gp.buildShallowGenericCopy(mapGenericParametersToActualParamters);
            newList.push(newGP);
            if(newGP != gp) copyNecessary = true;
        }

        return copyNecessary ? newList : genericParameters;
    }

    propagateGenericParameterTypesToMethods(oldMethodList: NMethodInfo[], typeMap: Map<NClassLike, NClassLike>): NMethodInfo[] {
        let newMethodList: NMethodInfo[] = [];
        for (let m of oldMethodList) {
            let newMethodNecessary: boolean = false;

            let newVariableTypes: NType[] = [];
            for (let parameter of m.parameterlist.parameters) {
                let type = parameter.type;
                if (!(type instanceof NClassLike)) {
                    newVariableTypes.push(type);
                    continue;
                }
                let newType = type.buildShallowGenericCopy(typeMap);
                if (newType != type) newMethodNecessary = true;
                newVariableTypes.push(newType);
            }

            let newReturnType = m.returnType;
            if (newReturnType != null && (newReturnType instanceof NClassLike)) {
                newReturnType = newReturnType.buildShallowGenericCopy(typeMap);
                if (newReturnType != m.returnType) newMethodNecessary = true;
            }

            /**
             * We need a prototyped copy of the old method as method.program is set later on 
             * only for the original NMethodInfo-object
             */
            if (newMethodNecessary) {
                let newMethod = m.getPrototypedCopy();
                newMethod.returnType = newReturnType;
                let parameterList: NVariable[] = [];
                for (let i = 0; i < m.parameterlist.parameters.length; i++) {
                    let oldParameter = m.parameterlist.parameters[i];
                    let newType = newVariableTypes[i];
                    if (oldParameter.type == newType) {
                        parameterList.push(oldParameter);
                    } else {
                        // we make a prototyped copy of the old variable as this saves memory and time
                        let newVariable = oldParameter.getPrototypedCopy();
                        newVariable.type = newType;
                        parameterList.push(newVariable);
                    }
                }
                newMethodList.push(newMethod);
            } else {
                newMethodList.push(m);
            }

        }
        
        return newMethodList;

    }

}

export class NClass extends NClassLike {
    
    extends: NClass;
    implements: (NInterface)[] = [];
    
    genericParameters: NClassLike[] = [];
    isParameterizedTypeOf: NClass = null;
    
    /**
     * If you bind a generic class like e.g. ArrayList<Integer>
     * then a new NClass-object will be instantiated which is a shallow copy of ArrayList class object. It
     * has a reference to it in field isParameterizedTypeOf and new values in fields
     * genericParameters, extends and implements. 
     * 
     * BUT: methodInfoList and attributeInfoList of new NClass-object point to methodInfoList and attributeInfoList 
     * of old NClass-object because of recursive Polymorphism.
     * 
     * Call propagateGenericParameterTypes() to populate methodInfoList and attributeInfoList.
     * 
     */
    private methodInfoList: NMethodInfo[] = [];
    private attributeInfoList: NAttributeInfo[] = [];

    isAbstract: boolean = false;

    staticMethodInfoList: NMethodInfo[] = [];
    staticAttributeInfoList: NAttributeInfo[] = [];
    initialStaticValues: any[] = [];

    //@ts-ignore
    runtimeObjectPrototype: NRuntimeObject = {};              // contains all methods and reference to class object; contains NOT __a 
    runtimeObjectPrototypeIsClass: boolean = false;     // true for system classes
    initialAttributeValues: any[];                      // used only for non-system classes
    firstAttributeIndex: number = null;                 // attributes prior to this index belong to base class


    setupAllExtendedImplementedList(visited: string[]):string {
        if(this.isParameterizedTypeOf != null) return;
        if(this.allExtendedImplementedTypes[this.identifier]) return;

        if(visited.find((s) => s == this.identifier) != null){
            return "Fehler: Mehrere Klassen sind mittels 'extens' zyklisch miteinander verkettet: " + visited.join("->");
        }
        
        this.allExtendedImplementedTypes[this.identifier] = true;
        this.implements.forEach((intf) => this.allExtendedImplementedTypes[intf.identifier] = true);

        if(this.extends != null){
            visited.push(this.identifier);
            let error = this.extends.setupAllExtendedImplementedList(visited);    
            Object.assign(this.allExtendedImplementedTypes, this.extends.allExtendedImplementedTypes);
            return error;
        }

        return null;
    }

    addGenericParameter(gp: NGenericParameter){
        this.genericParameters.push(gp);
        this.typeCache.set(gp.identifier, gp);
    }

    getStaticClassObject(): NStaticClassObject{
        let sco = new NStaticClassObject(this, this.initialStaticValues);
        for(let m of this.staticMethodInfoList){
            sco[m.signature] = m.program;
        }
        return sco;
    }

    containsUnresolvedGenericParameters(): boolean {
        if(this.genericParameters.length == 0) return false;
        for(let gp of this.genericParameters){
            if(gp.containsUnresolvedGenericParameters()) return true;
        }
        return false;
    }

    getSignatureIntern(): string {
        let s: string = "class " + this.identifier;
        if(this.genericParameters.length > 0){
            s += "<" + this.genericParameters.map((gp) => gp.getSignature()).join(", ") + ">"
        }
        return s;
    }

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }

    canCastTo(otherType: NType): boolean {
        if(otherType.identifier == "String") return true;
        if(otherType instanceof NClass){
            // TODO: think about generics...
            return this.isSubclassOf(otherType);
        }
        if(otherType instanceof NInterface){
            return this.implementsInterface(otherType);
        }
        return false;
    }

    isSubclassOf(otherType: NClass): boolean {
        let superClass = this.extends;
        while (superClass.identifier != "Object") {
            if (superClass == otherType) return true;
            superClass = superClass.extends;
        }
        return false;
    }

    implementsInterface(ifa: NInterface): boolean {

        for (let i of this.implements) {
            if (i.extendsOrIs(ifa)) return true;
        }

        return false;
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


    /**
     * If NLibraryCompiler or NTypeResolver encounters a generic variant of a class then it only instantiates a shallow copy of it 
     * (that is: without attributes and methods).
     * Only if subsequently the CodeGenerator encounters a method invocation or a attribute access for this type then it calls bindGenericParametersDeep
     * which then sets up attributeInfoList and methodInfoList for the generic type.
     */
     buildShallowGenericCopy(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {

        if(this.genericParameters.length == 0) return this;

        let newGenericParameterTypes = this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.genericParameters);
        if(newGenericParameterTypes == this.genericParameters) return this;

        let parameterizedType = new NClass(this.identifier);
        parameterizedType.isAbstract = this.isAbstract;

        parameterizedType.staticMethodInfoList = this.staticMethodInfoList;
        parameterizedType.staticAttributeInfoList = this.staticAttributeInfoList;
        parameterizedType.runtimeObjectPrototype = this.runtimeObjectPrototype;
        parameterizedType.runtimeObjectPrototypeIsClass = this.runtimeObjectPrototypeIsClass;
        parameterizedType.initialAttributeValues = this.initialAttributeValues;
        parameterizedType.allExtendedImplementedTypes = this.allExtendedImplementedTypes;

        parameterizedType.genericParameters = newGenericParameterTypes;

        parameterizedType.isParameterizedTypeOf = this;
        parameterizedType.usagePositions = this.usagePositions;

        return parameterizedType;

    }

    /**
     * If NTypeResolver encounters a generic variant of a class then it only instantiates a shallow copy of it without attributes and methods.
     * Only if subsequently the CodeGenerator encounters a method invocation or a attribute access for this type then it calls bindGenericParametersDeep
     * which then sets up attributeInfoList and methodInfoList for the generic type.
     */
    bindGenericParametersDeep() {

        let typeMap: Map<NClassLike, NClassLike> = new Map();
        for (let i = 0; i < this.genericParameters.length; i++) {
            typeMap.set(this.isParameterizedTypeOf.genericParameters[i], this.genericParameters[i]);
        }

        for (let a of this.isParameterizedTypeOf.attributeInfoList) {
            if (a.type instanceof NClassLike) {
                let newType = a.type.buildShallowGenericCopy(typeMap);
                if (newType != a.type) {
                    let newAtt = a.getCopy();
                    newAtt.type = newType;
                    this.attributeInfoList.push(newAtt);
                    continue;
                }
            }
            this.attributeInfoList.push(a);
        }

        this.methodInfoList = this.propagateGenericParameterTypesToMethods(this.isParameterizedTypeOf.methodInfoList, typeMap);

        let newExtends = this.extends;
        if (newExtends != null && (newExtends instanceof NClass)) {
            newExtends = <NClass>newExtends.buildShallowGenericCopy(typeMap);
        }

        this.implements = <NInterface[]>this.bindGenericParametersHelper(typeMap, this.implements);

    }




    toString() {
        let s: string = this.identifier;
        if (this.genericParameters.length > 0) {
            s += "<" + this.genericParameters.map((gp) => { return gp.toString() }).join(", ") + ">";
        }
        return s;
    }

    addMethod(mi: NMethodInfo) {
        if(mi.isStatic){
            this.staticMethodInfoList.push(mi);
        } else {
            this.methodInfoList.push(mi);
        }
    }

    addJavascriptMethod(identifier: string, parameters: NVariable[], returnType: NType, isStatic: boolean, invoke: any): NMethodInfo{
        let mi = new NMethodInfo();
        mi.identifier = identifier;
        mi.parameterlist = new NParameterlist(parameters);
        mi.returnType = returnType;
        mi.isStatic = isStatic;
        mi.program = new NProgram(null, null, this.identifier + "." + identifier);
        mi.invoke = invoke;
        mi.setupSignature();
        this.addMethod(mi);
        return mi;
    }

    addAttribute(ai: NAttributeInfo) {
        this.attributeInfoList.push(ai);
    }

    addStaticAttribute(ai: NAttributeInfo, initialValue: any){
        ai.isStatic = true;
        this.staticAttributeInfoList.push(ai);
        this.initialStaticValues.push(initialValue);
    }

    setupRuntimeObjectPrototype() {
        for(let m of this.methodInfoList){
            this.runtimeObjectPrototype[m.signature] = m.program;
        }
        this.runtimeObjectPrototype.__class = this;
    }

    computeFirstAttributeIndexAndInitialAttributeValues(){
        this.firstAttributeIndex = 0;
        this.initialAttributeValues = [];
        if(this.extends != null){
            if(this.extends.firstAttributeIndex == null) this.extends.computeFirstAttributeIndexAndInitialAttributeValues();
            this.firstAttributeIndex = this.extends.firstAttributeIndex + this.extends.attributeInfoList.length;
            this.initialAttributeValues = this.extends.initialAttributeValues.slice();
        }
        for(let ai of this.attributeInfoList){
            if(ai.type.isPrimitive()){
                this.initialAttributeValues.push((<NPrimitiveType>ai.type).initialValue);
            } else {
                this.initialAttributeValues.push(null);
            }
        }
    }

    /**
     * Call this for each class BEFORE resolving generic types
     * but after setting up method signatures
     */
    markVirtualMethodsInBaseClasses(){
        let baseClass: NClass = this.extends;
        while(baseClass != null){
            for(let mi of this.methodInfoList){
                for(let baseMi of baseClass.methodInfoList){
                    if(baseMi.signature == mi.signature){
                        baseMi.isVirtual = true;
                        break;
                    }
                }
            }
        }
    }

    clearVirtualMethodFlags(){
        this.methodInfoList.forEach(mi => mi.isVirtual = false);
    }

    

}

export class NInterface extends NClassLike {

    extendedInterfaces: NInterface[] = [];

    genericParameters: NClassLike[] = [];
    isParameterizedTypeOf: NInterface = null;

    methodInfoList: NMethodInfo[] = [];


    setupAllExtendedImplementedList(visited: string[]):string {
        if(this.isParameterizedTypeOf != null) return;

        if(this.allExtendedImplementedTypes[this.identifier]) return; // nothing to do
        
        if(visited.find((s) => s == this.identifier) != null){
            return "Fehler: Mehrere Interfaces sind mittels 'extens' zyklisch miteinander verkettet: " + visited.join("->");
        }

        this.allExtendedImplementedTypes[this.identifier] = true;

        visited.push(this.identifier);

        for(let otherIntf of this.extendedInterfaces){
            let error = otherIntf.setupAllExtendedImplementedList(visited.slice());
            Object.assign(this.allExtendedImplementedTypes, otherIntf.allExtendedImplementedTypes);
            if(error != null) return error;            
        }

        return null;
    }

    addGenericParameter(gp: NGenericParameter){
        this.genericParameters.push(gp);
        this.typeCache.set(gp.identifier, gp);
    }

    containsUnresolvedGenericParameters(): boolean {
        if(this.genericParameters.length == 0) return false;
        for(let gp of this.genericParameters){
            if(gp.containsUnresolvedGenericParameters()) return true;
        }
        return false;
    }

    getSignatureIntern(): string {
        let s: string = "class " + this.identifier;
        if(this.genericParameters.length > 0){
            s += "<" + this.genericParameters.map((gp) => gp.getSignature()).join(", ") + ">"
        }
        return s;
    }

    getCastExpression(otherType: NType): NExpression {
        return { e: `thread.cast($1,"${otherType.identifier}")` }
    }
    castTo(otherType: NType, value: any) {
        return value;
    }

    canCastTo(otherType: NType): boolean {
        if(otherType.identifier == "String") return true;
        if(otherType instanceof NInterface){
            return this.extendsOrIs(otherType);
        }
        return false;
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

    extendsOrIs(ifa: NInterface): boolean {
        let otherInterface: NInterface = ifa;
        if (this == ifa) return true;
        for (let ifn of ifa.extendedInterfaces) {
            if (this.extendsOrIs(ifn)) return true;
        }
        return false;
    }

    public debugOutput(value: any, maxLength?: number): string {
        // Todo: Aufruf der toString-Methode
        return "[" + this.identifier + "]";
    }

    toString() {
        let s: string = this.identifier;
        if (this.genericParameters.length > 0) {
            s += "<" + this.genericParameters.map((gp) => { return gp.toString() }).join(", ") + ">";
        }
        return s;
    }

    buildShallowGenericCopy(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {

        if(this.genericParameters.length == 0) return this;

        let parameterizedType = new NInterface(this.identifier);
        parameterizedType.usagePositions = this.usagePositions;
        parameterizedType.genericParameters = this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.genericParameters);
        parameterizedType.allExtendedImplementedTypes = this.allExtendedImplementedTypes;

        parameterizedType.isParameterizedTypeOf = this;

        return parameterizedType;

    }

    propagateGenericParameterTypesToAttributesAndMethods() {

        let typeMap: Map<NClassLike, NClassLike> = new Map();
        for (let i = 0; i < this.genericParameters.length; i++) {
            typeMap.set(this.isParameterizedTypeOf.genericParameters[i], this.genericParameters[i]);
        }

        this.methodInfoList = this.propagateGenericParameterTypesToMethods(this.isParameterizedTypeOf.methodInfoList, typeMap);

        this.extendedInterfaces = <NInterface[]>this.bindGenericParametersHelper(typeMap, this.extendedInterfaces);

    }

    addMethod(mi: NMethodInfo) {
        this.methodInfoList.push(mi);
    }

}

export class NGenericParameter extends NClassLike {

    extends: NClassLike[] = [];
    super: NClass = null;

    constructor(identifier: string, public isBound: boolean = false) {
        super(identifier);
    }

    containsUnresolvedGenericParameters(): boolean {
        return true;
    }

    getSignatureIntern(): string {
        return this.identifier;
    }

    buildShallowGenericCopy(mapOldToNewGenericParameters: Map<NClassLike, NClassLike>): NClassLike {

        let newGP = <NGenericParameter>mapOldToNewGenericParameters.get(this);
        if (newGP != null) return newGP;

        // ?!?
        // let parameterizedType = new NGenericParameter(this.identifier);
        // parameterizedType.extends = this.bindGenericParametersHelper(mapOldToNewGenericParameters, this.extends);

        // let newSuper = this.super;
        // if (newSuper != null) {
        //     newSuper = <NClass>newSuper.buildShallowGenericCopy(mapOldToNewGenericParameters);
        // }

        // parameterizedType.super = newSuper;

        // return parameterizedType;

    }


    toString(): string {
        let s = this.identifier ? this.identifier + " " : "";
        if (this.extends.length > 0) {
            s += " extends " + this.extends.map((c) => { c.toString() }).join(" & ") + " ";
        }
        if (this.super != null) {
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


}

