import { TextPosition, TokenType } from "src/client/compiler/lexer/Token.js";
import { AttributeDeclarationNode, ClassDeclarationNode, EnumDeclarationNode, InterfaceDeclarationNode, MethodDeclarationNode, TypeNode } from "src/client/compiler/parser/AST.js";
import { Module } from "src/client/compiler/parser/Module.js";
import { TextPositionWithModule } from "src/client/compiler/types/Types.js";
import { NLibrary } from "../runtime/NStandardLibrary.js";
import { NArrayType } from "../types/NArray.js";
import { NAttributeInfo, NMethodInfo, NParameterlist, NVariable } from "../types/NAttributeMethod.js";
import { NClass, NClassLike, NGenericParameter, NInterface } from "../types/NClass.js";
import { NEnum } from "../types/NEnum.js";
import { NPrimitiveType } from "../types/NPrimitiveType.js";
import { NType } from "../types/NType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";

/**
 * Pass between parser and code generator
 */
export class NTypeResolver {

    globalTypeCache: Map<string, NType> = new Map();
    typeToModuleMap: Map<NType, Module> = new Map();

    classAstList: ClassDeclarationNode[] = [];
    interfaceAstList: InterfaceDeclarationNode[] = [];
    enumAstList: EnumDeclarationNode[] = [];

    typeNodeToModuleMap: Map<TypeNode, Module> = new Map();

    constructor(public libraries: NLibrary[], public modules: Module[], public pt: NPrimitiveTypeManager){
    }
     start(){
        
        this.pt.allPrimitiveTypes.forEach(type => this.addTypeToGlobalCache(type, null));

        this.libraries.forEach(lib => {
            lib.typeCache.forEach((value, key) => {
                this.globalTypeCache.set(key, value);
                if(value instanceof NClass) value.clearVirtualMethodFlags();
                value.usagePositions = new Map();
            });
        });

        this.modules.forEach(m => m.typeNodes.forEach(tn => this.typeNodeToModuleMap.set(tn, m)));

        /**
         * TODO: find modules that are untouched and reuse their types from prior compilation
         */

        /**
         * Step 1: class/interface/enum declarations
         */
        this.setupClassInterfaceEnums();

        /**
         * Step 2: setup attributes and methods
         */
        this.setupAttributesAndMethods();

        /**
         * Step3: all other types
         */
        this.resolveUnresolvedTypes();


        /**
         * Step 4: setupAllExtendedImplemented list for Interfaces
         */
        this.globalTypeCache.forEach((classlike, key) => {
            if(classlike instanceof NInterface && classlike.isParameterizedTypeOf == null){
                classlike.setupAllExtendedImplementedList([])
            }
        });
        
        /**
         * Step 5: initialize class declaration
         * and setupAllExtendedImplementedList for classes
         */
        this.globalTypeCache.forEach((classlike, key) => {
            if(classlike instanceof NClass){
                if(classlike.isParameterizedTypeOf == null){
                    classlike.markVirtualMethodsInBaseClasses();
                    classlike.setupRuntimeObjectPrototype();
                    classlike.computeFirstAttributeIndexAndInitialAttributeValues();
                    classlike.setupAllExtendedImplementedList([]);
                }  
            } 
        })


        /**
         * Step 6: check generic parameter values against type guards
         */
        this.checkGenericParameterValuesAgainstTypeGuards();

        /**
         * Step 7: check if classes implement their interfaces
         */

    }
    
    resolveUnresolvedTypes() {
        for(let mo of this.modules){
            for(let tn of mo.typeNodes){
                if(tn.resolvedType == null){
                    tn.resolvedType = this.findOrMakeType(tn, mo, (tn.classContext.type != TokenType.keywordEnum) ? tn.classContext.resolvedType : null);
                }
            }
        }
    }

    checkGenericParameterValuesAgainstTypeGuards(){
        this.globalTypeCache.forEach((classlike, key) => {
            if(classlike instanceof NClass || classlike instanceof NInterface){
                let genericBase = classlike.isParameterizedTypeOf;
                if(genericBase != null){
                    for(let i = 0; i < genericBase.genericParameters.length; i++){
                        let genericParameter = <NGenericParameter>genericBase.genericParameters[i];
                        let actualParameter = classlike.genericParameters[i];

                        for(let gpExtends of genericParameter.extends){
                            if(!actualParameter.extendsOtherClasslike(gpExtends)){
                                this.pushError(classlike.declaration, "Der " + (i+1) + "-te Wert des generischen Parameters (" + actualParameter.identifier + ") verletzt die Nebenbedingung '" + genericParameter.identifier + " extends " + gpExtends.identifier + "'.");
                            }
                        }

                    }
                }
            }
        });
    }
    
