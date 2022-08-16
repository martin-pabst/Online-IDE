import { Module } from "src/client/compiler/parser/Module";
import { Type } from "src/client/compiler/types/Types";
import { NLibrary } from "../runtime/NStandardLibrary";

export class NExecutable {

    /**
     * Result of last compilation process:
     */
    modules: Module[] = [];
    types: Type[];
    typeToModuleMap: Map<Type, Module> = new Map();

    constructor() {

    }

    getModulesWichNeedCompiling(allModules: Module[], libraries: NLibrary) {
        let dirtyModules: Set<Module> = new Set();
        let cleanModules: Set<Module> = new Set();
        let newModules: Module[] = [];


        for(let m of allModules){
            if(this.modules.indexOf(m) < 0){
                newModules.push(m);
            } else if(m.file.dirty){
                dirtyModules.add(m);
            } else {
                cleanModules.add(m);
            }
        }

        

        let done: boolean = false;

        while(!done){
            done = true;
            for(let type of this.types){
                let module = this.typeToModuleMap.get(type);
                if(dirtyModules.has(module)){
                    type.usagePositions.forEach((textPositions, module1) => {
                        if(cleanModules.has(module1)){
                            cleanModules.delete(module1);
                            dirtyModules.add(module1);
                            done = false;
                        }
                    })
                }
            }
        }


    }




}