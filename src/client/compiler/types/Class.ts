import { ProgramStackElement } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { TextPosition, TokenType } from "../lexer/Token.js";
import { LabelManager } from "../parser/LabelManager.js";
import { Module } from "../parser/Module.js";
import { Program } from "../parser/Program.js";
import { SymbolTable } from "../parser/SymbolTable.js";
import { ArrayType } from "./Array.js";
import { nullType, stringPrimitiveType, voidPrimitiveType } from "./PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, PrimitiveType, Type, Value } from "./Types.js";


export enum Visibility { public, protected, private };

var booleanPrimitiveTypeCopy: any;
export function setBooleanPrimitiveTypeCopy(bpt: Type) {
    booleanPrimitiveTypeCopy = bpt;
}

// Used for class diagrams:
export type CompostionData = { klass: Klass | Interface, multiples: boolean, identifier: string };

/**
 * For Generic types
 */
export type TypeVariable = {
    identifier: string;
    type: Klass;
    scopeFrom: TextPosition;
    scopeTo: TextPosition;
}


export class Klass extends Type {

    // for Generics:
    typeVariables: TypeVariable[] = [];
    isGenericVariantFrom: Klass;
    isTypeVariable: boolean = false;
    typeVariablesReady: boolean = true;

    private static dontInheritFrom: string[] = ["Integer", "Float", "Double", "Boolean", "Character", "String", "Shape", "FilledShape"];

    baseClass: Klass;
    firstPassBaseClass: string;

    staticClass: StaticClass;

    module: Module;

    visibility: Visibility;

    implements: Interface[] = [];
    firstPassImplements: string[] = [];

    isAbstract: boolean = false;
    isFinal: boolean = false;

    attributeInitializationProgram: Program;

    postConstructorCallbacks: ((r: RuntimeObject) => void)[] = null;

    public methods: Method[] = [];
    private methodMap: Map<string, Method> = new Map();

    public attributes: Attribute[] = [];
    public attributeMap: Map<string, Attribute> = new Map();
    public numberOfAttributesIncludingBaseClass: number = null;

    public symbolTable: SymbolTable;

    constructor(identifier: string, module: Module, documentation?: string) {
        super();

        this.documentation = documentation;

        this.identifier = identifier;
        this.module = module;
        this.visibility = Visibility.public;

        this.staticClass = new StaticClass(this);

        this.attributeInitializationProgram = {
            method: null,
            module: this.module,
            statements: [],
            labelManager: null
        };

        this.attributeInitializationProgram.labelManager = new LabelManager(this.attributeInitializationProgram);

    }

    setupAttributeIndicesRecursive() {
        if (this.baseClass != null && this.baseClass.numberOfAttributesIncludingBaseClass == null) {
            this.baseClass.setupAttributeIndicesRecursive();
        }
        let numberOfAttributesInBaseClasses = this.baseClass == null ? 0 : this.baseClass.numberOfAttributesIncludingBaseClass;

        for (let a of this.attributes) {
            a.index = numberOfAttributesInBaseClasses++;
            // console.log(this.identifier + "." + a.identifier+ ": " + a.index);
        }

        this.numberOfAttributesIncludingBaseClass = numberOfAttributesInBaseClasses;

    }

    hasAttributes() {
        return this.numberOfAttributesIncludingBaseClass > 0;
    }


    getNonGenericClass(): Klass {
        let k: Klass = this;
        while (k.isGenericVariantFrom != null) k = k.isGenericVariantFrom;
        return k;
    }

    getNonGenericIdentifier(): string {
        let k: Klass = this;
        while (k.isGenericVariantFrom != null) k = k.isGenericVariantFrom;
        return k.identifier;
    }

    implementsInterface(i: Interface): boolean {
        let klass: Klass = this;
        while (klass != null) {
            for (let i1 of klass.implements) {
                if (i1.getThisOrExtendedInterface(i.getNonGenericIdentifier()) != null) return true;
            }
            klass = klass.baseClass;
        }

        return false;

    }

    getImplementedInterface(identifier: string): Interface {
        let klass: Klass = this;
        while (klass != null) {
            for (let i1 of klass.implements) {
                let i2: Interface = i1.getThisOrExtendedInterface(identifier);
                if (i2 != null) return i2;
            }
            klass = klass.baseClass;
        }

        return null;
    }



    registerUsedSystemClasses(usedSystemClasses: (Klass | Interface)[]) {
        if (this.baseClass != null && this.baseClass.module != null && this.baseClass.module.isSystemModule &&
            usedSystemClasses.indexOf(this.baseClass) < 0) {
            usedSystemClasses.push(this.baseClass);
        }
        for (let cd of this.getCompositeData()) {
            if (cd.klass != null && cd.klass.module != null && cd.klass.module.isSystemModule &&
                usedSystemClasses.indexOf(cd.klass) < 0) {
                usedSystemClasses.push(cd.klass);
            }
        }
        for (let interf of this.implements) {
            if (interf != null && interf.module.isSystemModule &&
                usedSystemClasses.indexOf(interf) < 0) {
                usedSystemClasses.push(interf);
            }
        }
    }