    setupAttributesAndMethods() {

        for(let cn of this.classAstList){
            let module = <Module>cn["module"];
            cn.attributes.forEach((a) => {this.setupAttribute(a, cn.resolvedType, module)});
            cn.methods.forEach((m)=>{this.setupMethod(m, cn.resolvedType, module)});
        }

        for(let cn of this.enumAstList){
            let module = <Module>cn["module"];
            cn.attributes.forEach((a) => {this.setupAttribute(a, cn.resolvedType, module)});
            cn.methods.forEach((m)=>{this.setupMethod(m, cn.resolvedType, module)});
        }


    }

    setupMethod(m: MethodDeclarationNode, ce: NClass|NEnum, module: Module) {
        let method = new NMethodInfo();
        method.identifier = m.identifier;
        method.visibility = m.visibility;
        method.isStatic = m.isStatic;
        method.isAbstract = m.isAbstract;
        method.declaration = {position: m.position, module: module};
        method.documentation = <string>m.commentBefore.value;
        method.annotation = m.annotation;
        method.isConstructor = m.isConstructor;

        let classContext = (!m.isStatic && (ce instanceof NClass)) ? null : <NClass>ce;
        if(m.returnType != null) method.returnType = this.findOrMakeType(m.returnType, module, classContext);
        let parameters: NVariable[] = [];
        for(let p of m.parameters){
            let variable = new NVariable(p.identifier, this.findOrMakeType(p.parameterType, module, classContext));
            variable.declaration = {position: p.position, module: module};
            variable.isEllipsis = p.isEllipsis;
            variable.isFinal = p.isFinal;
            parameters.push(variable);
        }
        method.parameterlist = new NParameterlist(parameters);
        ce.addMethod(method);
    }
    
    setupAttribute(a: AttributeDeclarationNode, ce: NClass|NEnum, module: Module) {
        let att = new NAttributeInfo(a.identifier, 
            this.findOrMakeType(a.attributeType, module, (!a.isStatic && (ce instanceof NClass)) ? null : <NClass>ce),
        a.isStatic, a.visibility, a.isFinal, <string>a.commentBefore.value);
        att.declaration = {position: a.position, module: module};
        att.annotation = a.annotation;
        att.isTransient = a.isTransient;
        ce.addAttribute(att);
    }



    setupClassInterfaceEnums() {
        for (let m of this.modules) {
            if (m.classDefinitionsAST != null) {
                for (let cdn of m.classDefinitionsAST) {
                    cdn["module"] = m;
                    switch (cdn.type) {
                        case TokenType.keywordClass:
                            this.classAstList.push(cdn);
                            let c = new NClass(cdn.identifier);
                            if(cdn.commentBefore != null) c.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = c;
                            c.visibility = cdn.visibility;
                            c.isAbstract = cdn.isAbstract;
                            this.addTypeToGlobalCache(c, m);
                            this.pushUsagePosition(m, cdn.position, c);
                            c.declaration = { module: m, position: cdn.position };
                            cdn.typeParameters.forEach(tp => { c.addGenericParameter(new NGenericParameter(tp.identifier))});
                            break;
                        case TokenType.keywordEnum:
                            this.enumAstList.push(cdn);
                            let e = new NEnum(cdn.identifier);
                            if(cdn.commentBefore != null) e.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = e;
                            e.visibility = cdn.visibility;
                            this.addTypeToGlobalCache(e, m);
                            this.pushUsagePosition(m, cdn.position, e);
                            e.declaration = { module: m, position: cdn.position };
                            break;
                        case TokenType.keywordInterface:
                            this.interfaceAstList.push(cdn);
                            let f = new NInterface(cdn.identifier);
                            if(cdn.commentBefore != null) f.documentation = "" + cdn.commentBefore.value;
                            cdn.resolvedType = f;
                            this.addTypeToGlobalCache(f, m);
                            this.pushUsagePosition(m, cdn.position, f);
                            f.declaration = { module: m, position: cdn.position };
                            cdn.typeParameters.forEach(tp => f.addGenericParameter(new NGenericParameter(tp.identifier)));
                            break;
                    }
                }
            }
        }

        /**
         * Resolve type guards for generic parameters and extended classes/implemented interfaces
         */
        for(let ci of this.classAstList){
            let module = <Module>ci["module"];
            this.resolveTypeGuards(ci, module);
        }

        for(let ci of this.classAstList){
            let module = <Module>ci["module"];
            let c = ci.resolvedType;
            if(ci.extends != null) c.extends = this.checkForBeingClass(this.findOrMakeType(ci.extends, module, c), ci.extends);
            if(ci.implements != null && ci.implements.length > 0){
                ci.implements.forEach(interfaceNode => c.implements.push(this.checkForBeingInterface(this.findOrMakeType(interfaceNode, module, c), interfaceNode)));
            }
        }

        for(let ci of this.interfaceAstList){
        }
        
        for(let ci of this.interfaceAstList){
            let module = <Module>ci["module"];
            this.resolveTypeGuards(ci, module);
            let c = ci.resolvedType;
            if(ci.extends != null && ci.extends.length > 0){
                ci.extends.forEach(interfaceNode => c.extendedInterfaces.push(this.checkForBeingInterface(this.findOrMakeType(interfaceNode, module, c), interfaceNode)));
            }
        }

    }

