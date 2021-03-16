import { TokenType, TextPosition } from "../lexer/Token.js";
import { ArrayType } from "../types/Array.js";
import { Klass, Interface, TypeVariable } from "../types/Class.js";
import { Attribute, Method, Parameterlist, Type, Variable, PrimitiveType } from "../types/Types.js";
import { ClassDeclarationNode, InterfaceDeclarationNode, MethodDeclarationNode, TypeNode, EnumDeclarationNode, TypeParameterNode } from "./AST.js";
import { Module, ModuleStore } from "./Module.js";
import { nullType, intPrimitiveType, booleanPrimitiveType, floatPrimitiveType, doublePrimitiveType, stringPrimitiveType, charPrimitiveType, objectType } from "../types/PrimitiveTypes.js";
import { Enum } from "../types/Enum.js";
import { JsonTool } from "../types/TypeTools.js";
import { MainBase } from "../../main/MainBase.js";

type GenericTypeList = { typeNode: TypeNode, module: Module }[];

type TypeParameterInfo = {
    tpn: TypeParameterNode;
    tp: TypeVariable;
    ci: Klass | Interface;
    cdn: ClassDeclarationNode | InterfaceDeclarationNode;
    index: number
};

// TODO: find cyclic references in extends ...
export class TypeResolver {

    moduleStore: ModuleStore;

    classes: ClassDeclarationNode[];
    interfaces: InterfaceDeclarationNode[];
    enums: EnumDeclarationNode[];

    moduleToTypeParameterListMap: Map<Module, TypeVariable[]> = new Map();

    unresolvedTypes: Map<Module, TypeNode[]>;

    genericTypes: GenericTypeList = [];
    genericTypesInClassDefinitions: GenericTypeList = [];

    typeParameterList: TypeParameterInfo[] = [];

    constructor(private main: MainBase) {

    }

    start(moduleStore: ModuleStore) {

        this.classes = [];
        this.interfaces = [];
        this.enums = [];
        this.unresolvedTypes = new Map();

        this.moduleStore = moduleStore;

        this.resolveTypesInModules();

        this.setupClassesAndInterfaces();

        let unresolvedGenericTypesInClasses = this.resolveTypeVariables();

        this.resolveUnresolvedTypes(false);

        this.resolveGenericTypes(unresolvedGenericTypesInClasses);

        this.resolveExtendsImplements();

        let unresolvedGenericTypes = this.resolveGenericTypes(this.genericTypes);

        this.resolveUnresolvedTypes(true);

        this.resolveGenericTypes(unresolvedGenericTypes);

        this.setupMethodsAndAttributes();

        this.checkDoubleIdentifierDefinition();

        this.checkGenericTypesAgainsTypeGuards();

        this.setupAttributeIndices();

    }
    
    setupAttributeIndices() {
        for(let cl of this.classes){
            cl.resolvedType.setupAttributeIndicesRecursive();
            if(cl.resolvedType.staticClass != null){
                cl.resolvedType.staticClass.setupAttributeIndicesRecursive();
            }
        }
        for(let cl of this.enums){
            cl.resolvedType.setupAttributeIndicesRecursive();
            if(cl.resolvedType.staticClass != null){
                cl.resolvedType.staticClass.setupAttributeIndicesRecursive();
            }
        }
    }


    checkGenericTypesAgainsTypeGuards() {

        for (let tn of this.genericTypes) {
            if (tn.typeNode.genericParameterTypes == null) continue; // Error in resolveGenericType => nothing to do.

            let ci: Klass | Interface = <any>tn.typeNode.resolvedType;

            if (ci.isGenericVariantFrom == null) continue;

            if (ci.typeVariables.length != ci.isGenericVariantFrom.typeVariables.length) {
                tn.module.errors[2].push({
                    position: tn.typeNode.position,
                    text: "Der Generische Typ " + ci.isGenericVariantFrom.identifier + " hat " + ci.isGenericVariantFrom.typeVariables.length + " Typparameter. Hier wurden aber " + ci.typeVariables.length + " angegeben.",
                    level: "error"
                });
                continue;
            }

            for (let i = 0; i < ci.typeVariables.length; i++) {

                let error: string = null;

                let actualType = ci.typeVariables[i];
                let typeGuard = ci.isGenericVariantFrom.typeVariables[i];
                let genericParameterType = tn.typeNode.genericParameterTypes[i];
                actualType.scopeFrom = typeGuard.scopeFrom;
                actualType.scopeTo = typeGuard.scopeTo;
                actualType.identifier = typeGuard.identifier;

                error = "";
                if (!actualType.type.hasAncestorOrIs(typeGuard.type)) {
                    error += "Die Klasse " + actualType.type.identifier + " ist keine Unterklasse von " + typeGuard.type.identifier + " und pass damit nicht zum Typparamter " + typeGuard.identifier + " der Klasse " + ci.isGenericVariantFrom.identifier + ". ";
                }

                let ifList: string[] = [];
                for (let tgInterface of typeGuard.type.implements) {
                    if (!actualType.type.implementsInterface(tgInterface)) {
                        ifList.push(tgInterface.identifier);
                    }
                }

                if (ifList.length > 0) {
                    error += "Die Klasse " + actualType.identifier + " implementiert nicht die Interfaces " + ifList.join(", ");
                }

                if (error != "") {
                    tn.module.errors[2].push({
                        position: genericParameterType.position,
                        text: "Der angegebene Wert des Typparameters passt nicht zur Definition: " + error,
                        level: "error"
                    });
                }

            }

            this.adjustMethodsAndAttributesToTypeParameters(ci);

        }

    }

