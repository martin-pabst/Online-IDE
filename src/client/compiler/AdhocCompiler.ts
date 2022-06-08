import { MainBase } from "../main/MainBase.js";
import { NCodeGenerator } from "../newcompiler/compiler/NCodeGenerator.js";
import { NProgram } from "../newcompiler/compiler/NProgram.js";
import { NSymbolTable } from "../newcompiler/compiler/NSymbolTable.js";
import { Error, Lexer } from "./lexer/Lexer.js";
import { TokenType } from "./lexer/Token.js";
import { Module, ModuleStore } from "./parser/Module.js";
import { Parser } from "./parser/Parser.js";
import { getArrayType } from "./parser/TypeResolver.js";
import { Heap } from "./types/Types.js";

export type Compilation = {
    errors: Error[],
    program: NProgram,
    symbolTable: NSymbolTable
}

export class AdhocCompiler {

    moduleStore: ModuleStore;
    lexer: Lexer;
    module: Module;
    parser: Parser;
    codeGenerator: NCodeGenerator;

    constructor(private main: MainBase) {
        this.moduleStore = new ModuleStore(this.main, true);
        this.lexer = new Lexer();
        this.parser = new Parser(true);
        this.codeGenerator = new NCodeGenerator(main.getPrimitiveTypes());
        this.module = new Module(null, main);
    }

    compile(code: string, moduleStore: ModuleStore, heap: Heap, symbolTable?: NSymbolTable): Compilation {

        let t0 = performance.now();

        let errors: Error[] = [];

        this.module.clear();
        if (symbolTable == null) {
            symbolTable = new NSymbolTable(null, { column: 1, line: 1, length: 0 }, { column: 1, line: 100, length: 0 });
            symbolTable.beginsNewStackframe = true;
        } else {
            symbolTable = symbolTable.getImitation();
        }

        // 1st pass: lexing
        let lexed = this.lexer.lex(code);
        errors = lexed.errors;
        this.module.tokenList = lexed.tokens;

        // 2nd pass: parse tokenlist and generate AST

        let parser: Parser = new Parser(true);
        parser.parse(this.module);
        errors = errors.concat(this.module.errors[1]);

        // 3rd pass: resolve types and populate typeStores

        // TODO!

        // 4th pass: code generation

        // let codeGeneratorErrors = this.codeGenerator
        //     .startAdhocCompilation(this.module, this.moduleStore, symbolTable, heap);
        let codeGeneratorErrors = this.codeGenerator
           .startAdhocCompilation(this.module, moduleStore, symbolTable, heap);
        errors = errors.concat(codeGeneratorErrors);


        if (errors.length == 0) {

            // TODO!
           

        }

        let dt = performance.now() - t0;
        dt = Math.round(dt * 100) / 100;

        return {
            program: this.module.mainProgram,
            errors: errors,
            symbolTable: symbolTable
        };
    }


}