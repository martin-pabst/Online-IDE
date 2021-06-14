import { Interpreter } from "../interpreter/Interpreter.js";
import { ModuleStore, File, Module } from "../compiler/parser/Module.js";
import { Workspace } from "../workspace/Workspace.js";
import { Debugger } from "../interpreter/Debugger.js";
import { RightDiv } from "./gui/RightDiv.js";
import { BottomDiv } from "./gui/BottomDiv.js";
import { ActionManager } from "./gui/ActionManager.js";
import { Compiler } from "../compiler/Compiler.js";
import { TextPosition } from "../compiler/lexer/Token.js";
import { ErrorManager } from "./gui/ErrorManager.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
import { TextPositionWithModule } from "../compiler/types/Types.js";
import {GamepadTool} from "../tools/GamepadTool.js";

export interface MainBase {
    printProgram();
    compileIfDirty();

    version: number;
    pixiApp: PIXI.Application;

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

    

}