    getCompositeData(): CompostionData[] {

        let cd: CompostionData[] = [];
        let cdMap: Map<Klass | Interface, CompostionData> = new Map();

        for (let a of this.attributes) {
            if (a.type instanceof Klass || a.type instanceof Interface) {
                let cda = cdMap.get(a.type);
                if (cda == null) {
                    cda = {
                        klass: a.type,
                        multiples: false,
                        identifier: a.identifier
                    };
                    cdMap.set(a.type, cda);
                    cd.push(cda);
                } else {
                    cda.identifier += ", " + a.identifier;
                }
            } else {
                let type: Type = a.type;
                while (type instanceof ArrayType) {
                    type = type.arrayOfType;
                }
                if (type instanceof Klass || type instanceof Interface) {
                    let cda = cdMap.get(type);
                    if (cda == null) {
                        cda = {
                            klass: type,
                            multiples: true,
                            identifier: a.identifier
                        };
                        cdMap.set(type, cda);
                        cd.push(cda);
                    } else {
                        cda.identifier += ", " + a.identifier;
                        cda.multiples = true;
                    }
                }
            }
        }

        return cd;
    }


    clearUsagePositions() {
        super.clearUsagePositions();

        for (let m of this.methods) {
            m.clearUsagePositions();
        }

        for (let a of this.attributes) {
            a.usagePositions = new Map();
        }

        if (this.staticClass != null) {
            this.staticClass.clearUsagePositions();
        }

    }


    getPostConstructorCallbacks(): ((r: RuntimeObject) => void)[] {
        let c: Klass = this;
        let callbacks: ((r: RuntimeObject) => void)[] = null;

        while (c != null) {
            if (c.postConstructorCallbacks != null) {
                if (callbacks == null) { callbacks = c.postConstructorCallbacks; }
                else {
                    callbacks = callbacks.concat(c.postConstructorCallbacks);
                }
            }
            c = c.baseClass;
        }
        return callbacks;
    }

    getCompletionItems(visibilityUpTo: Visibility,
        leftBracketAlreadyThere: boolean, identifierAndBracketAfterCursor: string,
        rangeToReplace: monaco.IRange, currentMethod?: Method): monaco.languages.CompletionItem[] {

        let itemList: monaco.languages.CompletionItem[] = [];

        for (let attribute of this.getAttributes(visibilityUpTo)) {
            itemList.push({
                label: attribute.identifier + "",
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: attribute.identifier,
                range: rangeToReplace,
                documentation: attribute.documentation == null ? undefined : {
                    value: attribute.documentation
                }
            });
        }

        for (let method of this.getMethods(visibilityUpTo)) {
            if (method.isConstructor) {
                if (currentMethod?.isConstructor && currentMethod != method && this.baseClass.methods.indexOf(method) >= 0) {
                    this.pushSuperCompletionItem(itemList, method, leftBracketAlreadyThere, rangeToReplace);
                    continue;
                } else {
                    continue;
                }
            }

            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }

        itemList = itemList.concat(this.staticClass.getCompletionItems(visibilityUpTo,
            leftBracketAlreadyThere, identifierAndBracketAfterCursor,
            rangeToReplace));

        return itemList;
    }

    pushSuperCompletionItem(itemList: monaco.languages.CompletionItem[], method: Method, leftBracketAlreadyThere: boolean,
        rangeToReplace: monaco.IRange) {
        itemList.push({
            label: method.getCompletionLabel().replace(method.identifier, "super"),
            filterText: "super",
            command: {
                id: "editor.action.triggerParameterHints",
                title: '123',
                arguments: []
            },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method.getCompletionSnippet(leftBracketAlreadyThere).replace(method.identifier, "super"),
            range: rangeToReplace,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: method.documentation == null ? undefined : {
                value: method.documentation
            }
        });

    }

    pushStaticInitializationPrograms(programStack: ProgramStackElement[]) {

        if (this.staticClass.attributeInitializationProgram.statements.length > 0) {
            programStack.push({
                program: this.staticClass.attributeInitializationProgram,
                programPosition: 0,
                textPosition: { line: 1, column: 1, length: 0 },
                method: "Initialisierung statischer Variablen der Klasse " + this.staticClass.identifier,
                callbackAfterReturn: null,
                isCalledFromOutside: "Initialisierung statischer Attribute"
            });
        }

    }

    getMethodBySignature(signature: string): Method {

        let c: Klass = this;
        while (c != null) {
            let method = c.methodMap.get(signature);
            if (method != null) return method;
            c = c.baseClass;
        }

        return null;

    }

    public equals(type: Type): boolean {
        return type == this;
    }

    setBaseClass(baseClass: Klass) {

        this.baseClass = baseClass;
        this.staticClass.baseClass = baseClass.staticClass;
    }

