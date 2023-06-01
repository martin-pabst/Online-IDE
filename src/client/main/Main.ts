import jQuery from 'jquery';
import { ClassData, UserData, WorkspaceData, Workspaces } from "../communication/Data.js";
import { NetworkManager } from "../communication/NetworkManager.js";
import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, IntegerType, DoubleType, CharacterType, BooleanType, FloatType, longPrimitiveType, LongType, shortPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter, InterpreterState } from "../interpreter/Interpreter.js";
import { Workspace } from "../workspace/Workspace.js";
import { ActionManager } from "./gui/ActionManager.js";
import { BottomDiv } from "./gui/BottomDiv.js";
import { Editor } from "./gui/Editor.js";
import { Formatter } from "./gui/Formatter.js";
import { Helper } from "./gui/Helper.js";
import { MainMenu } from "./gui/MainMenu.js";
import { ProgramControlButtons } from "./gui/ProgramControlButtons.js";
import { ProjectExplorer } from "./gui/ProjectExplorer.js";
import { RightDiv } from "./gui/RightDiv.js";
import { Sliders } from "./gui/Sliders.js";
import { TeacherExplorer } from "./gui/TeacherExplorer.js";
import { ThemeManager } from "./gui/ThemeManager.js";
import { Login } from "./Login.js";
import { MainBase } from "./MainBase.js"
import { Module, File } from "../compiler/parser/Module.js";
import { TextPosition } from "../compiler/lexer/Token.js";
import { ViewModeController } from "./gui/ViewModeController.js";
import { ErrorManager } from "./gui/ErrorManager.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
import { SynchronizationManager } from "../repository/synchronize/RepositorySynchronizationManager.js";
import { RepositoryCreateManager } from "../repository/update/RepositoryCreateManager.js";
import { RepositorySettingsManager } from "../repository/update/RepositorySettingsManager.js";
import { RepositoryCheckoutManager } from "../repository/update/RepositoryCheckoutManager.js";
import { WindowStateManager } from "./gui/WindowStateManager.js";
import { TextPositionWithModule } from "../compiler/types/Types.js";
import { checkIfMousePresent } from "../tools/HtmlTools.js";
import { InconsistencyFixer } from "../workspace/InconsistencyFixer.js";
import { SpriteManager } from "../spritemanager/SpriteManager.js";
import * as PIXI from 'pixi.js';
import { PruefungManagerForStudents } from './pruefung/PruefungManagerForStudents.js';
import { DatabaseSSEListener } from '../tools/database/DatabaseSSEListener.js';
import { SSEManager } from '../communication/SSEManager.js';

export class Main implements MainBase {

    pixiApp: PIXI.Application;
    userSpritesheet: PIXI.Spritesheet;

    repositoryOn: boolean = true;

    isTest(): boolean {
        return window.location.href.indexOf('online-ide') < 0;
    }

    isEmbedded(): boolean { return false; }

    getInterpreter(): Interpreter {
        return this.interpreter;
    }
    getCurrentWorkspace(): Workspace {
        return this.currentWorkspace;
    }
    getDebugger(): Debugger {
        return this.debugger;
    }
    getMonacoEditor(): monaco.editor.IStandaloneCodeEditor {
        return this.editor.editor;
    }

    getRightDiv(): RightDiv {
        return this.rightDiv;
    }

    getBottomDiv(): BottomDiv {
        return this.bottomDiv;
    }

    // VORSICHT: ggf. Module -> any
    getCurrentlyEditedModule(): Module {
        return this.projectExplorer.getCurrentlyEditedModule();
    }

    getActionManager(): ActionManager {
        return this.actionManager;
    }

    showProgramPointerPosition(file: File, position: TextPosition) {
        this.projectExplorer.showProgramPointerPosition(file, position);
    }
    hideProgramPointerPosition() {
        this.projectExplorer.hideProgramPointerPosition();
    }

    getCompiler(): Compiler {
        return this.compiler;
    }

    setModuleActive(module: Module) {
        this.projectExplorer.setModuleActive(module);
    }

    getSemicolonAngel(): SemicolonAngel {
        return this.semicolonAngel;
    }

    jumpToDeclaration(module: Module, declaration: TextPositionWithModule) {
        this.projectExplorer.setModuleActive(module);
        this.editor.editor.revealLineInCenter(declaration.position.line);
        this.editor.editor.setPosition({column: declaration.position.column, lineNumber: declaration.position.line});
    }


    workspaceList: Workspace[] = [];
    workspacesOwnerId: number;

    // monaco_editor: monaco.editor.IStandaloneCodeEditor;
    editor: Editor;
    currentWorkspace: Workspace;
    projectExplorer: ProjectExplorer;
    teacherExplorer: TeacherExplorer;
    networkManager: NetworkManager;
    actionManager: ActionManager;
    mainMenu: MainMenu;

    synchronizationManager: SynchronizationManager;
    repositoryCreateManager: RepositoryCreateManager;
    repositoryUpdateManager: RepositorySettingsManager;
    repositoryCheckoutManager: RepositoryCheckoutManager;