    adjustMethodsAndAttributesToTypeParameters(classOrInterface: Klass | Interface) {

        if (classOrInterface != null && classOrInterface.isGenericVariantFrom != null && classOrInterface.typeVariables.length != 0) {

            let methodListAltered: boolean = false;
            let newMethodList: Method[] = [];
            for (let m of classOrInterface.methods) {
                let newMethod = this.getAdjustedMethod(m, classOrInterface.typeVariables);
                methodListAltered = methodListAltered || newMethod.altered;
                newMethodList.push(newMethod.newMethod);
            }

            if (methodListAltered) classOrInterface.methods = newMethodList;

            if (classOrInterface instanceof Klass) {

                let newAttributes: Attribute[] = [];
                let newAttributeMap: Map<string, Attribute> = new Map();
                let attributesAltered: boolean = false;

                for (let attribute of classOrInterface.attributes) {
                    let newAttribute = this.getAdjustedAttribute(attribute, classOrInterface.typeVariables);
                    attributesAltered = attributesAltered || newAttribute.altered;
                    newAttributes.push(newAttribute.newAttribute);
                    newAttributeMap.set(attribute.identifier, newAttribute.newAttribute);
                }

                if (attributesAltered) {
                    classOrInterface.attributes = newAttributes;
                    classOrInterface.attributeMap = newAttributeMap;
                }

                this.adjustMethodsAndAttributesToTypeParameters(classOrInterface.baseClass);

                // for (let impl of classOrInterface.implements) {
                //     this.adjustMethodsAndAttributesToTypeParameters(impl);
                // }
            } else {
                for (let ext of classOrInterface.extends) {
                    this.adjustMethodsAndAttributesToTypeParameters(ext);
                }
            }
        }

    }

    getAdjustedAttribute(attribute: Attribute, typeVariables: TypeVariable[]): { altered: boolean, newAttribute: Attribute } {

        let nt = this.getAdjustedType(attribute.type, typeVariables, true);
        if (nt.altered) {
            let a: Attribute = Object.create(attribute);
            a.type = nt.newType;
            return { altered: true, newAttribute: a }
        } else {
            return { altered: false, newAttribute: attribute }
        }

    }

    getAdjustedMethod(method: Method, typeVariables: TypeVariable[]): { altered: boolean, newMethod: Method } {

        let nrt = this.getAdjustedType(method.returnType, typeVariables, true);

        let parameterAltered: boolean = false;
        let newParameters: Variable[] = [];
        for (let p of method.parameterlist.parameters) {
            let nt = this.getAdjustedType(p.type, typeVariables, false);
            if (nt.altered) {
                parameterAltered = true;
                let pNew: Variable = Object.create(p);
                pNew.type = nt.newType;
                newParameters.push(pNew);
            } else {
                newParameters.push(p);
            }
        }

        if (nrt.altered || parameterAltered) {
            let newMethod: Method = Object.create(method);
            if (nrt.altered) newMethod.returnType = nrt.newType;
            if (parameterAltered) {
                newMethod.parameterlist = new Parameterlist(newParameters);
            }
            return { altered: true, newMethod: newMethod }
        } else {
            return { altered: false, newMethod: method };
        }

    }