    public addMethod(method: Method) {
        if (method.isConstructor) {
            method.returnType = null;
        }
        if (method.isStatic) {
            this.staticClass.addMethod(method);
        } else {
            this.methods.push(method);
            this.methodMap.set(method.signature, method);
        }
    }

    public addAttribute(attribute: Attribute) {
        if (attribute.isStatic) {
            this.staticClass.addAttribute(attribute);
        } else {
            this.attributes.push(attribute);
            this.attributeMap.set(attribute.identifier, attribute);
        }
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {

        if (operation == TokenType.equal || operation == TokenType.notEqual) {
            if (secondOperandType instanceof Klass || secondOperandType == nullType) {
                return booleanPrimitiveTypeCopy;
            }
        }

        if (operation == TokenType.keywordInstanceof) {
            if (secondOperandType instanceof StaticClass || secondOperandType instanceof Interface) {
                return booleanPrimitiveTypeCopy;
            }
        }

        return null;

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value) {
        if (operation == TokenType.equal) {
            return firstOperand.value == secondOperand.value;
        }

        if (operation == TokenType.notEqual) {
            return firstOperand.value != secondOperand.value;
        }

        if (operation == TokenType.keywordInstanceof) {
            let firstOpClass = firstOperand?.value?.class;
            if (firstOpClass == null) return false;
            let typeLeft: Klass = <Klass>firstOpClass;
            let typeRight = secondOperand.type;
            if (typeRight instanceof StaticClass) {

                while (typeLeft != null) {
                    if (typeLeft === typeRight.Klass) return true;
                    typeLeft = typeLeft.baseClass;
                }
                return false;
            }
            if (typeRight instanceof Interface) {
                while (typeLeft != null) {
                    for (let i of typeLeft.implements) {
                        if (i === typeRight) return true;
                    }
                    typeLeft = typeLeft.baseClass;
                }
            }
            return false;
        }

        return null;
    }

    /**
     * returns all visible methods of this class and all of its base classes
     */
    public getMethods(upToVisibility: Visibility, identifier?: string): Method[] {

        let methods: Method[] = this.methods.filter((method) => {
            return method.visibility <= upToVisibility && (identifier == null || method.identifier == identifier);
        });

        if (this.baseClass != null && (identifier == null || identifier != this.identifier || methods.length == 0)) {
            let baseClassUptoVisibility = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;

            for (let m of this.baseClass.getMethods(baseClassUptoVisibility, identifier == this.identifier ? this.baseClass.identifier : identifier)) {

                let found = false;
                for (let m1 of methods) {
                    if (m1.signature == m.signature) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    methods.push(m);
                }

            }
        }

        return methods;
    }

    /**
     * returns all visible attributes of this class and all of its base classes
     */
    public getAttributes(upToVisibility: Visibility): Attribute[] {

        let attributes: Attribute[] = [];
        for (let a of this.attributes) {
            if (a.visibility <= upToVisibility) {
                attributes.push(a);
            }
        }

        if (this.baseClass != null) {

            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;

            for (let a of this.baseClass.getAttributes(upToVisibilityInBaseClass)) {

                let found = false;

                if (a.visibility > upToVisibilityInBaseClass) continue;

                for (let a1 of attributes) {
                    if (a1.identifier == a.identifier) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    attributes.push(a);
                }

            }
        }

        return attributes;
    }

    public hasConstructor() {
        for (let m of this.methods) {
            if (m.isConstructor) return true;
        }

        if (this.baseClass != null) return this.baseClass.hasConstructor();

        return false;
    }

    public hasParameterlessConstructor() {
        let hasConstructorWithParameters: boolean = false;
        for (let m of this.methods) {
            if (m.isConstructor) {
                if (m.parameterlist.parameters.length == 0) {
                    return true;
                } else {
                    hasConstructorWithParameters = true;
                }
            }

        }

        if (!hasConstructorWithParameters && this.baseClass != null) {
            return this.baseClass.hasParameterlessConstructor();
        }

        return false;
    }

    public getParameterlessConstructor(): Method {
        for (let m of this.methods) {
            if (m.isConstructor && m.parameterlist.parameters.length == 0) return m;
        }

        if (this.baseClass != null) {
            return this.baseClass.getParameterlessConstructor();
        }

        return null;
    }


    public getConstructor(parameterTypes: Type[], upToVisibility: Visibility, classIdentifier: string = this.identifier): { error: string, methodList: Method[] } {

        let constructors: Method[] = this.methods.filter((m) => {
            return m.isConstructor && m.visibility <= upToVisibility;
        });

        if (constructors.length == 0 && this.baseClass != null) {
            return this.baseClass.getConstructor(parameterTypes, upToVisibility, classIdentifier);
        } else {
            return findSuitableMethods(constructors, this.identifier, parameterTypes, classIdentifier, true);

        }

    }

    public getMethodsThatFitWithCasting(identifier: string, parameterTypes: Type[],
        searchConstructor: boolean, upToVisibility: Visibility): { error: string, methodList: Method[] } {

        let allMethods = this.getMethods(upToVisibility);

        let methods = findSuitableMethods(allMethods, identifier, parameterTypes, this.identifier, searchConstructor);

        if (methods.methodList.length == 0 && !searchConstructor) {
            let staticMethods = this.staticClass.getMethodsThatFitWithCasting(identifier, parameterTypes, false, upToVisibility);
            if (staticMethods.error == null) {
                return staticMethods;
            }

            return methods;
        }

        return methods;

    }

    public getMethod(identifier: string, parameterlist: Parameterlist): Method {

        let method = this.methodMap.get(identifier + parameterlist.id);

        if (method == null && this.baseClass != null) {
            return this.baseClass.getMethod(identifier, parameterlist);
        }

        return method;
    }

    public getAttribute(identifier: string, upToVisibility: Visibility): { attribute: Attribute, error: string, foundButInvisible: boolean } {

        let error = null;
        let foundButInvisible: boolean = false;

        let attribute = this.attributeMap.get(identifier);
        let attributeNotFound = attribute == null;

        if (attribute == null) {
            error = "Das Attribut " + identifier + " kann nicht gefunden werden.";
        } else
            if (attribute.visibility > upToVisibility) {
                error = "Das Attribut " + identifier + " hat die Sichtbarkeit " + Visibility[attribute.visibility] + " und ist daher hier nicht sichtbar.";
                attribute = null;
                foundButInvisible = true;
            }

        if (attribute == null && this.baseClass != null) {
            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;

            let baseClassAttribute = this.baseClass.getAttribute(identifier, upToVisibilityInBaseClass);
            if (baseClassAttribute.attribute != null || attributeNotFound) {
                return baseClassAttribute;
            }

        }

        return { attribute: attribute, error: error, foundButInvisible: foundButInvisible };
    }

    public canCastTo(type: Type): boolean {

        if (type == stringPrimitiveType) {
            return true;
        }

        if (type instanceof Klass) {
            let baseClass: Klass = this;

            while (baseClass != null) {
                if (type.getNonGenericIdentifier() == baseClass.getNonGenericIdentifier()) {
                    if (type.typeVariables.length > 0) {
                        let n: number = Math.min(type.typeVariables.length, baseClass.typeVariables.length);
                        for (let i = 0; i < n; i++) {
                            if (!baseClass.typeVariables[i].type.canCastTo(type.typeVariables[i].type)) return false;
                        }
                        return true;
                    }
                    return true;
                }
                baseClass = baseClass.baseClass;
            }
        }

        if (type instanceof Interface) {

            let klass: Klass = this;
            while (klass != null) {
                for (let i of klass.implements) {
                    let shouldImplement = type.getNonGenericIdentifier();
                    // look recursively into interface inheritance chain:                    
                    if (i.getThisOrExtendedInterface(shouldImplement) != null) {
                        return true;
                    }
                }
                klass = klass.baseClass;
            }
        }

        return false;

    }

    public castTo(value: Value, type: Type): Value {

        return value;

    }

    checkInheritance(): { message: string, missingMethods: Method[] } {

        if (this.baseClass != null && Klass.dontInheritFrom.indexOf(this.baseClass.identifier) >= 0) {
            return { message: "Aus Performancegründen ist es leider nicht möglich, Unterklassen der Klassen String, Boolean, Character, Integer, Float und Double zu bilden.", missingMethods: [] };
        }

        let message = "";
        let missingAbstractMethods: Method[] = [];
        let implementedMethods: Method[] = [];

        let missingInterfaceMethods: Method[] = [];

        let klass: Klass = this;
        let hierarchy: string[] = [klass.identifier];

        while (klass.baseClass != null) {
            klass = klass.baseClass;
            if (hierarchy.indexOf(klass.identifier) >= 0) {
                klass.baseClass = null;  // This is necessary to avoid infinite loops in further compilation
                hierarchy = [klass.identifier].concat(hierarchy);
                message = "Die Klasse " + klass.identifier + " erbt von sich selbst: ";
                message += "(" + hierarchy.join(" extends ") + ")";
                break;
            }
            hierarchy = [klass.identifier].concat(hierarchy);
        }

        if (message == "") {

            if (this.baseClass != null) {

                let abstractMethods: Method[] = [];

                let klass: Klass = this;

                // collect abstract Methods
                while (klass != null) {
                    for (let m of klass.methods) {
                        if (m.isAbstract) {
                            abstractMethods.push(m);
                            let isImplemented: boolean = false;
                            for (let m1 of implementedMethods) {
                                if (m1.implements(m)) {
                                    isImplemented = true;
                                    break;
                                }
                            }
                            if (!isImplemented) {
                                missingAbstractMethods.push(m);
                            }
                        } else {
                            implementedMethods.push(m);
                        }
                    }
                    klass = klass.baseClass;
                }

            }

            if (missingAbstractMethods.length > 0 && !this.isAbstract) {
                message = "Die Klasse " + this.identifier + " muss noch folgende Methoden ihrer abstrakten Basisklassen implementieren: ";

                message += missingAbstractMethods.map((m) => m.getSignatureWithReturnParameter()).join(", ");

            }

            for (let i of this.implements) {
                for (let m of i.getMethods()) {
                    let isImplemented: boolean = false;
                    for (let m1 of implementedMethods) {
                        if (m1.implements(m)) {
                            isImplemented = true;
                            break;
                        }
                    }
                    if (!isImplemented) {
                        missingInterfaceMethods.push(m);
                    }
                }
            }

            if (missingInterfaceMethods.length > 0) {

                if (message != "") message += "\n";

                message += "Die Klasse " + this.identifier + " muss noch folgende Methoden der von ihr implementierten Interfaces implementieren: ";

                message += missingInterfaceMethods.map((m) => m.signature).join(", ");

            }

        }

        return { message: message, missingMethods: missingAbstractMethods.concat(missingInterfaceMethods) };

    }

    hasAncestorOrIs(a: Klass | StaticClass) {
        let c: Klass | StaticClass = this;
        let id = a.identifier;
        if (a instanceof Klass) id = a.getNonGenericIdentifier();

        while (c != null) {
            if (c.getNonGenericIdentifier() == id) return true;
            c = c.baseClass;
        }
        return false;
    }

    public debugOutput(value: Value, maxLength: number = 40): string {

        let s: string = "{";
        let attributes = this.getAttributes(Visibility.private);
        let object = <RuntimeObject>value.value;

        if (object == null) {
            return "null";
        }

        for (let i = 0; i < attributes.length; i++) {

            let attribute = attributes[i];
            let v = object.getValue(attribute.index);
            if (attribute.type instanceof PrimitiveType) {
                s += attribute.identifier + ":&nbsp;" + attribute.type.debugOutput(v, maxLength / 2);
            } else {
                s += attribute.identifier + ":&nbsp; {...}";
            }
            if (i < attributes.length - 1) {
                s += ",&nbsp;";
            }

        }

        return s + "}";
    }

    // static count: number = 0;
    clone(): Klass {
        // Klass.count++;

        let newKlass: Klass = Object.create(this);

        newKlass.implements = this.implements.slice(0);
        newKlass.usagePositions = new Map();
        newKlass.isGenericVariantFrom = this;

        return newKlass;
    }

}

export class StaticClass extends Type {