    pruefungManagerForStudents: PruefungManagerForStudents;

    spriteManager: SpriteManager;

    windowStateManager: WindowStateManager = new WindowStateManager(this);

    login: Login;

    compiler: Compiler;

    interpreter: Interpreter;

    debugger: Debugger;

    semicolonAngel: SemicolonAngel;

    bottomDiv: BottomDiv;

    startupComplete = 2;
    waitForGUICallback: () => void;

    programIsExecutable = false;
    version: number = 0;

    timerHandle: any;

    user: UserData;
    userDataDirty: boolean = false;

    themeManager: ThemeManager;

    rightDiv: RightDiv;

    debounceDiagramDrawing: any;

    viewModeController: ViewModeController;

    initGUI() {

        checkIfMousePresent();
        
        this.login = new Login(this);
        let hashIndex: number = window.location.href.indexOf('#');
        if(hashIndex > 0){
    
            var ticket = window.location.href.substr(hashIndex + 1);
            window.history.replaceState({}, "Online-IDE", window.location.href.substr(0, hashIndex));
            this.login.initGUI(true);
            this.login.loginWithTicket(ticket);
    
        } else {
            this.login.initGUI(false);
        }
    


        this.actionManager = new ActionManager(null, this);
        this.actionManager.init();

        this.networkManager = new NetworkManager(this, jQuery('#bottomdiv-outer .jo_updateTimerDiv'));

        let sliders = new Sliders(this);
        sliders.initSliders();
        this.mainMenu = new MainMenu(this);
        this.projectExplorer = new ProjectExplorer(this, jQuery('#leftpanel>.jo_projectexplorer'));
        this.projectExplorer.initGUI();

        this.bottomDiv = new BottomDiv(this, jQuery('#bottomdiv-outer>.jo_bottomdiv-inner'), jQuery('body'));

        this.rightDiv = new RightDiv(this, jQuery('#rightdiv-inner'));
        this.rightDiv.initGUI();

        this.debugger = new Debugger(this, jQuery('#leftpanel>.jo_debugger'), jQuery('#leftpanel>.jo_projectexplorer'));

        this.interpreter = new Interpreter(this, this.debugger,
            new ProgramControlButtons(jQuery('#controls'), jQuery('#editor')),
            jQuery('#rightdiv-inner .jo_run'));
        this.interpreter.initGUI();

        this.initTypes();

        this.checkStartupComplete();

        //@ts-ignore
        window.UZIP = null; // needed by UPNG

        this.correctPIXITransform();

        PIXI.settings.RENDER_OPTIONS.hello = false; // don't show PIXI-Message in browser console

        this.themeManager = new ThemeManager();

        this.viewModeController = new ViewModeController(jQuery("#view-mode"), this);

        this.semicolonAngel = new SemicolonAngel(this);

    }

