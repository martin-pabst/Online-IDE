import { NLibraryCompiler } from "../librarycompiler/NLibraryCompiler.js";
import { NRuntimeObject } from "../NRuntimeObject.js";
import { NClassLike } from "../types/NClass.js";
import { NType } from "../types/NType.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { NArithmeticException, NClassCastException, NException, NThrowable } from "./NExceptions.js";

export class NLibrary {

    /**
     * types and typeCache are set by libraryCompiler.compile
     */
    types: NType[];
    typeCache: Map<string, NClassLike>;

    constructor(private pt: NPrimitiveTypeManager){
        let libraryCompiler = new NLibraryCompiler(pt);
        libraryCompiler.compile(this);
    }

    getUncompiledTypes():NRuntimeObject[]{
        return [
            // Exceptions
            new NThrowable(), new NException(), new NArithmeticException(), new NClassCastException()
        ]
    }

}