    baseClass: StaticClass;
    Klass: Klass;
    // TODO: Initialize
    classObject: RuntimeObject;

    attributeInitializationProgram: Program;

    public methods: Method[] = [];
    private methodMap: Map<string, Method> = new Map();

    public attributes: Attribute[] = [];
    public attributeMap: Map<string, Attribute> = new Map();
    public numberOfAttributesIncludingBaseClass: number = null;

    constructor(klass: Klass) {
        super();

        this.Klass = klass;
        this.identifier = klass.identifier;

        if (klass.baseClass != null) {
            this.baseClass = klass.baseClass.staticClass;
        }

        this.attributeInitializationProgram = {
            method: null,
            module: this.Klass.module,
            statements: [],
            labelManager: null
        }

        this.attributeInitializationProgram.labelManager = new LabelManager(this.attributeInitializationProgram);

    }

    setupAttributeIndicesRecursive() {
        if (this.baseClass != null && this.baseClass.numberOfAttributesIncludingBaseClass == null) {
            this.baseClass.setupAttributeIndicesRecursive();
        }
        let numberOfAttributesInBaseClasses = this.baseClass == null ? 0 : this.baseClass.numberOfAttributesIncludingBaseClass;

        for (let a of this.attributes) {
            a.index = numberOfAttributesInBaseClasses++;
            // console.log(this.identifier + "." + a.identifier+ ": " + a.index);
        }

        this.numberOfAttributesIncludingBaseClass = numberOfAttributesInBaseClasses;

    }


