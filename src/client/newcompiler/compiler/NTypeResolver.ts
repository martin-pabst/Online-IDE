import { ClassDeclarationNode, EnumDeclarationNode, InterfaceDeclarationNode, TypeNode } from "src/client/compiler/parser/AST.js";
import { Module } from "src/client/compiler/parser/Module.js";
import { NLibrary } from "../runtime/NStandardLibrary.js";
import { NClass } from "../types/NClass.js";
import { NType } from "../types/NewType.js";

/**
 * Pass between parser and code generator
 */
export class NTypeResolver {

    typeList: NType[] = [];
    identifierToTypeMap: Map<string, NType[]> = new Map();  // there may be several generic variants for one identifier
    typeToModuleMap: Map<NType, Module> = new Map();

    classAstList: ClassDeclarationNode[] = [];
    interfaceAstList: InterfaceDeclarationNode[] = [];
    enumAstList: EnumDeclarationNode[] = [];

    unresolvedTypes: Map<Module, TypeNode[]>;

    constructor(public libraries: NLibrary[], public modules: Module[]){
        
        libraries.forEach(lib => lib.types.forEach(type => this.addType(type)));
        this.typeList.filter(type => type instanceof NClass).forEach((type:NClass) => type.clearVirtualMethodFlags());

        /**
         * TODO: find modules that are untouched and reuse their types from prior compilation
         */



        this.typeList.filter(type => type instanceof NClass).forEach((type:NClass) => {
            type.markVirtualMethodsInBaseClasses();
            type.computeFirstAttributeIndexAndInitialAttributeValues();
        });

    }

    resolveTypesInModules() {
        for (let m of this.modules) {
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

    findType(identifier: string):{type: NType, module: Module} {
        let types = this.identifierToTypeMap.get(identifier);
        if(types == null) return null;
        if(types.length > 0){
            type
        }
        return {type: types, module: this.typeToModuleMap.get(types)};
    }

    addType(type: NType, module: Module){
        this.typeList.push(type);
        let list: NType[] = this.identifierToTypeMap.get(type.identifier);
        if(list == null){
            list = [];
            this.identifierToTypeMap.set(type.identifier, list);
        }
        list.push(type);
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


}