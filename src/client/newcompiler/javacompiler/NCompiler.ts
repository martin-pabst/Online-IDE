import { Lexer } from "src/client/compiler/lexer/Lexer.js";
import { ModuleStore } from "src/client/compiler/parser/Module.js";
import { Parser } from "src/client/compiler/parser/Parser.js";
import { MainEmbedded } from "src/client/embedded/MainEmbedded.js";
import { MainBase } from "src/client/main/MainBase.js";
import { NLibrary } from "../runtime/NStandardLibrary.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { NCodeGenerator } from "./NCodeGenerator.js";
import { NTypeResolver } from "./NTypeResolver.js";

export enum NCompilerStatus {
    compiling, error, compiledButNothingToRun, readyToRun
}

export class NCompiler {

    compilerStatus: NCompilerStatus = NCompilerStatus.compiledButNothingToRun;

    atLeastOneModuleIsStartable: boolean;

    libraries: NLibrary[] = [];

    constructor(private main: MainBase) {
    }

    compile(moduleStore: ModuleStore): Error[] {

        this.compilerStatus = NCompilerStatus.compiling;

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
            m.colorInformation = lexed.colorInformation;
            
            if(m.file.name == this.main.getCurrentlyEditedModule()?.file?.name){
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

        let typeResolver = new NTypeResolver(this.libraries, moduleStore.getModules(false), 
        this.main.getPrimitiveTypes());
        typeResolver.start();

        // let typeResolver: TypeResolver = new TypeResolver(this.main);

        // Klass.count = 0;
        // Interface.count = 0;
        // typeResolver.start(moduleStore);
        // console.log("Klass-Klone: " + Klass.count + ", Interface-Klone: " + Interface.count);

        // 4th pass: code generation

        let codeGenerator = new NCodeGenerator(this.main.getPrimitiveTypes(), typeResolver);

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

            this.compilerStatus = NCompilerStatus.readyToRun;

        } else {

            this.compilerStatus = errorfree ? NCompilerStatus.error : NCompilerStatus.compiledButNothingToRun;

        }

        let dt = performance.now() - t0;
        dt = Math.round(dt * 100) / 100;

        let message = "Compiled in " + dt + " ms.";

        this.main.getCurrentWorkspace().compilerMessage = message;

        this.main.getSemicolonAngel().healSemicolons();

        return null;
    }

}