    clearUsagePositions() {
        super.clearUsagePositions();

        for (let m of this.methods) {
            m.clearUsagePositions();
        }

        for (let a of this.attributes) {
            a.usagePositions = new Map();
        }

    }

    public debugOutput(value: Value, maxLength: number = 40): string {

        let s: string = "{";
        let attributes = this.getAttributes(Visibility.private);
        let object = this.classObject;

        if(attributes == null) return "{}";

        for (let i = 0; i < attributes.length; i++) {

            let attribute = attributes[i];
            s += attribute.identifier + ": " + object == null ? '---' : attribute.type?.debugOutput(object?.getValue(attribute.index), maxLength / 2);
            if (i < attributes.length - 1) {
                s += ", ";
            }

        }

        return s + "}";
    }


    getCompletionItems(visibilityUpTo: Visibility,
        leftBracketAlreadyThere: boolean, identifierAndBracketAfterCursor: string,
        rangeToReplace: monaco.IRange): monaco.languages.CompletionItem[] {

        let itemList: monaco.languages.CompletionItem[] = [];

        for (let attribute of this.getAttributes(visibilityUpTo)) {
            
            itemList.push({
                label: attribute.identifier,
                //@ts-ignore
                detail: attribute.color? attribute.color : undefined,
                //@ts-ignore
                kind: attribute.color? monaco.languages.CompletionItemKind.Color : monaco.languages.CompletionItemKind.Field,
                insertText: attribute.identifier,
                range: rangeToReplace,
                documentation: attribute.documentation == null ? undefined : {
                    value: attribute.documentation
                }
            });
        }

        for (let method of this.getMethods(visibilityUpTo)) {
            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }

        return itemList;
    }

