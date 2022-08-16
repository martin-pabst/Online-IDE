import { Compiler } from "../compiler/Compiler.js";
import { TextPosition } from "../compiler/lexer/Token.js";
import { File, Module } from "../compiler/parser/Module.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
import { TextPositionWithModule } from "../compiler/types/Types.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter } from "../interpreter/Interpreter.js";
import { Workspace } from "../workspace/Workspace.js";
import { ActionManager } from "./gui/ActionManager.js";
import { BottomDiv } from "./gui/BottomDiv.js";
import { RightDiv } from "./gui/RightDiv.js";
import { NPrimitiveTypeManager } from "../newcompiler/types/NPrimitiveTypeManager.js";


export interface MainBase {
    printProgram();
    compileIfDirty();

    version: number;
    pixiApp: PIXI.Application;
    userSpritesheet: PIXI.Spritesheet;

    getCurrentlyEditedModule(): import("../compiler/parser/Module").Module;
    drawClassDiagrams(onlyUpdateIdentifiers: boolean);
    getMonacoEditor(): monaco.editor.IStandaloneCodeEditor;
    getInterpreter(): Interpreter;
    getCurrentWorkspace(): Workspace;
    getDebugger(): Debugger;
    getRightDiv(): RightDiv;
    getBottomDiv(): BottomDiv;
    getActionManager(): ActionManager;
    getCompiler(): Compiler;
    copyExecutableModuleStoreToInterpreter(): void;
    showProgramPointerPosition(file: File, position: TextPosition);
    hideProgramPointerPosition();
    setModuleActive(module: Module);
    getSemicolonAngel(): SemicolonAngel;
    isEmbedded(): boolean;
    jumpToDeclaration(module: Module, declaration: TextPositionWithModule);
    getPrimitiveTypes(): NPrimitiveTypeManager;

    

}