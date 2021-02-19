import { Error, Lexer } from "./lexer/Lexer.js";
import { CodeGenerator } from "./parser/CodeGenerator.js";
import { File, Module, ModuleStore } from "./parser/Module.js";
import { Parser } from "./parser/Parser.js";
import { TypeResolver } from "./parser/TypeResolver.js";
import { Main } from "../main/Main.js";
import { MainBase } from "../main/MainBase.js";
import { MainEmbedded } from "../embedded/MainEmbedded.js";
import { Klass, Interface } from "./types/Class.js";
import { SemicolonAngel } from "./parser/SemicolonAngel.js";

export enum CompilerStatus {
    compiling, error, compiledButNothingToRun, readyToRun
}

export class Compiler {

    compilerStatus: CompilerStatus = CompilerStatus.compiledButNothingToRun;

    atLeastOneModuleIsStartable: boolean;

    constructor(private main: MainBase) {
    }

    compile(moduleStore: ModuleStore): Error[] {

        this.compilerStatus = CompilerStatus.compiling;

        let t0 = performance.now();

        moduleStore.clearUsagePositions();

        let lexer = new Lexer();

        // 1st pass: lexing
        for (let m of moduleStore.getModules(false)) {
            m.file.dirty = false;
            m.clear();

            let lexed = lexer.lex(m.getProgramTextFromMonacoModel());
            m.errors[0] = lexed.errors;
            m.tokenList = lexed.tokens;
            m.bracketError = lexed.bracketError;
            if(m.file.name == this.main.getCurrentlyEditedModule().file.name){
                if(this.main.getBottomDiv() != null) this.main.getBottomDiv().errorManager.showParenthesisWarning(lexed.bracketError);
            }
        }

        // 2nd pass: parse tokenlist and generate AST

        this.main.getSemicolonAngel().startRegistering();

        let parser: Parser = new Parser(false);

        for (let m of moduleStore.getModules(false)) {
            parser.parse(m);
        }

        // 3rd pass: resolve types and populate typeStores; checks intermodular dependencies

        let typeResolver: TypeResolver = new TypeResolver(this.main);

        // Klass.count = 0;
        // Interface.count = 0;
        typeResolver.start(moduleStore);
        // console.log("Klass-Klone: " + Klass.count + ", Interface-Klone: " + Interface.count);

        // 4th pass: code generation

        let codeGenerator = new CodeGenerator();

        for (let m of moduleStore.getModules(false)) {
            codeGenerator.start(m, moduleStore);
        }

        let errorfree = true;
        for (let m of moduleStore.getModules(false)) {
            m.dependsOnModulesWithErrors = m.hasErrors();
            if(m.dependsOnModulesWithErrors) errorfree = false;
        }

        let done = false;
        while(!done){
            done = true;
            for (let m of moduleStore.getModules(false)) {
                if(!m.dependsOnModulesWithErrors)
                for (let m1 of moduleStore.getModules(false)) {
                    if(m.dependsOnModules.get(m1) && m1.dependsOnModulesWithErrors){
                        m.dependsOnModulesWithErrors = true;
                        done = false;
                        break;
                    }
                }                            
            }            
        }
        
        this.atLeastOneModuleIsStartable = false;        
        for (let m of moduleStore.getModules(false)) {
            m.isStartable = m.hasMainProgram() && !m.dependsOnModulesWithErrors;
            if(m.isStartable){
                this.atLeastOneModuleIsStartable = true;
            }
            if(!(this.main instanceof MainEmbedded) || this.main.config.withFileList){
                m.renderStartButton();
            } 
        }

        if (this.atLeastOneModuleIsStartable) {

            this.compilerStatus = CompilerStatus.readyToRun;

        } else {

            this.compilerStatus = errorfree ? CompilerStatus.error : CompilerStatus.compiledButNothingToRun;

        }

        let dt = performance.now() - t0;
        dt = Math.round(dt * 100) / 100;

        let message = "Compiled in " + dt + " ms.";

        this.main.getCurrentWorkspace().compilerMessage = message;

        this.main.getSemicolonAngel().healSemicolons();

        return null;
    }

}