    public equals(type: Type): boolean {
        return type == this;
    }

    public addMethod(method: Method) {
        this.methods.push(method);
        this.methodMap.set(method.signature, method);
    }

    public addAttribute(attribute: Attribute) {
        this.attributes.push(attribute);
        this.attributeMap.set(attribute.identifier, attribute);
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {

        return null;

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value) {
        return null;
    }

    public getMethodsThatFitWithCasting(identifier: string, parameterTypes: Type[],
        searchConstructor: boolean, upToVisibility: Visibility): { error: string, methodList: Method[] } {

        return findSuitableMethods(this.getMethods(upToVisibility), identifier, parameterTypes,
            this.Klass.identifier, searchConstructor);

    }

    /**
     * returns all methods of this class and all of its base classes
     * @param isStatic returns only static methods if true
     */
    public getMethods(upToVisibility: Visibility, identifier?: string): Method[] {

        let methods: Method[] = this.methods.slice().filter((method) => {
            return method.visibility <= upToVisibility && (identifier == null || identifier == method.identifier);
        });

        if (this.baseClass != null) {
            let baseClassUptoVisibility = upToVisibility == Visibility.public ? Visibility.public : Visibility.protected;
            for (let m of this.baseClass.getMethods(baseClassUptoVisibility, identifier)) {

                let found = false;
                for (let m1 of methods) {
                    if (m1.signature == m.signature) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    methods.push(m);
                }

            }
        }

        return methods;
    }

    /**
     * returns all attributes of this class and all of its base classes
     * @param isStatic return only static attributes if true
     */
    public getAttributes(visibilityUpTo: Visibility): Attribute[] {

        let attributes: Attribute[] = this.attributes.filter((attribute) => {
            return attribute.visibility <= visibilityUpTo;
        });

        if (this.baseClass != null) {

            let visibilityUpToBaseClass = visibilityUpTo == Visibility.public ? visibilityUpTo : Visibility.protected;

            for (let a of this.baseClass.getAttributes(visibilityUpToBaseClass)) {

                let found = false;

                for (let a1 of attributes) {
                    if (a1.identifier == a.identifier) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    attributes.push(a);
                }

            }
        }

        return attributes;
    }

    public getMethod(identifier: string, parameterlist: Parameterlist): Method {

        let method = this.methodMap.get(identifier + parameterlist.id);

        if (method == null && this.baseClass != null) {
            return this.baseClass.getMethod(identifier, parameterlist);
        }

        return method;
    }

    public getAttribute(identifier: string, upToVisibility: Visibility): { attribute: Attribute, error: string, foundButInvisible: boolean, staticClass: StaticClass } {

        let error = "";
        let notFound = false;
        let attribute = this.attributeMap.get(identifier);

        if (attribute == null) {
            notFound = true;
            error = "Das Attribut " + identifier + " konnte nicht gefunden werden.";
        } else if (attribute.visibility > upToVisibility) {
            error = "Das Attribut " + identifier + " hat die Sichtbarkeit " + Visibility[attribute.visibility] + " und ist hier daher nicht sichtbar.";
            attribute = null;
        }

        if (attribute == null && this.baseClass != null) {
            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;

            let baseClassAttributeWithError = this.baseClass.getAttribute(identifier, upToVisibilityInBaseClass);
            if (notFound) {
                return baseClassAttributeWithError;
            }
        }

        return { attribute: attribute, error: error, foundButInvisible: !notFound, staticClass: this };
    }

    public canCastTo(type: Type): boolean {

        return false;

    }

    public castTo(value: Value, type: Type): Value {
        return value;
    }

    hasAncestorOrIs(a: Klass | StaticClass) {
        let c: Klass | StaticClass = this;
        while (c != null) {
            if (c == a) return true;
            c = c.baseClass;
        }
        return false;
    }

}

export class Interface extends Type {

    // for Generics:
    typeVariables: TypeVariable[] = [];
    isGenericVariantFrom: Interface;
    typeVariablesReady: boolean = true;

    public module: Module;

    public extends: Interface[] = [];

    public methods: Method[] = [];
    private methodMap: Map<string, Method> = new Map();

    constructor(identifier: string, module: Module, documentation?: string) {
        super();
        this.documentation = documentation;
        this.identifier = identifier;
        this.module = module;
    }

