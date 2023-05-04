import { Error, Lexer } from "./lexer/Lexer.js";
import { CodeGenerator } from "./parser/CodeGenerator.js";
import { File, Module, ModuleStore } from "./parser/Module.js";
import { Parser } from "./parser/Parser.js";
import { TypeResolver, getArrayType } from "./parser/TypeResolver.js";
import { SymbolTable } from "./parser/SymbolTable.js";
import { Program } from "./parser/Program.js";
import { Workspace } from "../workspace/Workspace.js";
import { Heap } from "./types/Types.js";
import { Main } from "../main/Main.js";
import { TokenType } from "./lexer/Token.js";
import { MainBase } from "../main/MainBase.js";

export type Compilation = {
    errors: Error[],
    program: Program,
    symbolTable: SymbolTable
}

export class AdhocCompiler {

    moduleStore: ModuleStore;
    lexer: Lexer;
    module: Module;
    parser: Parser;
    codeGenerator: CodeGenerator;

    constructor(private main: MainBase) {
        this.moduleStore = new ModuleStore(this.main, true);
        this.lexer = new Lexer();
        this.parser = new Parser(true);
        this.codeGenerator = new CodeGenerator();
        this.module = new Module(null, main);
    }

    compile(code: string, moduleStore: ModuleStore, heap: Heap, symbolTable?: SymbolTable): Compilation {

        let t0 = performance.now();

        let errors: Error[] = [];

        this.module.clear();
        if (symbolTable == null) {
            symbolTable = new SymbolTable(null, { column: 1, line: 1, length: 0 }, { column: 1, line: 100, length: 0 });
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

        for (let typenode of this.module.typeNodes) {
            if (typenode.resolvedType == null) {
                let resolvedTypeAndModule = moduleStore.getType(typenode.identifier);
                if (resolvedTypeAndModule == null) {
                    errors.push({
                        text: "Der Datentyp " + typenode.identifier + " ist nicht bekannt.",
                        position: typenode.position,
                        level: "error"
                    })
                } else {
                    typenode.resolvedType = getArrayType(resolvedTypeAndModule.type, typenode.arrayDimension);
                }
            }
        }

        // 4th pass: code generation

        // let codeGeneratorErrors = this.codeGenerator
        //     .startAdhocCompilation(this.module, this.moduleStore, symbolTable, heap);
        let codeGeneratorErrors = this.codeGenerator
            .startAdhocCompilation(this.module, moduleStore, symbolTable, heap);
        errors = errors.concat(codeGeneratorErrors);



        if (errors.find(e => e.level == "error") == null) {

            let statements = this.module.mainProgram.statements;
            for (let statement of statements) {
                statement.stepFinished = false;
            }

            if (statements.length > 0 && statements[statements.length - 1].type == TokenType.programEnd) {
                statements.splice(statements.length - 1, 1);
            }

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