    private resolveTypeGuards(ci: ClassDeclarationNode|InterfaceDeclarationNode, module: Module) {
        let c = ci.resolvedType;
        for (let i = 0; i < ci.typeParameters.length; i++) {
            let tp = ci.typeParameters[i];
            let gp = <NGenericParameter>c.genericParameters[i];
            if (tp.extends != null)
                gp.extends.push(this.checkForBeingClass(this.findOrMakeType(tp.extends, module, c), tp.extends));
            if (tp.implements != null && tp.implements.length > 0) {
                tp.implements.forEach(tpi => gp.extends.push(this.checkForBeingInterface(this.findOrMakeType(tpi, module, c), tpi)));
            }
        }
    }

    checkForBeingClass(type: NType, typeNode: TypeNode): NClass {
        if(type instanceof NClass) return type;
        this.pushErrorWithTypeNode(typeNode, "Hier wird eine Klasse erwartet. Gefunden wurde: " + type.identifier);
        return null;
    }

    checkForBeingInterface(type: NType, typeNode: TypeNode): NInterface {
        if(type instanceof NInterface) return type;
        this.pushErrorWithTypeNode(typeNode, "Hier wird ein Interface erwartet. Gefunden wurde: " + type.identifier);
        return null;
    }

    findOrMakeType(typeNode: TypeNode, module: Module, classContext?: NClass|NInterface): NType {
        // First try: look for whole type in caches:
        let signature = this.getTypeSignature(typeNode);
        let type: NType;
        if(classContext != null){
            type = classContext.typeCache.get(signature);
            if(type != null){
                return typeNode.resolvedType = this.recursivelyPushUsagePosition(typeNode, type, module);
            } 
        }
        type = this.globalTypeCache.get(signature);
        if(type != null){
            return typeNode.resolvedType = this.recursivelyPushUsagePosition(typeNode, type, module);
        } 

        // Second: build new type
        if(classContext != null){
            type = classContext.typeCache.get(typeNode.identifier);
        }
        if(type == null) type = this.globalTypeCache.get(typeNode.identifier);
        
        if(type == null){
            if(typeNode.identifier == "string"){
                module.errors[2].push({
                    position: typeNode.position,
                    text: "Die Klasse " + typeNode.identifier + " konnte nicht gefunden werden." +
                        " Meinten Sie String (großgeschrieben)?",
                    level: "error",
                    quickFix: (typeNode.identifier == "string") ? {
                        title: "String groß schreiben",
                        editsProvider: (uri) => {
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: typeNode.position.line, startColumn: typeNode.position.column - 1, endLineNumber: typeNode.position.line, endColumn: typeNode.position.column + 6 },
                                        text: "String"
                                    }
                                }
                            ]
                        }

                    } : null
                });
            } else {
                this.pushErrorWithTypeNode(typeNode, "Der Typ " + typeNode.identifier + " konnte nicht gefunden werden.");
            }
            return null;
        }

        if(typeNode.genericParameterTypes != null && typeNode.genericParameterTypes.length > 0){
            if(type instanceof NClass || type instanceof NInterface){

                let parameterTypeMap: Map<NClassLike, NClassLike> = new Map();
                if(type.genericParameters.length != typeNode.genericParameterTypes.length){
                    this.pushErrorWithTypeNode(typeNode, "Die Klasse/das Interface " + type.identifier + " hat " + type.genericParameters.length + " generische Parameter. Hier sind aber " + typeNode.genericParameterTypes.length + " angegeben.");
                    return typeNode.resolvedType = type;
                }

                for(let i = 0; i < type.genericParameters.length; i++){
                    let ptn = typeNode.genericParameterTypes[i];
                    let genericType = type.genericParameters[i];
                    if(ptn == null) return type;
                    let pt = this.findOrMakeType(ptn, module);

                    /**
                     * TODO: check if pt respects typeGuards of genericType
                     */

                    if(!(pt instanceof NClass || pt instanceof NInterface)){
                        this.pushErrorWithTypeNode(ptn, "Als generische Parameter kommen nur Klassen und interfaces infrage. " + ptn.identifier + " ist weder eine Klasse noch ein Interface.");
                        return typeNode.resolvedType = type;
                    }
                    parameterTypeMap.set(genericType, pt);                                        
                }

                this.checkTypeBounds(type, type.genericParameters, parameterTypeMap, module);

                let boundGenericType = type.buildShallowGenericCopy(parameterTypeMap);
                typeNode.genericParameterTypesResolved = true;
                
                let ciType = <NClass|NInterface> type;
                if(boundGenericType.containsUnresolvedGenericParameters()){
                    ciType.typeCache.set(signature, boundGenericType);
                } else {
                    this.globalTypeCache.set(signature, boundGenericType);
                }

                type = boundGenericType;

            }
        } else {
            this.pushErrorWithTypeNode(typeNode, "Nur Klassen und Interfaces können generische Typparameter haben. Der Typ " + typeNode.identifier + " ist weder eine Klasse noch ein Interface.");
        }

        if(type != null){
            this.recursivelyPushUsagePosition(typeNode, type, module);
            if(typeNode.arrayDimension > 0){
                type = new NArrayType(type, typeNode.arrayDimension);
            }
            typeNode.resolvedType = type;
        } 


        return type;
    }
    
    checkTypeBounds(type: NInterface | NClass, genericParameters: NClassLike[], parameterTypeMap: Map<NClassLike, NClassLike>, module: Module) {
        throw new Error("Method not implemented.");
    }

    recursivelyPushUsagePosition(typeNode: TypeNode, type: NType, module: Module): NType {
        
        this.pushUsagePosition(module, typeNode.position, type);
        if(typeNode.genericParameterTypes != null){
            let ciType = <NClass|NInterface>type;
            for(let i = 0; i < typeNode.genericParameterTypes.length; i++){
                this.recursivelyPushUsagePosition(typeNode.genericParameterTypes[i],
                    ciType.genericParameters[i], module);
            }
        }
        
        return type;
    }


    pushError(textPosition: TextPositionWithModule, text: string){
        textPosition.module.errors[2].push({
            position: textPosition.position,
            text: text,
            level: "error"
        })
    }

    pushErrorWithTypeNode(typeNode: TypeNode, text: string){
        let module = this.typeNodeToModuleMap.get(typeNode);
        module.errors[2].push({
            position: typeNode.position,
            text: text,
            level: "error"
        })
    }


    getTypeSignature(node: TypeNode): string {
        let signature = node.identifier;
        if(node.genericParameterTypes != null && node.genericParameterTypes.length > 0){
            signature += "<" + node.genericParameterTypes.map(pt => this.getTypeSignature(pt)).join(", ") + ">";
        }
        return signature;
    }

    addTypeToGlobalCache(type: NType, module: Module){
        let signature = type.identifier;
        if(type instanceof NClassLike) signature = type.getSignature();

        let oldType = this.globalTypeCache.get(signature);
        if(oldType != null){
            this.pushError(type.declaration, "Der Typ " + type.identifier + " wurde zweimal definiert.");
        }

        this.globalTypeCache.set(signature, type);
        this.typeToModuleMap.set(type, module);
    }

    typeNodeToSignature(typeNode: TypeNode):string {

        let s = typeNode.identifier;
        if(typeNode.genericParameterTypes.length > 0){
            s += "<" + typeNode.genericParameterTypes.map(this.typeNodeToSignature).join(",") + ">";
        }
        s += "[]".repeat(typeNode.arrayDimension);
        return s;
    }

    pushUsagePosition(m: Module, position: TextPosition, element: NType | NMethodInfo | NAttributeInfo | NVariable) {

        m.addIdentifierPosition(position, element);

        if (element instanceof NPrimitiveType) {
            return;
        }

        let positionList: TextPosition[] = element.usagePositions.get(m);
        if (positionList == null) {
            positionList = [];
            element.usagePositions.set(m, positionList);
        }

        positionList.push(position);

    }


}