    getNonGenericIdentifier(): string {
        let k: Interface = this;
        while (k.isGenericVariantFrom != null) k = k.isGenericVariantFrom;
        return k.identifier;
    }

    getThisOrExtendedInterface(identifier: String): Interface {
        if (this.getNonGenericIdentifier() == identifier) return this;
        for (let if1 of this.extends) {
            let if2 = if1.getThisOrExtendedInterface(identifier);
            if (if2 != null) return if2;
        }
        return null;
    }

    // static count: number = 0;
    clone(): Interface {
        // Interface.count++;
        let newInterface: Interface = Object.create(this);

        newInterface.usagePositions = new Map();
        newInterface.isGenericVariantFrom = this;

        return newInterface;
    }

    clearUsagePositions() {
        super.clearUsagePositions();

        for (let m of this.methods) {
            m.clearUsagePositions();
        }

    }


    getCompletionItems(leftBracketAlreadyThere: boolean, identifierAndBracketAfterCursor: string,
        rangeToReplace: monaco.IRange): monaco.languages.CompletionItem[] {

        let itemList: monaco.languages.CompletionItem[] = [];

        for (let method of this.getMethods()) {
            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }

        return itemList;
    }

    public debugOutput(value: Value, maxLength: number = 40): string {
        if (value.value == null) {
            return "null";
        } else {
            if (value.value instanceof RuntimeObject) {
                return value.value.class.debugOutput(value);
            } else {
                return "{...}";
            }
        }
    }

    public equals(type: Type): boolean {
        return type == this;
    }

    public addMethod(method: Method) {
        method.isAbstract = true;
        this.methods.push(method);
        this.methodMap.set(method.signature, method);
    }

    public getResultType(operation: TokenType, secondOperandType?: Type): Type {

        if (operation == TokenType.equal || operation == TokenType.notEqual) {
            return booleanPrimitiveTypeCopy;
        }

        if (operation == TokenType.keywordInstanceof) {
            if (secondOperandType instanceof StaticClass || secondOperandType instanceof Interface) {
                return booleanPrimitiveTypeCopy;
            }
        }

        return null;

    }

    public compute(operation: TokenType, firstOperand: Value, secondOperand?: Value) {

        if (operation == TokenType.equal) {
            return firstOperand.value == secondOperand.value;
        }

        if (operation == TokenType.notEqual) {
            return firstOperand.value != secondOperand.value;
        }

        return null;

    }

    methodsWithSubInterfaces: Method[];

    /**
     * returns all methods of this interface
     * @param isStatic is not used in interfaces
     */
    public getMethods(): Method[] {

        if (this.extends.length == 0) return this.methods;

        if (this.methodsWithSubInterfaces != null) return this.methodsWithSubInterfaces;

        let visitedInterfaces: { [key: string]: boolean } = {};
        let visitedMethods: { [signature: string]: boolean } = {};

        this.methodsWithSubInterfaces = this.methods.slice(0);
        for (let m of this.methods) visitedMethods[m.signature] = true;
        visitedInterfaces[this.identifier] = true;

        let todo: Interface[] = this.extends.slice(0);

        while (todo.length > 0) {
            let interf = todo.pop();
            for (let m of interf.methods) {
                if (!visitedMethods[m.signature]) {
                    this.methodsWithSubInterfaces.push(m);
                    visitedMethods[m.signature] = true;
                }
            }
            for (let i of interf.extends) {
                if (!visitedInterfaces[i.identifier]) {
                    todo.push(i);
                    visitedInterfaces[i.identifier] = true;
                }
            }
        }

        return this.methodsWithSubInterfaces;

    }

    public getMethod(identifier: string, parameterlist: Parameterlist): Method {

        return this.methodMap.get(identifier + parameterlist.id);

    }

