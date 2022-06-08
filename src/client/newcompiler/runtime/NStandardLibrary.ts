import { NLibraryCompiler } from "../librarycompiler/LibraryCompiler.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NType } from "../types/NewType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { NArithmeticException, NClassCastException, NException, NThrowable } from "./NExceptions.js";

export class NStandardLibrary {

    types: NType[];

    constructor(private pt: NPrimitiveTypeManager){
        let libraryCompiler = new NLibraryCompiler(pt);
        this.types = libraryCompiler.compileAllSystemClasses(this.getUncompiledTypes());
    }

    getUncompiledTypes():NRuntimeObject[] {
        return [
            new NThrowable(), new NException(), new NArithmeticException(), new NClassCastException()
        ]
    }

}