    getAdjustedType(type: Type, typeVariables: TypeVariable[], adjustMethodsAndAttributesRecursive: boolean): { altered: boolean, newType: Type } {

        if (type == null) return { altered: false, newType: type };

        if (type["isTypeVariable"] == true) {
            for (let tv of typeVariables) {
                if (tv.identifier == type.identifier) {
                    return { altered: true, newType: tv.type };
                }
            }
            return { altered: false, newType: type };
        }

        if ((type instanceof Klass || type instanceof Interface) && type.typeVariables.length > 0) {
            let newTypeVariables: TypeVariable[] = [];
            let altered: boolean = false;
            for (let tv of type.typeVariables) {
                let nt = this.getAdjustedType(tv.type, typeVariables, false);
                if (nt.altered) {
                    newTypeVariables.push({
                        identifier: tv.identifier,
                        scopeFrom: tv.scopeFrom,
                        scopeTo: tv.scopeTo,
                        type: <Klass>nt.newType
                    })
                    altered = true;
                } else {
                    newTypeVariables.push(tv);
                }
            }
            if (altered) {
                let newClassInterface = type.clone();
                newClassInterface.typeVariables = newTypeVariables;
                if (adjustMethodsAndAttributesRecursive) this.adjustMethodsAndAttributesToTypeParameters(newClassInterface);
                return { altered: true, newType: newClassInterface }
            } else {
                return { altered: false, newType: type }
            }
        }

        if(type instanceof ArrayType){
            let nt = this.getAdjustedType(type.arrayOfType, typeVariables, adjustMethodsAndAttributesRecursive);
            return {
                altered: nt.altered,
                newType: nt.altered ? new ArrayType(nt.newType) : type
            }
        }

        return { altered: false, newType: type };
    }

    resolveGenericTypes(genericTypes: GenericTypeList): GenericTypeList {
        let done: boolean = false;
        let todoList: GenericTypeList = genericTypes.slice(0);
        while (!done) {
            done = true;
            for (let i = 0; i < todoList.length; i++) {
                let tn = todoList[i];

                if (this.resolveGenericType(tn)) {
                    done = false;
                }
                if (tn.typeNode.genericParameterTypes == null || tn.typeNode.genericParameterTypesResolved != null) {
                    todoList.splice(todoList.indexOf(tn), 1);
                    i--;
                }

            }
        }

        return todoList;
    }

    // returns true if something new could be resolved
    resolveGenericType(tn: { typeNode: TypeNode, module: Module }): boolean {

        if (tn.typeNode.genericParameterTypesResolved != null) return false;
        if (tn.typeNode.genericParameterTypes == null) return true;

        /**
         * e.g. Map<Integer, String> test = new Map<>();
         * Subsequent Code processes the type Map<Integer, String>
         */

        let ci: Klass | Interface = <any>tn.typeNode.resolvedType; // in example: Map
        if (ci == null || !(ci instanceof Interface || ci instanceof Klass)) { // There had been an error... (in example: Map has not been resolved)
            tn.typeNode.genericParameterTypes = null;
            return false; // => exit gracefully
        }

        if (!ci.typeVariablesReady) return false;

        let parameterTypes: (Klass | Interface)[] = [];
        for (let i = 0; i < tn.typeNode.genericParameterTypes.length; i++) {
            let genericParameterType = tn.typeNode.genericParameterTypes[i];
            let resolvedType = genericParameterType.resolvedType;

            if (resolvedType == null) {
                return false;
            }

            if (genericParameterType.genericParameterTypes != null && genericParameterType.genericParameterTypesResolved == null) {
                return false; // first resolve this type!
            }

            if (!(resolvedType instanceof Interface || resolvedType instanceof Klass)) {
                tn.module.errors[2].push({
                    position: genericParameterType.position,
                    text: "Hier wird ein Interface- oder Klassentyp erwartet. Der Typ " + genericParameterType.identifier + " ist aber keiner.",
                    level: "error"
                });
                tn.typeNode.genericParameterTypes = null;
                return true; // => exit gracefully
            }

            parameterTypes.push(<any>genericParameterType.resolvedType);

        }

        let typeVariablesOldToNewMap: Map<Klass, Klass> = new Map();

        if (ci.typeVariables.length != parameterTypes.length) {
            tn.module.errors[2].push({
                position: tn.typeNode.position,
                text: (ci instanceof Klass ? "Die Klasse " : "Das Interface ") + ci.identifier + " hat " + ci.typeVariables.length + " Typparameter, hier sind aber " + parameterTypes.length + " angegeben.",
                level: "error"
            });
            tn.typeNode.genericParameterTypes = null;
            return true; // => exit gracefully
        }

        let i = 0;
        for (let type of parameterTypes) {

            let oldTypeVariable = ci.typeVariables[i];

            if (type instanceof Interface) {
                let type1 = objectType.clone();
                type1.implements.push(type);
                type = type1;
            }

            let newTypeVariable = {
                identifier: oldTypeVariable.identifier,
                scopeFrom: oldTypeVariable.scopeFrom,
                scopeTo: oldTypeVariable.scopeTo,
                type: type
            };

            typeVariablesOldToNewMap.set(ci.typeVariables[i].type, newTypeVariable.type)
            i++;
        }

        let newCi =
            this.propagateTypeParameterToBaseClassesAndImplementedInterfaces(ci, typeVariablesOldToNewMap);

        tn.typeNode.resolvedType = newCi;
        tn.typeNode.genericParameterTypesResolved = true;

        return true;
    }