    public canCastTo(type: Type): boolean {

        if (type instanceof Interface) {
            let nonGenericCastable = false;
            if (type.getNonGenericIdentifier() == this.getNonGenericIdentifier()) {
                nonGenericCastable = true;
                if (this.typeVariables.length == 0) return true;
                let type2 = <Interface>type;
                if (this.typeVariables.length != type2.typeVariables.length) return false;
                for (let i = 0; i < this.typeVariables.length; i++) {
                    let tv = this.typeVariables[i];
                    let tvOther = type2.typeVariables[i];
                    if (!tvOther.type.canCastTo(tv.type)) return false;
                }
                return false;
            } else {
                for (let type1 of this.extends) {
                    if (type1.canCastTo(type)) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            if (type instanceof Klass && type.getNonGenericIdentifier() == "Object") {
                return true;
            }
            return false;
        }

        // return (type instanceof Klass) || (type instanceof Interface);
    }

    public castTo(value: Value, type: Type): Value {
        return value;
    }

    public getMethodsThatFitWithCasting(identifier: string, parameterTypes: Type[], searchConstructor: boolean): { error: string, methodList: Method[] } {

        return findSuitableMethods(this.getMethods(), identifier, parameterTypes, this.identifier, searchConstructor);

    }


}

function findSuitableMethods(methodList: Method[], identifier: string, parameterTypes: Type[],
    classIdentifier: string,
    searchConstructor: boolean): { error: string, methodList: Method[] } {

    let suitableMethods: Method[] = [];
    let howManyCastingsMax: number = 10000;
    let error = null;

    let oneWithCorrectIdentifierFound = false;

    for (let m of methodList) {

        let howManyCastings = 0;
        if (m.identifier == identifier || m.isConstructor && searchConstructor) {

            oneWithCorrectIdentifierFound = true;

            let isEllipsis = m.hasEllipsis();
            if (m.getParameterCount() == parameterTypes.length || (isEllipsis && m.getParameterCount() <= parameterTypes.length)) {

                let suits = true;

                let i = 0;

                for (i = 0; i < m.getParameterCount() - (isEllipsis ? 1 : 0); i++) {
                    let mParameterType = m.getParameterType(i);
                    let givenType = parameterTypes[i];

                    if (givenType == null) {
                        suits = false; break;
                    }

                    if (mParameterType == givenType) {
                        continue;
                    }

                    if (givenType.canCastTo(mParameterType)) {
                        howManyCastings++;
                        /**
                         * Rechteck r; 
                         * GNGFigur f;
                         * Bei f.berührt(r) gibt es eine Variante mit Parametertyp String (schlecht!) und
                         * eine mit Parametertyp Object. Letztere soll genommen werden, also:
                         */
                        if(mParameterType == stringPrimitiveType) howManyCastings += 0.5;
                        continue;
                    }

                    suits = false;
                    break;
                }

                // Ellipsis!
                if (suits && isEllipsis) {
                    let mParameterEllipsis = m.getParameter(i);
                    let mParameterTypeEllispsis = (<ArrayType>mParameterEllipsis.type).arrayOfType;


                    for (let j = i; j < parameterTypes.length; j++) {
                        let givenType = parameterTypes[i];

                        if (givenType == null) {
                            suits = false; break;
                        }

                        if (mParameterTypeEllispsis == givenType) {
                            continue;
                        }

                        if (givenType.canCastTo(mParameterTypeEllispsis)) {
                            howManyCastings++;
                        /**
                         * Rechteck r; 
                         * GNGFigur f;
                         * Bei f.berührt(r) gibt es eine Variante mit Parametertyp String (schlecht!) und
                         * eine mit Parametertyp Object. Letztere soll genommen werden, also:
                         */
                         if(mParameterTypeEllispsis == stringPrimitiveType) howManyCastings += 0.5;
                            continue;
                        }

                        suits = false;
                        break;
                    }

                }

                if (suits && howManyCastings <= howManyCastingsMax) {
                    if (howManyCastings < howManyCastingsMax) {
                        suitableMethods = [];
                    }
                    suitableMethods.push(m);
                    howManyCastingsMax = howManyCastings;
                }

            }
        }

    }

    if (suitableMethods.length == 0) {

        if (oneWithCorrectIdentifierFound) {
            if (parameterTypes.length == 0) {
                error = searchConstructor ? "Es gibt keinen parameterlosen Konstruktor der Klasse " + classIdentifier : "Die vorhandenen Methoden mit dem Bezeichner " + identifier + " haben alle mindestens einen Parameter. Hier wird aber kein Parameterwert übergeben.";
            } else {
                let typeString = parameterTypes.map(type => type?.identifier).join(", ");
                error = searchConstructor ? `Die Parametertypen (${typeString}) passen zu keinem Konstruktor der Klasse ${classIdentifier}` : `Die Parametertypen (${typeString}) passen zu keiner der vorhandenen Methoden mit dem Bezeichner ${identifier}.`;
            }
        } else {
            error = "Der Typ " + classIdentifier + " besitzt keine Methode mit dem Bezeichner " + identifier + ".";
            if (identifier == 'setCenter') {
                error += ' Tipp: Die Methode setCenter der Klasse Shape wurde umbenannt in "moveTo".'
            }
        }

    }

    if (suitableMethods.length > 1) {
        suitableMethods = suitableMethods.slice(0, 1);
        // error = "Zu den gegebenen Parametern hat der Typ " + classIdentifier + " mehrere passende Methoden.";
    }

    return {
        error: error,
        methodList: suitableMethods
    };

}

export function getVisibilityUpTo(objectType: Klass | StaticClass, currentClassContext: Klass | StaticClass): Visibility {

    if (currentClassContext == null) {
        return Visibility.public;
    }

    if (objectType instanceof StaticClass) objectType = objectType.Klass;
    if (currentClassContext instanceof StaticClass) currentClassContext = currentClassContext.Klass;

    if (objectType == currentClassContext) {
        return Visibility.private;
    }

    if (currentClassContext.hasAncestorOrIs(objectType)) {
        return Visibility.protected;
    }

    return Visibility.public;

}

