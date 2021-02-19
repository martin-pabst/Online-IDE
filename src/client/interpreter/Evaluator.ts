import { AdhocCompiler } from "../compiler/AdhocCompiler.js";
import { Program } from "../compiler/parser/Program.js";
import { SymbolTable } from "../compiler/parser/SymbolTable.js";
import { Heap, Value } from "../compiler/types/Types.js";
import { Main } from "../main/Main.js";
import { Workspace } from "../workspace/Workspace.js";
import { MainBase } from "../main/MainBase.js";

export class Evaluator {

    private programMap: Map<string, Map<number, Program>> = new Map();
    private compiler: AdhocCompiler;

    constructor(private workspace: Workspace, private main: MainBase){
        this.compiler = new AdhocCompiler(main);
    }

    compile(expression: string, symbolTable: SymbolTable): {error: string, program: Program} {

        if(symbolTable == null) return;

        let pmEntry = this.programMap.get(expression);
        if(pmEntry != null){
            let program = pmEntry.get(symbolTable.id);
            if(program != null){
                return {error: null, program: program};
            }
        } else {
            pmEntry = new Map();
            this.programMap.set(expression, pmEntry);
        }

        let moduleStore = this.workspace.moduleStore;
        let heap: Heap = this.main.getInterpreter().heap;

        if (expression.length > 0 && moduleStore != null) {

            let compilation = this.compiler.compile(expression, moduleStore, heap, symbolTable);

            if (compilation.errors.length > 0) {
                return { error: compilation.errors[0].text, program: null};
            } else {

                pmEntry.set(symbolTable.id, compilation.program);

                return {error: null, program: compilation.program};
            }

        } else {
            return {error: "Leerer Ausdruck", program: null};
        }
    }

    evaluate(expression: string, symbolTable?: SymbolTable): { error: string, value: Value } {

        if(symbolTable == null) symbolTable = this.main.getDebugger().lastSymboltable;

        let c = this.compile(expression, symbolTable);

        if(c?.error != null){
            return { error: c.error, value: null};
        }

        if(c == null){
            return { error: "Fehler beim Kompilieren", value: null};
        }

        let interpreter = this.main.getInterpreter();

        return interpreter.evaluate(c.program);

    }







}