    propagateTypeParameterToBaseClassesAndImplementedInterfaces(classOrInterface: Klass | Interface,
        typeVariablesOldToNewMap: Map<Klass, Klass>): Klass | Interface {

        if (classOrInterface instanceof Klass) {
            let newClass: Klass = classOrInterface.clone();

            newClass.typeVariables = [];
            for (let tv of classOrInterface.typeVariables) {
                let newType = typeVariablesOldToNewMap.get(tv.type);
                let tv1 = tv;
                if (newType != null) {
                    tv1 = {
                        identifier: tv.identifier,
                        scopeFrom: tv.scopeFrom,
                        scopeTo: tv.scopeTo,
                        type: newType
                    }
                }
                newClass.typeVariables.push(tv1);
            }

            let baseKlass = classOrInterface.baseClass;
            if (baseKlass != null && baseKlass.isGenericVariantFrom != null) {

                newClass.setBaseClass(<Klass>this.propagateTypeParameterToBaseClassesAndImplementedInterfaces(baseKlass, typeVariablesOldToNewMap));

            }

            newClass.implements = [];
            for (let impl of classOrInterface.implements) {
                if (impl.isGenericVariantFrom == null) {
                    newClass.implements.push(impl);
                } else {
                    newClass.implements.push(<Interface>this.propagateTypeParameterToBaseClassesAndImplementedInterfaces(impl, typeVariablesOldToNewMap));
                }
            }

            return newClass;

        } else {
            let newInterface: Interface = classOrInterface.clone();

            newInterface.typeVariables = [];
            for (let tv of classOrInterface.typeVariables) {
                let newType = typeVariablesOldToNewMap.get(tv.type);
                let tv1 = tv;
                if (newType != null) {
                    tv1 = {
                        identifier: tv.identifier,
                        scopeFrom: tv.scopeFrom,
                        scopeTo: tv.scopeTo,
                        type: newType
                    }
                }
                newInterface.typeVariables.push(tv1);
            }

            newInterface.extends = [];
            for (let impl of classOrInterface.extends) {
                if (impl.isGenericVariantFrom == null) {
                    newInterface.extends.push(impl);
                } else {
                    newInterface.extends.push(<Interface>this.propagateTypeParameterToBaseClassesAndImplementedInterfaces(impl, typeVariablesOldToNewMap));
                }
            }

            return newInterface;
        }

    }


    checkDoubleIdentifierDefinition() {
        let identifierModuleMap: Map<string, Module> = new Map();

        for (let module of this.moduleStore.getModules(false)) {
            for (let type of module.typeStore.typeList) {
                let otherModule = identifierModuleMap.get(type.identifier);
                if (otherModule != null) {
                    module.errors[1].push({
                        text: "Der Typbezeichner " + type.identifier + " wurde mehrfach definiert, nämlich in den Modulen " +
                            module.file.name + " und " + otherModule.file.name + ".",
                        position: type.declaration.position,
                        level: "error"
                    });
                    let otherType = otherModule.typeStore.getType(type.identifier);
                    if (otherType != null) {
                        otherModule.errors[1].push({
                            text: "Der Typbezeichner " + type.identifier + " wurde mehrfach definiert, nämlich in den Modulen " +
                                otherModule.file.name + " und " + module.file.name + ".",
                            position: otherType.declaration.position,
                            level: "error"
                        });
                    }
                } else {
                    identifierModuleMap.set(type.identifier, module);
                }
            }
        }

        let baseModule = this.moduleStore.getBaseModule();

        for (let tp of this.typeParameterList) {
            let module = tp.ci.module;
            let otherModule = identifierModuleMap.get(tp.tpn.identifier);
            if (otherModule == null) {
                let systemType = baseModule.typeStore.getType(tp.tpn.identifier);
                if (systemType != null) otherModule = baseModule;
            }
            if (otherModule != null) {
                module.errors[1].push({
                    text: "Der Typbezeichner " + tp.tpn.identifier + " wurde mehrfach definiert, nämlich in den Modulen " +
                        module.file.name + " und " + otherModule.file.name + ".",
                    position: tp.tpn.position,
                    level: "error"
                });
                let otherType = otherModule.typeStore.getType(tp.tpn.identifier);
                if (otherType != null && otherModule != baseModule) {
                    otherModule.errors[1].push({
                        text: "Der Typbezeichner " + tp.tpn.identifier + " wurde mehrfach definiert, nämlich in den Modulen " +
                            otherModule.file.name + " und " + module.file.name + ".",
                        position: otherType.declaration.position,
                        level: "error"
                    });
                }

            }
        }


    }