    correctPIXITransform() {

        PIXI.Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                // get the matrix values of the displayobject based on its transform properties..
                // lt.a = this._cx * this.scale.x;
                // lt.b = this._sx * this.scale.x;
                // lt.c = this._cy * this.scale.y;
                // lt.d = this._sy * this.scale.y;
                // lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                // lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
            //@ts-ignore
            if (this._parentID !== parentTransform._worldID) {
                // concat the parent matrix with the objects transform.
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                //@ts-ignore
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                this._worldID++;
            }
        };


    }

    initEditor() {
        this.editor = new Editor(this, true, false);
        new Formatter().init();
        // this.monaco_editor = 
        this.editor.initGUI(jQuery('#editor'));

        let that = this;
        jQuery(window).on('resize', (event) => {
            jQuery('#bottomdiv-outer').css('height', '150px');
            jQuery('#editor').css('height', (window.innerHeight - 150 - 30 - 2) + "px");
            that.editor.editor.layout();
            jQuery('#editor').css('height', "");

        });

        jQuery(window).trigger('resize');

//        this.checkStartupComplete();
    }

    initTeacherExplorer(classdata: ClassData[]) {
        if(this.teacherExplorer != null){
            this.teacherExplorer.removePanels();
        }
        this.teacherExplorer = new TeacherExplorer(this, classdata);
        this.teacherExplorer.initGUI();
    }


    // loadWorkspace() {
    //     this.workspaceList.push(getMockupWorkspace(this));
    //     this.projectExplorer.renderWorkspaces(this.workspaceList);
    //     this.projectExplorer.setWorkspaceActive(this.workspaceList[0]);
    //     this.checkStartupComplete();

    // }

    checkStartupComplete() {
        this.startupComplete--;
        if (this.startupComplete == 0) {
            this.start();
        }
    }

    initTypes() {
        voidPrimitiveType.init();
        intPrimitiveType.init();
        longPrimitiveType.init();
        shortPrimitiveType.init();
        floatPrimitiveType.init();
        doublePrimitiveType.init();
        booleanPrimitiveType.init();
        stringPrimitiveType.init();
        charPrimitiveType.init();

        IntegerType.init();
        LongType.init();
        FloatType.init();
        DoubleType.init();
        CharacterType.init();
        BooleanType.init();

    }

    start() {

        if (this.waitForGUICallback != null) {
            this.waitForGUICallback();
        }

        let that = this;
        setTimeout(() => {
            that.getMonacoEditor().layout();
        }, 200);

        this.compiler = new Compiler(this);

        this.startTimer();

        jQuery(window).on('unload', function() {
            
            if(navigator.sendBeacon && that.user != null){
                that.networkManager.sendUpdates(null, false, true);
                that.networkManager.sendUpdateUserSettings(() => {});
                that.interpreter.closeAllWebsockets();
                DatabaseSSEListener.closeSSE();
                SSEManager.close();
            }
            
        });

    }

    startTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
        }

        let that = this;
        this.timerHandle = setInterval(() => {

            that.compileIfDirty();

        }, 500);


    }

    compileIfDirty() {

        if (this.currentWorkspace == null) return;

        if (this.currentWorkspace.moduleStore.isDirty() &&
            this.compiler.compilerStatus != CompilerStatus.compiling
            && this.interpreter.state != InterpreterState.running
            && this.interpreter.state != InterpreterState.paused) {
            try {

                this.compiler.compile(this.currentWorkspace.moduleStore);

                let errors = this.bottomDiv?.errorManager?.showErrors(this.currentWorkspace);
                this.projectExplorer.renderErrorCount(this.currentWorkspace, errors);

                this.editor.onDidChangeCursorPosition(null); // mark occurrencies of symbol under cursor

                this.printProgram();

                if (this.projectExplorer) {
                    this.version++;
                }

                let startable = this.interpreter.getStartableModule(this.currentWorkspace.moduleStore) != null;

                if (startable &&
                    this.interpreter.state == InterpreterState.not_initialized) {
                    this.copyExecutableModuleStoreToInterpreter();
                    this.interpreter.setState(InterpreterState.done);
                    // this.interpreter.init();
                }

                if (!startable &&
                    (this.interpreter.state == InterpreterState.done || this.interpreter.state == InterpreterState.error)) {
                    this.interpreter.setState(InterpreterState.not_initialized);
                }

                this.drawClassDiagrams(!this.rightDiv.isClassDiagramEnabled());

            } catch (e) {
                console.error(e);
                this.compiler.compilerStatus = CompilerStatus.error;
            }

        }

    }
    printProgram() {

        this.bottomDiv.printModuleToBottomDiv(this.currentWorkspace, this.projectExplorer.getCurrentlyEditedModule());

    }

    drawClassDiagrams(onlyUpdateIdentifiers: boolean) {
        clearTimeout(this.debounceDiagramDrawing);
        this.debounceDiagramDrawing = setTimeout(() => {
            this.rightDiv?.classDiagram?.drawDiagram(this.currentWorkspace, onlyUpdateIdentifiers);
        }, 500);
    }

    copyExecutableModuleStoreToInterpreter() {
        let ms = this.currentWorkspace.moduleStore.copy();
        this.interpreter.moduleStore = ms;
        this.interpreter.moduleStoreVersion = this.version;

        if (this.interpreter.state == InterpreterState.not_initialized && this.programIsExecutable) {
            this.interpreter.setState(InterpreterState.done);
        }

    }

    removeWorkspace(w: Workspace) {
        this.workspaceList.splice(this.workspaceList.indexOf(w), 1);
    }

    restoreWorkspaces(workspaces: Workspaces, fixInconsistencies: boolean) {

        this.workspaceList = [];
        this.currentWorkspace = null;
        // this.monaco.setModel(monaco.editor.createModel("Keine Datei vorhanden." , "text"));
        this.getMonacoEditor().updateOptions({ readOnly: true });

        for (let ws of workspaces.workspaces) {

            let workspace: Workspace = Workspace.restoreFromData(ws, this);
            this.workspaceList.push(workspace);
            if (ws.id == this.user.currentWorkspace_id) {
                this.currentWorkspace = workspace;
            }
        }

        /**
         * Find inconsistencies and fix them
         */
        if(fixInconsistencies){
            new InconsistencyFixer().start(this.workspaceList, this.networkManager, this);
        }

        this.projectExplorer.renderWorkspaces(this.workspaceList);

        if (this.currentWorkspace == null && this.workspaceList.length > 0) {
            this.currentWorkspace = this.workspaceList[0];
        }

        if (this.currentWorkspace != null) {
            this.projectExplorer.setWorkspaceActive(this.currentWorkspace, true);
        } else {
            this.projectExplorer.setModuleActive(null);
        }

        if (this.workspaceList.length == 0) {

            Helper.showHelper("newWorkspaceHelper", this, this.projectExplorer.workspaceListPanel.$captionElement);

        }

        if(Math.random() < 0.9){
            Helper.showHelper("spritesheetHelper", this);
        }

    }

    restoreWorkspaceFromData(workspaceData: WorkspaceData): Workspace {
        return Workspace.restoreFromData(workspaceData, this);
    }


}