    resolveUnresolvedTypes(lastPass: boolean) {
        for (let module of this.moduleStore.getModules(false)) {
            module.dependsOnModules = new Map();
        }

        for (let module of this.moduleStore.getModules(false)) {
            let ut = this.unresolvedTypes.get(module);
            let utNew: TypeNode[] = [];
            for (let type of ut) {
                if (!this.resolveType(type, module, lastPass)) {
                    utNew.push(type);
                }
            }
            this.unresolvedTypes.set(module, utNew);
        }
    }

    addFromJsonMethod(klass: Klass) {
        let interpreter = this.main.getInterpreter();
        klass.addMethod(new Method("fromJson", new Parameterlist([
            { identifier: "jsonString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), klass,
            (parameters) => {
                let json: string = parameters[1].value;
                return new JsonTool().fromJson(json, klass, this.moduleStore, interpreter);
            }, false, true, `Konvertiert eine Json-Zeichenkette in ein ${klass.identifier}-Objekt ("deserialisieren"). Vor dem Deserialisieren eines Objekts werden die Attributinitialisierer angewandt und - falls vorhanden - ein parameterloser Konstruktor ausgeführt. Der Algorithmus kommt auch mit zyklischen Objektreferenzen zurecht.`, false));

    }

    addToJsonMethod(klass: Klass) {
        klass.addMethod(new Method("toJson", new Parameterlist([]), stringPrimitiveType,
            (parameters) => {
                return new JsonTool().toJson(parameters[0]);
            }, false, false, `Konvertiert ein Objekt (rekursiv mitsamt referenzierter Objekte) in eine Json-Zeichenkette. Nicht konvertiert werden Systemklassen (außer: ArrayList) sowie mit dem Schlüsselwort transient ausgezeichnete Attribute.`));

    }


    setupMethodsAndAttributes() {

        let classesOrEnums: (ClassDeclarationNode | EnumDeclarationNode)[] = [];
        classesOrEnums = classesOrEnums.concat(this.classes);
        classesOrEnums = classesOrEnums.concat(this.enums);

        for (let cn of classesOrEnums) {
            for (let mn of cn.methods) {
                let m: Method = this.setupMethod(mn, cn.resolvedType.module, cn.resolvedType);
                if (m != null) {
                    if(mn.commentBefore != null) m.documentation = "" + mn.commentBefore.value;
                    cn.resolvedType.addMethod(m);
                }
            }

            this.addFromJsonMethod(cn.resolvedType);
            this.addToJsonMethod(cn.resolvedType);

            for (let att of cn.attributes) {

                this.resolveType(att.attributeType, cn.resolvedType.module, true);
                let type = att.attributeType.resolvedType;
                if (type == null) {
                    continue;
                }

                let attribute: Attribute = new Attribute(att.identifier, type, null, att.isStatic, att.visibility, att.isFinal);
                att.resolvedType = attribute;
                if(att.commentBefore != null) attribute.documentation = "" + att.commentBefore.value;
                attribute.annotation = att.annotation;
                attribute.isTransient = att.isTransient;
                if (cn.resolvedType.attributeMap.get(attribute.identifier) != null) {
                    cn.resolvedType.module.errors[2].push({
                        text: "Es darf nicht mehrere Attribute mit demselben Bezeichner '" + attribute.identifier + "' in derselben Klassse geben.",
                        position: att.position, level: "error"
                    });
                }
                cn.resolvedType.addAttribute(attribute);

                this.pushUsagePosition(cn.resolvedType.module, att.position, attribute);
                attribute.declaration = { module: cn.resolvedType.module, position: att.position };

            }
        }

        for (let ic of this.interfaces) {
            for (let mn of ic.methods) {
                let m1: Method = this.setupMethod(mn, ic.resolvedType.module, ic.resolvedType);
                if (m1 != null) {
                    ic.resolvedType.addMethod(m1);
                }
            }
        }

    }

    setupMethod(mn: MethodDeclarationNode, m: Module, c: Klass | Interface): Method {

        let typesOK = true;

        typesOK = typesOK && this.resolveType(mn.returnType, m, true);

        let parameters: Variable[] = [];
        for (let par of mn.parameters) {
            typesOK = typesOK && this.resolveType(par.parameterType, m, true);
            if (typesOK) {
                let parameter = {
                    definition: par.position,
                    identifier: par.identifier,
                    usagePositions: new Map(),
                    type: par.parameterType.resolvedType,
                    declaration: { module: m, position: par.position },
                    isFinal: par.isFinal,
                    isEllipsis: par.isEllipsis
                };
                parameters.push(parameter);
                this.pushUsagePosition(m, par.position, parameter);

            }

        }

        let pl: Parameterlist = new Parameterlist(parameters);

        if (typesOK) {
            let method = new Method(mn.identifier, pl, mn.returnType.resolvedType, null, mn.isAbstract, mn.isStatic);
            method.isConstructor = mn.identifier == c.identifier;
            method.visibility = mn.visibility;
            method.isConstructor = mn.isConstructor;
            mn.resolvedType = method;
            method.annotation = mn.annotation;

            this.pushUsagePosition(m, mn.position, method);
            method.declaration = {
                module: m,
                position: mn.position
            }

            return method;
        }

        return null;
    }

    pushUsagePosition(m: Module, position: TextPosition, element: Type | Method | Attribute | Variable) {

        m.addIdentifierPosition(position, element);

        if (element instanceof PrimitiveType) {
            return;
        }

        let positionList: TextPosition[] = element.usagePositions.get(m);
        if (positionList == null) {
            positionList = [];
            element.usagePositions.set(m, positionList);
        }

        positionList.push(position);

    }

    resolveType(tn: TypeNode, m: Module, lastPass: boolean): boolean {
        if (tn.resolvedType == null) {
            let typeModule = this.moduleStore.getType(tn.identifier);
            if (typeModule != null) {
                let type = typeModule.type;
                m.dependsOnModules.set(typeModule.module, true);
                this.pushUsagePosition(m, tn.position, type);
                type = getArrayType(type, tn.arrayDimension);
                this.registerGenericType(tn, m, false);
                tn.resolvedType = type;
                return true;
            }

            let typeParameterList = this.moduleToTypeParameterListMap.get(m);
            if (typeParameterList != null) {
                for (let tg of typeParameterList) {
                    if (tg.identifier == tn.identifier) {
                        let position = tn.position;
                        if (position.line > tg.scopeFrom.line || position.line == tg.scopeFrom.line && position.column >= tg.scopeFrom.column) {
                            if (position.line < tg.scopeTo.line || position.line == tg.scopeTo.line && position.column <= tg.scopeTo.column) {
                                this.pushUsagePosition(m, tn.position, tg.type);
                                tn.resolvedType = tg.type;
                                return true;
                            }
                        }
                    }
                }
            }

            if (lastPass) {

                let typKlasse = (tn.identifier.length > 0 && tn.identifier[0].toUpperCase() == tn.identifier[0]) ? "Die Klasse" : "Der Typ";

                m.errors[2].push({
                    position: tn.position,
                    text: typKlasse + " " + tn.identifier + " konnte nicht gefunden werden." +
                        (tn.identifier == "string" ? " Meinten Sie String (großgeschrieben)?" : ""),
                    level: "error",
                    quickFix: (tn.identifier == "string") ? {
                        title: "String groß schreiben",
                        editsProvider: (uri) => {
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: tn.position.line, startColumn: tn.position.column - 1, endLineNumber: tn.position.line, endColumn: tn.position.column + 6 },
                                        text: "String"
                                    }
                                }
                            ]
                        }

                    } : null
                });
            }
            tn.resolvedType = null;
            return false;
        }

        return true;
    }

    resolveExtendsImplements() {
        for (let cn of this.classes) {

            let c = cn.resolvedType;
            for (let iNode of cn.implements) {
                this.resolveType(iNode, c.module, true);
                let iType = iNode.resolvedType;
                if (iType == null) {
                    continue;
                }
                if (!(iType instanceof Interface)) {
                    c.module.errors[2].push({
                        position: iNode.position,
                        text: "Der Typ " + iNode.identifier + " ist kein interface, darf also nicht bei implements... stehen.",
                        level: "error"
                    });
                    continue;
                }
                c.implements.push(<Interface>iType);
                iNode.resolvedType = iType;
            }

            if (cn.extends != null) {
                this.resolveType(cn.extends, c.module, true);
                let eType = cn.extends.resolvedType;
                if (eType == null || !(eType instanceof Klass)) {
                    c.module.errors[2].push({
                        position: cn.extends.position,
                        text: "Der Typ " + cn.extends.identifier + " ist keine Klasse, darf also nicht hinter extends stehen.",
                        level: "error"
                    });
                    continue;
                }

                c.setBaseClass(<Klass>eType);
                cn.extends.resolvedType = eType;
            } else {
                c.setBaseClass(<Klass>this.moduleStore.getType("Object").type)
            }

        }
        for (let interf of this.interfaces) {

            let c = interf.resolvedType;
            for (let iNode of interf.extends) {
                this.resolveType(iNode, c.module, true);
                let iType = iNode.resolvedType;
                if (iType == null) {
                    continue;
                }
                if (!(iType instanceof Interface)) {
                    c.module.errors[2].push({
                        position: iNode.position,
                        text: "Der Typ " + iNode.identifier + " ist kein interface, darf also nicht bei extends... stehen.",
                        level: "error"
                    });
                    continue;
                }
                c.extends.push(<Interface>iType);
                iNode.resolvedType = iType;
            }

        }
    }

    setupClassesAndInterfaces() {
        for (let m of this.moduleStore.getModules(false)) {
            if (m.classDefinitionsAST != null) {
                for (let cdn of m.classDefinitionsAST) {
                    switch (cdn.type) {
                        case TokenType.keywordClass:
                            this.classes.push(cdn);
                            let c = new Klass(cdn.identifier, m);
                            if(cdn.commentBefore != null) c.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = c;
                            c.visibility = cdn.visibility;
                            c.isAbstract = cdn.isAbstract;
                            m.typeStore.addType(c);
                            this.pushUsagePosition(m, cdn.position, c);
                            c.declaration = { module: m, position: cdn.position };
                            this.registerTypeVariables(cdn, c);
                            if (cdn.extends != null) this.registerGenericType(cdn.extends, m, true);
                            if (cdn.implements != null) {
                                for (let im of cdn.implements) this.registerGenericType(im, m, true);
                            }
                            break;
                        case TokenType.keywordEnum:
                            this.enums.push(cdn);
                            let e = new Enum(cdn.identifier, m, cdn.values);
                            if(cdn.commentBefore != null) e.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = e;
                            e.visibility = cdn.visibility;
                            m.typeStore.addType(e);
                            this.pushUsagePosition(m, cdn.position, e);
                            e.declaration = { module: m, position: cdn.position };
                            break;
                        case TokenType.keywordInterface:
                            this.interfaces.push(cdn);
                            let i = new Interface(cdn.identifier, m);
                            if(cdn.commentBefore != null) i.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = i;
                            m.typeStore.addType(i);
                            this.pushUsagePosition(m, cdn.position, i);
                            i.declaration = { module: m, position: cdn.position };
                            this.registerTypeVariables(cdn, i);
                            if (cdn.extends != null) {
                                for (let im of cdn.extends) this.registerGenericType(im, m, true);
                            }
                            break;

                    }
                }
            }
        }
    }

    resolveTypeVariables(): GenericTypeList {

        let todoList = this.typeParameterList.slice(0);
        let done = false;

        let unresolvedGenericTypes: GenericTypeList = this.genericTypesInClassDefinitions.slice(0);

        while (!done) {
            this.resolveUnresolvedTypes(false);
            unresolvedGenericTypes = this.resolveGenericTypes(unresolvedGenericTypes);

            done = true;
            for (let i = 0; i < todoList.length; i++) {
                let tv = todoList[i];
                let ready: boolean = true;
                let ext: TypeNode[] = tv.tpn.extends == null ? [] : [tv.tpn.extends];
                if (tv.tpn.implements != null) ext = ext.concat(tv.tpn.implements);
                for (let extType of ext) {
                    if (extType.genericParameterTypes != null && !(extType.genericParameterTypesResolved == true)) {
                        ready = false;
                    }
                }

                if (ready) {
                    this.resolveTypeVariable(tv);
                    todoList.splice(todoList.indexOf(tv), 1);
                    i--;
                    done = false;
                }
            }


        }

        return unresolvedGenericTypes;
    }


    resolveTypeVariable(tp: TypeParameterInfo) {


        let typeParameterKlass: Klass;
        if (tp.tpn.extends != null && tp.tpn.extends.resolvedType != null) {
            typeParameterKlass = (<Klass>tp.tpn.extends.resolvedType).clone();
        } else {
            typeParameterKlass = objectType.clone();
        }

        typeParameterKlass.identifier = tp.tpn.identifier;
        typeParameterKlass.isTypeVariable = true;

        typeParameterKlass.declaration = {
            module: tp.ci.module,
            position: tp.tpn.position
        };


        if (tp.tpn.implements != null) {
            for (let impl of tp.tpn.implements) {
                if (typeParameterKlass.implements.indexOf(<Interface>impl.resolvedType) < 0) {
                    typeParameterKlass.implements.push(<Interface>impl.resolvedType);
                }
            }
        }

        let tp1: TypeVariable = {
            identifier: tp.tpn.identifier,
            type: typeParameterKlass,
            scopeFrom: tp.cdn.position,
            scopeTo: tp.cdn.scopeTo
        };

        tp.ci.typeVariables[tp.index] = tp1;
        tp.ci.typeVariablesReady = true;
        for (let tv of tp.ci.typeVariables) if (tv == null) tp.ci.typeVariablesReady = false;

        let typeParameterList = this.moduleToTypeParameterListMap.get(tp.ci.module);
        if (typeParameterList == null) {
            typeParameterList = [];
            this.moduleToTypeParameterListMap.set(tp.ci.module, typeParameterList);
        }

        typeParameterList.push(tp1);

        this.pushUsagePosition(tp.ci.module, tp.tpn.position, typeParameterKlass);

    }

    registerTypeVariables(cdn: ClassDeclarationNode | InterfaceDeclarationNode, classOrInterface: Klass | Interface) {
        let index = 0;
        for (let typeParameter of cdn.typeParameters) {
            if (typeParameter.extends != null) this.registerGenericType(typeParameter.extends, classOrInterface.module, true);
            if (typeParameter.implements != null) {
                for (let im of typeParameter.implements) {
                    this.registerGenericType(im, classOrInterface.module, true);
                }
            }

            classOrInterface.typeVariablesReady = false;
            classOrInterface.typeVariables.push(null); // leave room

            this.typeParameterList.push({
                tpn: typeParameter, tp: {
                    identifier: typeParameter.identifier,
                    type: null,
                    scopeFrom: cdn.position,
                    scopeTo: cdn.scopeTo
                }, ci: classOrInterface, cdn: cdn,
                index: index++
            });
        }
    }

    resolveTypesInModules() {
        for (let m of this.moduleStore.getModules(false)) {
            let ut: TypeNode[] = [];
            this.unresolvedTypes.set(m, ut);
            for (let tn of m.typeNodes) {
                if (tn.resolvedType == null) {
                    let typeModule = this.moduleStore.getType(tn.identifier);
                    if (typeModule != null) {
                        let type = typeModule.type;
                        this.pushUsagePosition(m, tn.position, type);
                        tn.resolvedType = getArrayType(type, tn.arrayDimension);
                        this.registerGenericType(tn, m, false);
                    } else {
                        ut.push(tn);
                    }
                }
            }
        }
    }

    registerGenericType(typeNode: TypeNode, module: Module, isInClassDefinition: boolean) {
        if (typeNode.genericParameterTypes != null) {
            if (isInClassDefinition) {
                this.genericTypesInClassDefinitions.push({ typeNode: typeNode, module: module });
            } else {
                this.genericTypes.push({ typeNode: typeNode, module: module });
            }
        } else {
            // new ArrayList<>() (without type Parameters!) should be castable to ANY other type with same name regarldess of it's type variable types (Java 7-style!)
            let type = typeNode.resolvedType;
            if (type != null && type instanceof Klass && type.typeVariables.length > 0) {
                let type1 = <Klass>type.clone();
                type1.typeVariables = []; // now this type can cast to ANY other type with same name regardless of it's type variable types!
                typeNode.resolvedType = type1;
            }
        }
    }

}

export function getArrayType(type: Type, arrayDimension: number) {
    while (arrayDimension > 0) {
        type = new ArrayType(type);
        arrayDimension--;
    }
    return type;
}