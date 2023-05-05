import jQuery from 'jquery';
import { TextPosition, TokenType } from "../compiler/lexer/Token.js";
import { Module, ModuleStore } from "../compiler/parser/Module.js";
import { Program, Statement, ReturnStatement } from "../compiler/parser/Program.js";
import { ArrayType } from "../compiler/types/Array.js";
import { Klass, Interface } from "../compiler/types/Class.js";
import { Enum, EnumRuntimeObject } from "../compiler/types/Enum.js";
import { PrimitiveType, Type, Value, Heap, Method } from "../compiler/types/Types.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { Main } from "../main/Main.js";
import { Debugger } from "./Debugger.js";
import { RuntimeObject } from "./RuntimeObject.js";
import { intPrimitiveType, stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { InputManager } from "./InputManager.js";
import { WorldHelper } from "../runtimelibrary/graphics/World.js";
import { Helper } from "../main/gui/Helper.js";
import { TimerClass } from "../runtimelibrary/Timer.js";
import { KeyboardTool } from "../tools/KeyboardTool.js";
import { ProgramControlButtons } from "../main/gui/ProgramControlButtons.js";
import { MainBase } from "../main/MainBase.js";
import { ListHelper } from "../runtimelibrary/collections/ArrayList.js";
import { GroupHelper } from "../runtimelibrary/graphics/Group.js";
import { WebSocketRequestKeepAlive } from "../communication/Data.js";
import { MainEmbedded } from "../embedded/MainEmbedded.js";
import { ProcessingHelper } from "../runtimelibrary/graphics/Processing.js";
import { GNGEreignisbehandlungHelper } from "../runtimelibrary/gng/GNGEreignisbehandlung.js";
import { GamepadTool } from "../tools/GamepadTool.js";
import { ConnectionHelper } from "../runtimelibrary/database/Connection.js";
import { FileTypeManager } from '../main/gui/FileTypeManager.js';

export enum InterpreterState {
    not_initialized, running, paused, error, done, waitingForDB, waitingForInput, waitingForTimersToEnd
}

export type ProgramStackElement = {
    program: Program,
    programPosition: number,  // next position to execute after return
    textPosition: TextPosition, // textposition of method call
    method: Method | string,
    callbackAfterReturn: (interpreter: Interpreter) => void,
    isCalledFromOutside: string,
    stackElementsToPushBeforeFirstExecuting?: Value[]
};

export class Interpreter {

    debugger: Debugger;

    mainModule: Module;
    moduleStore: ModuleStore;
    moduleStoreVersion: number = -100;

    printManager: PrintManager;
    inputManager: InputManager;

    stepsPerSecond = 2;
    maxStepsPerSecond = 1000000;
    timerDelayMs = 10;

    timerId: any;
    state: InterpreterState;

    currentProgram: Program;
    currentProgramPosition: number;
    currentMethod: Method | string;
    currentCallbackAfterReturn: (interpreter: Interpreter) => void;
    currentIsCalledFromOutside: string

    programStack: ProgramStackElement[] = [];

    stack: Value[] = [];
    stackframes: number[] = [];
    currentStackframe: number;

    heap: Heap = {};

    timerStopped: boolean = true;
    timerExtern: boolean = false;

    steps: number = 0;
    timeNetto: number = 0;
    timeWhenProgramStarted: number = 0;

    stepOverNestingLevel: number = 0;
    leaveLine: number = -1;
    additionalStepFinishedFlag: boolean = false;

    isFirstStatement: boolean = true;

    showProgrampointerUptoStepsPerSecond = 15;

    worldHelper: WorldHelper;
    gngEreignisbehandlungHelper: GNGEreignisbehandlungHelper;
    processingHelper: ProcessingHelper;
    databaseConnectionHelpers: ConnectionHelper[] = [];

    keyboardTool: KeyboardTool;
    gamepadTool: GamepadTool;

    webSocketsToCloseAfterProgramHalt: WebSocket[] = [];

    pauseUntil?: number;

    actions: string[] = ["start", "pause", "stop", "stepOver",
        "stepInto", "stepOut", "restart"];

    // buttonActiveMatrix[button][i] tells if button is active at 
    // InterpreterState i
    buttonActiveMatrix: { [buttonName: string]: boolean[] } = {
        "start": [false, false, true, true, true, false],
        "pause": [false, true, false, false, false, false],
        "stop": [false, true, true, false, false, true],
        "stepOver": [false, false, true, true, true, false],
        "stepInto": [false, false, true, true, true, false],
        "stepOut": [false, false, true, false, false, false],
        "restart": [false, true, true, true, true, true]
    }

    callbackAfterExecution: () => void;

    constructor(public main: MainBase, public debugger_: Debugger, public controlButtons: ProgramControlButtons,
        $runDiv: JQuery<HTMLElement>) {
        this.printManager = new PrintManager($runDiv, this.main);
        this.inputManager = new InputManager($runDiv, this.main);
        if (main.isEmbedded()) {
            this.keyboardTool = new KeyboardTool(jQuery('html'), main);
        } else {
            this.keyboardTool = new KeyboardTool(jQuery(window), main);
        }

        this.gamepadTool = new GamepadTool();

        this.debugger = debugger_;

        controlButtons.setInterpreter(this);

        this.timeWhenProgramStarted = performance.now();
        this.steps = 0;
        this.timeNetto = 0;
        this.timerEvents = 0;

        this.timerDelayMs = 7;

        let that = this;

        let periodicFunction = () => {

            if (!that.timerExtern) {
                that.timerFunction(that.timerDelayMs, false, 0.7);
            }

        }

        this.timerId = setInterval(periodicFunction, this.timerDelayMs);

        let keepAliveRequest: WebSocketRequestKeepAlive = { command: 5 };
        let req = JSON.stringify(keepAliveRequest);
        setInterval(() => {
            that.webSocketsToCloseAfterProgramHalt.forEach(ws => ws.send(req));
        }, 30000);

    }

    initGUI() {

        let that = this;

        let am = this.main.getActionManager();

        let startFunction = () => {
            that.stepOverNestingLevel = 1000000;
            that.start();
        };

        let pauseFunction = () => {
            that.pause();
        };

        am.registerAction("interpreter.start", ['F4'],
            () => {
                if (am.isActive("interpreter.start")) {
                    startFunction();
                } else {
                    pauseFunction();
                }

            }, "Programm starten", this.controlButtons.$buttonStart);

        am.registerAction("interpreter.pause", ['F4'],
            () => {
                if (am.isActive("interpreter.start")) {
                    startFunction();
                } else {
                    pauseFunction();
                }

            }, "Pause", this.controlButtons.$buttonPause);

        am.registerAction("interpreter.stop", [],
            () => {
                that.stop(false);
                that.steps = 0;
            }, "Programm anhalten", this.controlButtons.$buttonStop);

        // this.controlButtons.$buttonEdit.on('click', (e) => {
        //     e.stopPropagation();
        //     am.trigger('interpreter.stop');
        // });

        am.registerAction("interpreter.stepOver", ['F6'],
            () => {
                this.oneStep(false);
            }, "Einzelschritt (Step over)", this.controlButtons.$buttonStepOver);

        am.registerAction("interpreter.stepInto", ['F7'],
            () => {
                this.oneStep(true);
            }, "Einzelschritt (Step into)", this.controlButtons.$buttonStepInto);

        am.registerAction("interpreter.stepOut", [],
            () => {
                this.stepOut();
            }, "Step out", this.controlButtons.$buttonStepOut);

        am.registerAction("interpreter.restart", [],
            () => {
                that.stop(true);
            }, "Neu starten", this.controlButtons.$buttonRestart);

        this.setState(InterpreterState.not_initialized);

    }

    getStartableModule(moduleStore: ModuleStore): Module {

        let cem: Module;
        cem = this.main.getCurrentlyEditedModule();

        let currentlyEditedModuleIsClassOnly = false;

        // decide which module to start

        // first attempt: is currently edited Module startable?
        if (cem != null) {
            let currentlyEditedModule = moduleStore.findModuleByFile(cem.file);
            if (currentlyEditedModule != null ) {
                currentlyEditedModuleIsClassOnly = !cem.hasErrors()
                    && !currentlyEditedModule.isStartable;
                if (currentlyEditedModule.isStartable) {
                    return currentlyEditedModule;
                }
            }
        }

        // second attempt: which module has been started last time?
        if (this.mainModule != null && currentlyEditedModuleIsClassOnly) {
            let lastMainModule = moduleStore.findModuleByFile(this.mainModule.file);
            if (lastMainModule != null && lastMainModule.isStartable) {
                return lastMainModule;
            }
        }

        // third attempt: pick first startable module of current workspace
        if (currentlyEditedModuleIsClassOnly) {
            for (let m of moduleStore.getJavaModules(false)) {
                if (m.isStartable) {
                    return m;
                }
            }
        }

        return null;
    }

    /*
        After user clicks start button (or stepover/stepInto-Button when no program is running) this
        method ist called.
    */
    init() {

        this.timerStopped = true;

        let cem = this.main.getCurrentlyEditedModule();

        cem.getBreakpointPositionsFromEditor();

        this.main.getBottomDiv()?.console?.clearExceptions();

        /*
            As long as there is no startable new Version of current workspace we keep current compiled modules so
            that variables and objects defined/instantiated via console can be kept, too. 
        */
        if (this.moduleStoreVersion != this.main.version && this.main.getCompiler().atLeastOneModuleIsStartable) {
            this.main.copyExecutableModuleStoreToInterpreter();
            this.heap = {}; // clear variables/objects defined via console
            this.main.getBottomDiv()?.console?.detachValues();  // detach values from console entries
        }

        let newMainModule = this.getStartableModule(this.moduleStore);

        if (newMainModule == null) {
            this.setState(InterpreterState.not_initialized);
            return;
        }

        this.mainModule = newMainModule;

        this.currentProgramPosition = 0;

        this.programStack = [];
        this.stack = [];
        this.stackframes = [];
        this.currentStackframe = 0;

        this.setState(InterpreterState.done);

        this.isFirstStatement = true;

        this.stepOverNestingLevel = 1000000;


        // Instantiate enum value-objects; initialize static attributes; call static constructors

        this.programStack.push({
            program: this.mainModule.mainProgram,
            programPosition: 0,
            textPosition: { line: 1, column: 1, length: 0 },
            method: "Hauptprogramm",
            callbackAfterReturn: null,
            isCalledFromOutside: "Hauptprogramm"

        })

        for (let m of this.moduleStore.getJavaModules(false)) {
            this.initializeEnums(m);
            this.initializeClasses(m);
        }

        this.popProgram();

    }

    popProgram() {
        let p = this.programStack.pop();
        this.currentProgram = p.program;
        this.currentProgramPosition = p.programPosition;
        this.currentMethod = p.method;
        this.currentCallbackAfterReturn = p.callbackAfterReturn;
        this.currentIsCalledFromOutside = p.isCalledFromOutside;
        if (p.stackElementsToPushBeforeFirstExecuting != null) {

            this.stackframes.push(this.currentStackframe == null ? 0 : this.currentStackframe);
            this.currentStackframe = this.stack.length;

            for (let se of p.stackElementsToPushBeforeFirstExecuting) this.stack.push(se);
            p.stackElementsToPushBeforeFirstExecuting = null;
        }
    }

    initializeClasses(m: Module) {

        for (let klass of m.typeStore.typeList) {
            if (klass instanceof Klass) {
                klass.staticClass.classObject = new RuntimeObject(klass.staticClass);
                klass.pushStaticInitializationPrograms(this.programStack);
            }

            if (klass instanceof Enum) {
                // let staticValueMap = klass.staticClass.classObject.attributeValues.get(klass.identifier);
                let staticValueList = klass.staticClass.classObject.attributes;
                for (let enumInfo of klass.enumInfoList) {
                    // staticValueMap.get(enumInfo.identifier).value = enumInfo.object;
                    staticValueList[enumInfo.ordinal].value = enumInfo.object;
                }
            }
        }
    }


    initializeEnums(m: Module) {

        for (let enumClass of m.typeStore.typeList) {
            if (enumClass instanceof Enum) {

                enumClass.pushStaticInitializationPrograms(this.programStack);

                let valueList: Value[] = [];

                let valueInitializationProgram: Program = {
                    module: enumClass.module,
                    labelManager: null,
                    statements: []
                };

                let hasAttributeInitializationProgram = enumClass.attributeInitializationProgram.statements.length > 0;

                if (hasAttributeInitializationProgram) {
                    this.programStack.push({
                        program: valueInitializationProgram,
                        programPosition: 0,
                        textPosition: { line: 1, column: 1, length: 0 },
                        method: "Attribut-Initialisierung der Klasse " + enumClass.identifier,
                        callbackAfterReturn: null,
                        isCalledFromOutside: "Initialisierung eines Enums"
                    });

                }


                for (let enumInfo of enumClass.enumInfoList) {
                    enumInfo.object = new EnumRuntimeObject(enumClass, enumInfo);

                    valueList.push({
                        type: enumClass,
                        value: enumInfo.object
                    });

                    if (enumInfo.constructorCallProgram != null) {
                        this.programStack.push({
                            program: enumInfo.constructorCallProgram,
                            programPosition: 0,
                            textPosition: { line: 1, column: 1, length: 0 },
                            method: "Konstruktor von " + enumClass.identifier,
                            callbackAfterReturn: null,
                            isCalledFromOutside: "Initialisierung eines Enums"
                        });

                    }

                    if (hasAttributeInitializationProgram) {
                        valueInitializationProgram.statements.push({
                            type: TokenType.initializeEnumValue,
                            position: enumInfo.position,
                            enumClass: enumClass,
                            valueIdentifier: enumInfo.identifier
                        })
                    }

                }

                if (hasAttributeInitializationProgram) {
                    valueInitializationProgram.statements.push({
                        type: TokenType.programEnd,
                        position: { line: 0, column: 0, length: 1 }
                    })
                }

                enumClass.valueList = {
                    type: new ArrayType(enumClass),
                    value: valueList
                };
            }
        }

    }

    timerEvents: number = 0;
    start(callback?: () => void) {

        this.main.getBottomDiv()?.console?.clearErrors();

        this.callbackAfterExecution = callback;

        this.isFirstStatement = true;

        this.pauseUntil = null;

        if (this.state == InterpreterState.error || this.state == InterpreterState.done) {
            this.init();
            this.resetRuntime();
        }

        this.setState(InterpreterState.running);

        this.hideProgrampointerPosition();

        this.timeWhenProgramStarted = performance.now();
        this.timerStopped = false;

        this.getTimerClass().startTimer();

    }

    getTimerClass(): TimerClass {
        let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
        return <TimerClass>baseModule.typeStore.getType("Timer");
    }

    lastStepTime: number = 0;
    lastTimeBetweenEvents: number = 0;

    timerFunction(timerDelayMs: number, forceRun: boolean, maxWorkloadFactor: number) {

        let t0 = performance.now();

        if (!forceRun) {
            let timeBetweenSteps = 1000 / this.stepsPerSecond;
            if (this.timerStopped || t0 - this.lastStepTime < timeBetweenSteps) return;
            this.lastStepTime = t0;
        }

        this.lastTimeBetweenEvents = t0 - this.lastStepTime;

        let n_stepsPerTimerGoal = forceRun ? Number.MAX_SAFE_INTEGER : this.stepsPerSecond * this.timerDelayMs / 1000;

        this.timerEvents++;

        let exception: string;
        let i = 0;

        while (i < n_stepsPerTimerGoal && !this.timerStopped && exception == null &&
            (performance.now() - t0) / timerDelayMs < maxWorkloadFactor
        ) {
            exception = this.nextStep();
            if (exception != null) {
                break;
            }

            if (this.stepsPerSecond <= this.showProgrampointerUptoStepsPerSecond && !forceRun) {
                this.showProgramPointerAndVariables();
            }

            if (this.state == InterpreterState.error ||
                this.state == InterpreterState.done) {
                this.timerStopped = true;
            }


            if (this.stepOverNestingLevel < 0 && !this.timerStopped) {
                let node = this.currentProgram.statements[this.currentProgramPosition];
                let position = node.position;
                if (position == null || position.line != this.leaveLine) {
                    this.timerStopped = true;
                    this.setState(InterpreterState.paused);

                    if (this.comesStatement(TokenType.closeStackframe)) {
                        exception = this.nextStep();
                        if (exception == null && this.comesStatement(TokenType.programEnd)) {
                            exception = this.nextStep();
                        }
                    }
                }

            }

            i++;
        }

        if (exception != null) {
            this.throwException(exception);
        }

        if (this.timerStopped) {
            if (this.state == InterpreterState.paused || this.state == InterpreterState.waitingForInput) {
                this.showProgramPointerAndVariables();
            }
            if (this.callbackAfterExecution != null) {
                this.callbackAfterExecution();
                this.callbackAfterExecution = null;
            }
        }

        let dt = performance.now() - t0;
        this.timeNetto += dt;

        // if (
        //     this.timerEvents % 300 == 0) {
        //     console.log("Last time between Events: " + this.lastTimeBetweenEvents);
        // }


    }

    throwException(exception: string) {
        this.timerStopped = true;
        this.setState(InterpreterState.error);

        let $errorDiv = jQuery('<div class="jo_exception"></div>');

        let consolePresent: boolean = true;
        if (this.main.isEmbedded()) {
            let mainEmbedded: MainEmbedded = <MainEmbedded>this.main;
            let config = mainEmbedded.config;
            if (config.withBottomPanel != true && config.withConsole != true) {
                consolePresent = false;
                let positionString = "";
                let currentStatement = this.currentProgram.statements[this.currentProgramPosition];
                if (currentStatement != null) {
                    let textPosition = currentStatement?.position;
                    positionString = " in Zeile " + textPosition.line + ", Spalte " + textPosition.column;

                    this.main.getBottomDiv()?.console?.showError(this.currentProgram.module, textPosition);
                }

                alert("Fehler" + positionString + ": " + exception);

            }
        }

        if (consolePresent) {
            $errorDiv.append(jQuery("<span class='jo_error-caption'>Fehler:</span>&nbsp;" + exception + "<br>"));
            this.pushCurrentProgram();

            let first = true;
            for (let i = this.programStack.length - 1; i >= 0; i--) {

                let p = this.programStack[i];
                let m = (p.method instanceof Method) ? p.method.identifier : p.method;
                let s: string = "<span class='jo_error-caption'>" + (first ? "Ort" : "aufgerufen von") + ": </span>" + m;
                if (p.textPosition != null) s += " <span class='jo_runtimeErrorPosition'>(Z " + p.textPosition.line + ", S " + p.textPosition.column + ")</span>";
                s += "<br>";
                let errorLine = jQuery(s);
                if (p.textPosition != null) {
                    let that = this;
                    jQuery(errorLine[2]).on('mousedown', () => {
                        that.main.getBottomDiv()?.console?.showError(p.program.module, p.textPosition);
                    });
                }
                $errorDiv.append(errorLine);

                first = false;
                if (p.isCalledFromOutside != null) {
                    break;
                }
            }

            let console = this.main.getBottomDiv()?.console;

            if (console != null) {
                console.writeConsoleEntry($errorDiv, null, 'rgba(255, 0, 0, 0.4');
                console.showTab();
            }
        }

    }

    hideProgrampointerPosition() {

        if (this.state == InterpreterState.running) {

            if (this.stepsPerSecond > this.showProgrampointerUptoStepsPerSecond) {
                this.main.hideProgramPointerPosition();
            }

        }

    }

    comesStatement(statement: TokenType) {
        if (this.currentProgram == null) return false;
        if (this.currentProgramPosition > this.currentProgram.statements.length - 1) return false;
        return this.currentProgram.statements[this.currentProgramPosition].type == statement;
    }

    resetRuntime() {
        this.printManager.clear();
        this.worldHelper?.destroyWorld();
        this.processingHelper?.destroyWorld();
        this.gngEreignisbehandlungHelper?.detachEvents();
        this.gngEreignisbehandlungHelper = null;

    }

    stop(restart: boolean = false) {
        this.inputManager.hide();
        this.setState(InterpreterState.paused);
        this.timerStopped = true;

        if (this.worldHelper != null) {
            this.worldHelper.spriteAnimations = [];
        }
        this.gngEreignisbehandlungHelper?.detachEvents();
        this.gngEreignisbehandlungHelper = null;

        this.main.hideProgramPointerPosition();

        this.getTimerClass().stopTimer();
        if (this.worldHelper != null) {
            this.worldHelper.cacheAsBitmap();
        }

        this.databaseConnectionHelpers.forEach((ch)=> ch.close());
        this.databaseConnectionHelpers = [];

        this.heap = {};
        this.programStack = [];
        this.stack = [];
        this.stackframes = [];


        setTimeout(() => {
            this.setState(InterpreterState.done);
            this.main.hideProgramPointerPosition();
            if (restart) {
                this.start();
            }
        }, 500);
    }

    pause() {
        this.setState(InterpreterState.paused);
        this.showProgramPointerAndVariables();
        this.timerStopped = true;
    }

    lastPrintedModule: Module = null;
    showProgramPointerAndVariables() {
        if (this.currentProgram == null) return;
        let node = this.currentProgram.statements[this.currentProgramPosition];
        if (node == null) return;
        let position = node.position;
        if (position != null) {
            this.main.showProgramPointerPosition(this.currentProgram.module.file, position);
            this.debugger.showData(this.currentProgram, position, this.stack, this.currentStackframe, this.heap);
            let bottomDiv = this.main.getBottomDiv();
            if (bottomDiv.programPrinter != null) {
                if (this.currentProgram.module != this.lastPrintedModule) {
                    this.main.getBottomDiv().printModuleToBottomDiv(null, this.currentProgram.module);
                    this.lastPrintedModule = this.currentProgram.module;
                }
                this.main.getBottomDiv().programPrinter.showNode(node);
            }
        }
    }

    stepOut() {
        this.stepOverNestingLevel = 0;
        this.start();
    }

    oneStep(stepInto: boolean) {
        this.main.getBottomDiv()?.console?.clearErrors();
        this.isFirstStatement = true;
        if (this.state != InterpreterState.paused) {
            this.init();
            if (this.state == InterpreterState.not_initialized) {
                return;
            }
            this.resetRuntime();
            this.showProgramPointerAndVariables();
            this.setState(InterpreterState.paused);
            // Are there static Variables to initialize?
            if (this.currentMethod == "Hauptprogramm") {
                // No static variable initializers
                this.return;
            }
        }
        this.stepOverNestingLevel = 10000;
        let oldStepOverNestingLevel = this.stepOverNestingLevel;
        let node = this.currentProgram.statements[this.currentProgramPosition];
        let position = node.position;
        let exception = this.nextStep();
        if (exception != null) {
            this.throwException(exception);
            return;
        }

        if (!stepInto && this.stepOverNestingLevel > oldStepOverNestingLevel) {
            this.stepOverNestingLevel = 0;
            if (position != null) {
                this.leaveLine = position.line;
            } else {
                this.leaveLine = -1;
            }
            this.start();
        } else
            //@ts-ignore
            if (this.state == InterpreterState.done) {
                this.main.hideProgramPointerPosition();
            } else {
                this.showProgramPointerAndVariables();
                //@ts-ignore
                if (this.state != InterpreterState.waitingForInput && this.state != InterpreterState.waitingForDB) {
                    this.setState(InterpreterState.paused);
                }
            }

    }

    stepFinished: boolean = false;

    nextStep(): string {

        this.stepFinished = false;

        let node: Statement;

        let exception: string;

        while (!this.stepFinished && !this.additionalStepFinishedFlag && exception == null) {


            if (this.currentProgram == null) {
                console.log("Interpeter.nextStep: Current program is null!");
                this.return;
            }

            if (this.currentProgramPosition > this.currentProgram.statements.length - 1) {
                this.setState(InterpreterState.done);
                break;
            }

            node = this.currentProgram.statements[this.currentProgramPosition];

            if (node.stepFinished != null) {
                this.stepFinished = node.stepFinished;
            }

            exception = this.executeNode(node);

        }

        this.additionalStepFinishedFlag = false;

        this.steps++;

        return exception;
    }

    executeNode(node: Statement): string {

        if (node.breakpoint != null && !this.isFirstStatement) {
            this.additionalStepFinishedFlag = true;
            this.pause();
            return;
        }

        this.isFirstStatement = false;
        let stackTop = this.stack.length - 1;
        let stackframeBegin = this.currentStackframe;
        let stack = this.stack;
        let value: Value;

        switch (node.type) {
            case TokenType.castValue:
                let relPos = node.stackPosRelative == null ? 0 : node.stackPosRelative;
                value = stack[stackTop + relPos];
                stack[stackTop + relPos] = value.type.castTo(value, node.newType);
                break;
            case TokenType.checkCast:
                value = stack[stackTop];
                if (value.value == null) break;
                let rto = <RuntimeObject>value.value;
                if (node.newType instanceof Klass) {
                    if (typeof rto == "object") {
                        if (!rto.class.hasAncestorOrIs(node.newType)) {
                            return ("Das Objekt der Klasse " + rto.class.identifier + " kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                    } else {
                        if (typeof rto == "number" && ["Integer", "Double", "Float"].indexOf(node.newType.identifier) < 0) {
                            return ("Eine Zahl kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        } else if (typeof rto == "string" && ["String", "Character"].indexOf(node.newType.identifier) < 0) {
                            return ("Eine Zeichenkette kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        } else if (typeof rto == "boolean" && node.newType.identifier != "Boolean") {
                            return ("Ein boolescher Wert kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                    }
                } else if (node.newType instanceof Interface) {
                    if (!(<Klass>rto.class).implementsInterface(node.newType)) {
                        return ("Das Objekt der Klasse " + rto.class.identifier + " implementiert nicht das Interface " + node.newType.identifier + ".");
                    }
                }
                break;
            case TokenType.localVariableDeclaration:
                let variable = node.variable;
                let type = variable.type;
                value = {
                    type: type,
                    value: null
                };
                if (type instanceof PrimitiveType) {
                    value.value = type.initialValue;
                }
                stack[variable.stackPos + stackframeBegin] = value;
                if (node.pushOnTopOfStackForInitialization) {
                    stack.push(value);
                }
                break;
            case TokenType.pushLocalVariableToStack:
                stack.push(stack[node.stackposOfVariable + stackframeBegin]);
                break;
            case TokenType.popAndStoreIntoVariable:
                stack[node.stackposOfVariable + stackframeBegin] = stack.pop();
                break;
            case TokenType.pushAttribute:
                let object1 = node.useThisObject ? stack[stackframeBegin].value : stack.pop().value;
                if (object1 == null) return "Zugriff auf ein Attribut (" + node.attributeIdentifier + ") des null-Objekts";
                let value1 = (<RuntimeObject>object1).getValue(node.attributeIndex);
                if (value1?.updateValue != null) {
                    value1.updateValue(value1);
                }
                stack.push(value1);
                break;
            case TokenType.pushArrayLength:
                let a = stack.pop().value;
                if (a == null) return "Zugriff auf das length-Attribut des null-Objekts";
                stack.push({ type: intPrimitiveType, value: (<any[]>a).length });
                break;
            case TokenType.assignment:
                value = stack.pop();
                stack[stackTop - 1].value = value.value;
                if (!(stack[stackTop - 1].type instanceof PrimitiveType)) {
                    stack[stackTop - 1].type = value.type;
                }
                if (!node.leaveValueOnStack) {
                    stack.pop();
                }
                break;
            case TokenType.plusAssignment:
                value = stack.pop();
                stack[stackTop - 1].value += value.value;
                break;
            case TokenType.minusAssignment:
                value = stack.pop();
                stack[stackTop - 1].value -= value.value;
                break;
            case TokenType.multiplicationAssignment:
                value = stack.pop();
                stack[stackTop - 1].value *= value.value;
                break;
            case TokenType.divisionAssignment:
                value = stack.pop();
                stack[stackTop - 1].value /= value.value;
                break;
            case TokenType.divisionAssignmentInteger:
                value = stack.pop();
                stack[stackTop - 1].value = Math.trunc(stack[stackTop - 1].value/value.value);
                break;
            case TokenType.moduloAssignment:
                value = stack.pop();
                stack[stackTop - 1].value %= value.value;
                break;
            case TokenType.ANDAssigment:
                value = stack.pop();
                stack[stackTop - 1].value &= value.value;
                break;
            case TokenType.ORAssigment:
                value = stack.pop();
                stack[stackTop - 1].value |= value.value;
                break;
            case TokenType.XORAssigment:
                value = stack.pop();
                stack[stackTop - 1].value ^= value.value;
                break;
            case TokenType.shiftLeftAssigment:
                value = stack.pop();
                stack[stackTop - 1].value <<= value.value;
                break;
            case TokenType.shiftRightAssigment:
                value = stack.pop();
                stack[stackTop - 1].value >>= value.value;
                break;
            case TokenType.shiftRightUnsignedAssigment:
                value = stack.pop();
                stack[stackTop - 1].value >>>= value.value;
                break;
            case TokenType.binaryOp:
                let secondOperand = stack.pop();
                let resultValue =
                    node.leftType.compute(node.operator, stack[stackTop - 1], secondOperand);
                let resultType = node.leftType.getResultType(node.operator, secondOperand.type);
                stack[stackTop - 1] = {
                    type: resultType,
                    value: resultValue
                };
                break;
            case TokenType.unaryOp:
                let oldValue = stack.pop();
                if (node.operator == TokenType.minus) {
                    stack.push({
                        type: oldValue.type,
                        value: -oldValue.value
                    })
                } else {
                    stack.push({
                        type: oldValue.type,
                        value: !oldValue.value
                    })
                }
                break;
            case TokenType.pushConstant:
                stack.push({
                    value: node.value,
                    type: node.dataType
                });
                break;
            case TokenType.pushStaticClassObject:
                if (node.klass instanceof Klass) {
                    stack.push({
                        type: node.klass.staticClass,
                        value: node.klass.staticClass.classObject
                    });
                } else {
                    // This is to enable instanceof operator with interfaces
                    stack.push({
                        type: node.klass,
                        value: node.klass
                    });
                }
                break;
            case TokenType.pushStaticAttribute:
                value = node.klass.classObject.getValue(node.attributeIndex);
                if (value.updateValue != null) {
                    value.updateValue(value);
                }
                stack.push(value);
                break;
            // case TokenType.pushStaticAttributeIntrinsic:
            //     value = node.
            //     stack.push({ type: node.attribute.type, value: node.attribute.updateValue(null) });
            //     break;
            case TokenType.selectArrayElement:
                let index = stack.pop();
                let array = stack.pop();

                if (array.value == null) return "Zugriff auf ein Element eines null-Feldes";

                if (index.value >= array.value.length || index.value < 0) {
                    return "Zugriff auf das Element mit Index " + index.value + " eines Feldes der Länge " + array.value.length;
                }
                stack.push(array.value[index.value]);
                break;

            case TokenType.callMainMethod:
                this.stack.push({ value: node.staticClass.classObject, type: node.staticClass });

                let parameter: Value = {
                    value: [{ value: "Test", type: stringPrimitiveType }],
                    type: new ArrayType(stringPrimitiveType)
                };
                let parameterBegin2 = stackTop + 2; // 1 parameter

                this.stack.push(parameter);

                this.stackframes.push(this.currentStackframe);
                this.programStack.push({
                    program: this.currentProgram,
                    programPosition: this.currentProgramPosition + 1,
                    textPosition: node.position,
                    method: this.currentMethod,
                    callbackAfterReturn: this.currentCallbackAfterReturn,
                    isCalledFromOutside: null
                });

                this.currentCallbackAfterReturn = null;
                this.currentStackframe = parameterBegin2;

                this.currentProgram = node.method.program;
                this.currentMethod = node.method;
                this.currentProgramPosition = -1; // gets increased after switch statement...

                for (let i = 0; i < node.method.reserveStackForLocalVariables; i++) {
                    stack.push(null);
                }

                // this.stepOverNestingLevel++;

                break;
            case TokenType.makeEllipsisArray:
                let ellipsisArray: Value[] = stack.splice(stack.length - node.parameterCount, node.parameterCount);

                stack.push({
                    value: ellipsisArray,
                    type: node.arrayType
                })

                break;
            case TokenType.callMethod:

                // node.stackframebegin = -(parameters.parameterTypes.length + 1)
                let method = node.method;

                let parameterBegin = stackTop + 1 + node.stackframeBegin;
                let parameters1 = method.parameterlist.parameters;
                for (let i = parameterBegin + 1; i <= stackTop; i++) {
                    if (this.stack[i] != null && this.stack[i].type instanceof PrimitiveType) {
                        stack[i] = {
                            type: parameters1[i - parameterBegin - 1].type,  // cast to parameter type...
                            value: stack[i].value
                        }
                    }
                }

                if (stack[parameterBegin].value == null && !method.isStatic) {
                    return "Aufruf der Methode " + method.identifier + " des null-Objekts";
                }

                if (method.isAbstract || method.isVirtual && !node.isSuperCall) {
                    let object = stack[parameterBegin];
                    if (object.value instanceof RuntimeObject) {
                        method = (<Klass>(<RuntimeObject>object.value).class).getMethodBySignature(method.signature);
                    } else {
                        method = (<Klass>object.type).getMethodBySignature(method.signature);
                    }
                }

                if (method == null) {
                    // TODO: raise runtime error
                    break;
                }

                if (method.invoke != null) {
                    let rt = method.getReturnType();
                    let parameters = stack.splice(parameterBegin);
                    let returnValue = method.invoke(parameters);
                    if (rt != null && rt.identifier != 'void') {
                        stack.push({
                            value: returnValue,
                            type: rt
                        });
                    }
                } else {
                    this.stackframes.push(this.currentStackframe);
                    this.programStack.push({
                        program: this.currentProgram,
                        programPosition: this.currentProgramPosition + 1,
                        textPosition: node.position,
                        method: this.currentMethod,
                        callbackAfterReturn: this.currentCallbackAfterReturn,
                        isCalledFromOutside: null
                    });

                    this.currentCallbackAfterReturn = null;
                    this.currentStackframe = parameterBegin;

                    this.currentProgram = method.program;
                    this.currentMethod = method;
                    this.currentProgramPosition = -1; // gets increased after switch statement...

                    for (let i = 0; i < method.reserveStackForLocalVariables; i++) {
                        stack.push(null);
                    }

                    this.stepOverNestingLevel++;
                    this.additionalStepFinishedFlag = true;
                }
                break;
            case TokenType.callInputMethod:

                // node.stackframebegin = -(parameters.parameterTypes.length + 1)
                let method1 = node.method;
                let parameterBegin1 = stackTop + 1 + node.stackframeBegin;
                let parameters = stack.splice(parameterBegin1);

                this.pauseForInput(InterpreterState.waitingForInput);

                let that = this;
                this.inputManager.readInput(method1, parameters, (value: Value) => {
                    that.resumeAfterInput(value);
                });
                break;

            case TokenType.return:
                this.return(node, stack);
                break;
            case TokenType.decreaseStackpointer:
                stack.splice(stackTop + 1 - node.popCount);
                break;
            case TokenType.initStackframe:
                this.stackframes.push(this.currentStackframe);
                this.currentStackframe = stackTop + 1;
                for (let i = 0; i < node.reserveForLocalVariables; i++) {
                    stack.push(null);
                }
                break;
            case TokenType.closeStackframe:
                stack.splice(stackframeBegin);
                this.currentStackframe = this.stackframes.pop();
                break;
            case TokenType.newObject:
                let object = new RuntimeObject(node.class);

                value = {
                    value: object,
                    type: node.class
                };

                stack.push(value);
                if (node.subsequentConstructorCall) {
                    stack.push(value);
                    stackTop++;
                }

                let klass: Klass = node.class;

                while (klass != null) {
                    let aip = klass.attributeInitializationProgram;
                    if (aip.statements.length > 0) {

                        this.stackframes.push(this.currentStackframe);
                        this.programStack.push({
                            program: this.currentProgram,
                            programPosition: this.currentProgramPosition + 1,
                            textPosition: node.position,
                            method: this.currentMethod,
                            callbackAfterReturn: this.currentCallbackAfterReturn,
                            isCalledFromOutside: null
                        });

                        this.currentCallbackAfterReturn = null;
                        this.currentStackframe = stackTop + 1;

                        this.currentProgram = aip;
                        this.currentProgramPosition = -1;
                        this.currentMethod = "Konstruktor von " + klass.identifier;
                        this.stepOverNestingLevel++;

                        this.additionalStepFinishedFlag = true;

                    }
                    klass = klass.baseClass;
                }

                // N.B.: constructor call is next statement

                break;
            case TokenType.processPostConstructorCallbacks:
                value = stack[stackTop];
                let classType = <Klass>value.type;
                for (let pcc of classType.getPostConstructorCallbacks()) {
                    pcc(value.value);
                }
                break;
            case TokenType.extendedForLoopInit:
                stack[node.stackPosOfCounter + stackframeBegin] = {
                    type: intPrimitiveType,
                    value: 0
                }
                break;
            case TokenType.extendedForLoopCheckCounterAndGetElement:
                let counter: number = stack[node.stackPosOfCounter + stackframeBegin].value++;
                let collection = stack[node.stackPosOfCollection + stackframeBegin].value;

                switch (node.kind) {
                    case "array":
                        if (counter < (<any[]>collection).length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = (<any[]>collection)[counter].value;
                            stack[node.stackPosOfElement + stackframeBegin].type = (<any[]>collection)[counter].type;
                        } else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                    case "internalList":
                        let list: any[] = (<ListHelper>(<RuntimeObject>collection).intrinsicData["ListHelper"]).valueArray;
                        if (counter < list.length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = list[counter].value;
                            stack[node.stackPosOfElement + stackframeBegin].type = list[counter].type;
                        } else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                    case "group":
                        let list1: any[] = (<GroupHelper>(<RuntimeObject>collection).intrinsicData["Actor"]).shapes;
                        if (counter < list1.length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = list1[counter];
                            stack[node.stackPosOfElement + stackframeBegin].type = list1[counter].klass;
                        } else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                }
                break;
            case TokenType.incrementDecrementCharBefore:
                value = stack[stackTop];
                let numberValue = (<string>value.value).charCodeAt(0) + node.incrementDecrementBy;
                value.value = String.fromCharCode(numberValue);
                break;
            case TokenType.incrementDecrementCharAfter:
                value = stack[stackTop];
                // replace value by copy:
                stack[stackTop] = {
                    value: value.value,
                    type: value.type
                };
                let numberValue1 = (<string>value.value).charCodeAt(0) + node.incrementDecrementBy;
                // increment value which is not involved in subsequent 
                value.value = String.fromCharCode(numberValue1);
                break;
            case TokenType.incrementDecrementBefore:
                value = stack[stackTop];
                value.value += node.incrementDecrementBy;
                break;
            case TokenType.incrementDecrementAfter:
                value = stack[stackTop];
                // replace value by copy:
                stack[stackTop] = {
                    value: value.value,
                    type: value.type
                };
                // increment value which is not involved in subsequent 
                value.value += node.incrementDecrementBy;
                break;
            case TokenType.jumpAlways:
                this.currentProgramPosition = node.destination - 1;
                break;
            case TokenType.jumpIfTrue:
                value = stack.pop();
                if (<boolean>value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfFalse:
                value = stack.pop();
                if (!(<boolean>value.value)) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfTrueAndLeaveOnStack:
                value = stack[stackTop];
                if (<boolean>value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfFalseAndLeaveOnStack:
                value = stack[stackTop];
                if (!(<boolean>value.value)) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.noOp:
                break;
            case TokenType.programEnd:

                if (this.programStack.length > 0) {
                    this.popProgram();
                    this.currentProgramPosition--; // gets increased later on after switch ends
                    this.additionalStepFinishedFlag = true;
                    this.leaveLine = -1;

                    if (node.pauseAfterProgramEnd) {
                        this.stepOverNestingLevel = -1;
                    }

                    break;
                }

                if ((this.worldHelper != null && this.worldHelper.hasActors()) || this.processingHelper != null
                    || (this.gngEreignisbehandlungHelper != null && this.gngEreignisbehandlungHelper.hasAktionsEmpfaenger())) {
                    this.currentProgramPosition--;
                    break
                }

                let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
                let timerClass: TimerClass = <TimerClass>baseModule.typeStore.getType("Timer");
                if (timerClass.timerEntries.length > 0) {
                    this.currentProgramPosition--;
                    break
                }

                // this.setState(InterpreterState.done);
                this.currentProgram = null;
                this.currentProgramPosition = -1;
                this.additionalStepFinishedFlag = true;

                Helper.showHelper("speedControlHelper", this.main);

                this.printManager.showProgramEnd();

                if (this.steps > 0) {
                    let dt = performance.now() - this.timeWhenProgramStarted;
                    let message = 'Executed ' + this.steps + ' steps in ' + this.round(dt)
                        + ' ms (' + this.round(this.steps / dt * 1000) + ' steps/s)';
                    this.main.getBottomDiv()?.console?.writeConsoleEntry(message, null);
                    // console.log(this.timerEvents + " TimeEvents in " + dt + " ms ergibt ein Event alle " + dt/this.timerEvents + " ms.");
                    // console.log("Vorgegebene Timerfrequenz: Alle " + this.timerDelayMs + " ms");
                    this.steps = -1;
                }

                // if (this.worldHelper != null) {
                //     this.worldHelper.spriteAnimations = [];
                // }
                // this.gngEreignisbehandlungHelper?.detachEvents();
                // this.gngEreignisbehandlungHelper = null;

                // this.main.hideProgramPointerPosition();

                // if(this.worldHelper != null){
                //     this.worldHelper.cacheAsBitmap();
                // }

                this.currentProgramPosition--;
                this.stop();
                break;
            case TokenType.print:
            case TokenType.println:
                let text = null;
                let color = null;
                if (node.withColor) color = <string | number>stack.pop().value;
                if (!node.empty) text = <string>stack.pop().value;
                if (node.type == TokenType.println) {
                    this.printManager.println(text, color);
                } else {
                    this.printManager.print(text, color);
                }
                break;
            case TokenType.pushEmptyArray:
                let counts: number[] = [];
                for (let i = 0; i < node.dimension; i++) {
                    counts.push(<number>stack.pop().value);
                }
                stack.push(this.makeEmptyArray(counts, node.arrayType));
                break;
            case TokenType.beginArray:
                stack.push({
                    type: node.arrayType,
                    value: []
                });
                break;
            case TokenType.addToArray:
                stackTop -= node.numberOfElementsToAdd;
                // let values: Value[] = stack.splice(stackTop + 1, node.numberOfElementsToAdd);
                let values: Value[] = stack.splice(stackTop + 1, node.numberOfElementsToAdd).map(tvo => ({ type: tvo.type, value: tvo.value }));
                stack[stackTop].value = (<any[]>stack[stackTop].value).concat(values);
                break;
            case TokenType.pushEnumValue:
                let enumInfo = node.enumClass.identifierToInfoMap[node.valueIdentifier];
                stack.push(node.enumClass.valueList.value[enumInfo.ordinal]);
                break;
            case TokenType.keywordSwitch:
                let switchValue = stack.pop().value;
                let destination = node.destinationMap[switchValue];
                if (destination != null) {
                    this.currentProgramPosition = destination - 1; // it will be increased after this switch-statement!
                } else {
                    if (node.defaultDestination != null) {
                        this.currentProgramPosition = node.defaultDestination - 1;
                    }
                    // there's a jumpnode after this node which jumps right after last switch case,
                    // so there's nothing more to do here.
                }
                break;
            case TokenType.heapVariableDeclaration:

                let v = node.variable;
                this.heap[v.identifier] = v;
                v.value = {
                    type: v.type,
                    value: (v.type instanceof PrimitiveType) ? v.type.initialValue : null
                }
                if (node.pushOnTopOfStackForInitialization) {
                    this.stack.push(v.value);
                }

                break;
            case TokenType.pushFromHeapToStack:
                let v1 = this.heap[node.identifier];
                if (v1 != null) {
                    this.stack.push(v1.value);
                } else {
                    return "Die Variable " + node.identifier + " ist nicht bekannt.";
                }
                break;
            case TokenType.returnIfDestroyed:
                let shapeRuntimeObject: RuntimeObject = this.stack[stackframeBegin].value;
                if (shapeRuntimeObject != null) {
                    let shape = shapeRuntimeObject.intrinsicData["Actor"];
                    if (shape["isDestroyed"] == true) {
                        this.return(null, stack);
                    }
                }
                break;
            case TokenType.setPauseDuration:
                let duration = this.stack.pop().value;
                if (this.pauseUntil == null) {
                    this.pauseUntil = performance.now() + duration;
                }
                break;
            case TokenType.pause:
                node.stepFinished = true;
                if (this.pauseUntil != null && performance.now() < this.pauseUntil) {
                    this.currentProgramPosition--;
                } else {
                    this.pauseUntil = null;
                }
                break;

        }


        this.currentProgramPosition++;

    }

    oldState: InterpreterState;
    pauseForInput(newState: InterpreterState){
        this.timerStopped = true;
        this.additionalStepFinishedFlag = true;
        this.oldState = this.state;
        this.setState(newState);
        if(newState == InterpreterState.waitingForInput){
            this.showProgramPointerAndVariables();
        }
    }
    
    resumeAfterInput(value: Value, popPriorValue: boolean = false){
        if(popPriorValue) this.stack.pop();
        if(value != null) this.stack.push(value);
        this.main.hideProgramPointerPosition();
        this.setState(InterpreterState.paused);
        if (this.oldState == InterpreterState.running) {
            this.start();
        } else {
            this.showProgramPointerAndVariables();
        }

    }


    return(node: ReturnStatement | null, stack: Value[]) {

        let currentCallbackAfterReturn = this.currentCallbackAfterReturn;

        if (node != null && node.copyReturnValueToStackframePos0) {
            let returnValue: Value = stack.pop();
            stack[this.currentStackframe] = returnValue;
            stack.splice(this.currentStackframe + 1);
        } else {
            stack.splice(this.currentStackframe + ((node != null && node.leaveThisObjectOnStack) ? 1 : 0));
        }

        this.currentStackframe = this.stackframes.pop();

        this.popProgram();
        if (node != null && node.methodWasInjected == true) this.currentProgramPosition++;
        this.currentProgramPosition--;  // position gets increased by one at the end of this switch-statement, so ... - 1
        this.stepOverNestingLevel--;

        if (currentCallbackAfterReturn != null) {
            currentCallbackAfterReturn(this);
        }

        if (this.stepOverNestingLevel < 0 && this.currentProgram.statements[this.currentProgramPosition + 1].type == TokenType.jumpAlways) {
            this.stepFinished = false;
        }

    }


    makeEmptyArray(counts: number[], type: Type): Value {
        let type1 = (<ArrayType>type).arrayOfType;
        if (counts.length == 1) {
            let array: Value[] = [];
            for (let i = 0; i < counts[0]; i++) {
                let v = {
                    type: type1,
                    value: null
                };

                if (type1 instanceof PrimitiveType) {
                    v.value = type1.initialValue;
                }

                array.push(v);

            }
            return {
                type: type,
                value: array
            };
        } else {
            let array: Value[] = [];
            let counts1 = counts.slice();
            let n = counts1.pop();
            for (let i = 0; i < n; i++) {
                array.push(this.makeEmptyArray(counts1, type1));
            }
            return {
                type: type,
                value: array
            };
        }
    }


    round(n: number): string {
        return "" + Math.round(n * 10000) / 10000;
    }

    runningStates: InterpreterState[] = [InterpreterState.paused, InterpreterState.running, InterpreterState.waitingForInput, InterpreterState.waitingForDB];

    setState(state: InterpreterState) {

        // console.log("Set state " + InterpreterState[state]);

        let oldState = this.state;
        this.state = state;

        if (state == InterpreterState.error || state == InterpreterState.done) {
            this.closeAllWebsockets();
        }

        let am = this.main.getActionManager();

        for (let actionId of this.actions) {
            am.setActive("interpreter." + actionId, this.buttonActiveMatrix[actionId][state]);
        }

        let buttonStartActive = this.buttonActiveMatrix['start'][state];

        if (buttonStartActive) {
            this.controlButtons.$buttonStart.show();
            this.controlButtons.$buttonPause.hide();
        } else {
            this.controlButtons.$buttonStart.hide();
            this.controlButtons.$buttonPause.show();
        }

        let buttonStopActive = this.buttonActiveMatrix['stop'][state];
        if (buttonStopActive) {
            // this.controlButtons.$buttonEdit.show();
        } else {
            // this.controlButtons.$buttonEdit.hide();
            if (this.worldHelper != null) {
                this.worldHelper.clearActorLists();
            }
            this.gngEreignisbehandlungHelper?.detachEvents();
            this.gngEreignisbehandlungHelper = null;
        }

        if (this.runningStates.indexOf(oldState) >= 0 && this.runningStates.indexOf(state) < 0) {
            this.debugger.disable();
            // this.main.getMonacoEditor().updateOptions({ readOnly: false });
            this.keyboardTool.unsubscribeAllListeners();
        }

        if (this.runningStates.indexOf(oldState) < 0 && this.runningStates.indexOf(state) >= 0) {
            this.debugger.enable();
            // this.main.getMonacoEditor().updateOptions({ readOnly: true });
        }

    }

    closeAllWebsockets() {
        this.webSocketsToCloseAfterProgramHalt.forEach(socket => socket.close());
        this.webSocketsToCloseAfterProgramHalt = [];
    }


    pushCurrentProgram() {

        if (this.currentProgram == null) return;

        let textPosition: TextPosition;
        let currentStatement = this.currentProgram.statements[this.currentProgramPosition];
        if (currentStatement != null) {
            textPosition = currentStatement.position;
        }

        this.programStack.push({
            program: this.currentProgram,
            programPosition: this.currentProgramPosition,
            textPosition: textPosition,
            method: this.currentMethod,
            callbackAfterReturn: this.currentCallbackAfterReturn,
            isCalledFromOutside: this.currentIsCalledFromOutside
        })

        this.currentCallbackAfterReturn = null;
        this.currentIsCalledFromOutside = null;

    }

    // runTimer(method: Method, stackElements: Value[],
    //     callbackAfterReturn: (interpreter: Interpreter) => void) {

    //     if(this.state != InterpreterState.running){
    //         return;
    //     }

    //     this.pushCurrentProgram();

    //     this.currentProgram = method.program;
    //     this.currentMethod = method;
    //     this.currentProgramPosition = 0;
    //     this.currentCallbackAfterReturn = callbackAfterReturn;
    //     this.currentIsCalledFromOutside = "Timer";

    //     this.stackframes.push(this.currentStackframe);
    //     this.currentStackframe = this.stack.length;
    //     for (let se of stackElements) this.stack.push(se);
    //     let statements = method.program.statements;

    //     // if program ends with return then this return-statement decreases stepOverNestingLevel. So we increase it
    //     // beforehand to compensate this effect.
    //     if(statements[statements.length - 1].type == TokenType.return) this.stepOverNestingLevel++;

    // }

    runTimer(method: Method, stackElements: Value[],
        callbackAfterReturn: (interpreter: Interpreter) => void, isActor: boolean) {

        if (this.state != InterpreterState.running) {
            return;
        }

        let statements = method.program.statements;

        if (isActor || this.programStack.length == 0) {
            // Main Program is running => Timer has higher precedence
            this.pushCurrentProgram();

            this.currentProgram = method.program;
            this.currentMethod = method;
            this.currentProgramPosition = 0;
            this.currentCallbackAfterReturn = callbackAfterReturn;
            this.currentIsCalledFromOutside = "Timer";

            this.stackframes.push(this.currentStackframe);
            this.currentStackframe = this.stack.length;
            this.stack = this.stack.concat(stackElements);
            // for (let se of stackElements) this.stack.push(se);

            // if program ends with return then this return-statement decreases stepOverNestingLevel. So we increase it
            // beforehand to compensate this effect.
            if (statements[statements.length - 1].type == TokenType.return) this.stepOverNestingLevel++;
        } else {
            // another Timer is running => queue up
            // position 0 in program stack is main program
            // => insert timer in position 1

            this.programStack.splice(1, 0, {
                program: method.program,
                programPosition: 0,
                textPosition: { line: 0, column: 0, length: 0 },
                method: method,
                callbackAfterReturn: callbackAfterReturn,
                isCalledFromOutside: "Timer",
                stackElementsToPushBeforeFirstExecuting: stackElements
            });

            if (statements[statements.length - 1].type == TokenType.return) this.stepOverNestingLevel++;


        }

    }

    evaluate(program: Program): { error: string, value: Value } {

        this.pushCurrentProgram();

        this.currentProgram = program;
        this.currentProgramPosition = 0;

        let stacksizeBefore = this.stack.length;

        let oldInterpreterState = this.state;
        let stepOverNestingLevel = this.stepOverNestingLevel;
        let additionalStepFinishedFlag = this.additionalStepFinishedFlag;

        let oldStackframe = this.currentStackframe;

        let error: string;
        let stepCount = 0;

        try {
            while (error == null &&
                (this.currentProgram != program || this.currentProgramPosition <
                    this.currentProgram.statements.length)
                && stepCount < 100000
                // && this.currentProgram == program
            ) {
                error = this.nextStep();
                stepCount++;
            }
        } catch (e) {
            error = "Fehler bei der Auswertung";
        }

        if (this.currentProgram == program && this.programStack.length > 0) {
            this.popProgram();
        }

        let stackTop: Value;
        if (this.stack.length > stacksizeBefore) {
            stackTop = this.stack.pop();

            while (this.stack.length > stacksizeBefore) {
                this.stack.pop();
            }

        }

        this.stepOverNestingLevel = stepOverNestingLevel;
        this.additionalStepFinishedFlag = additionalStepFinishedFlag;
        this.setState(oldInterpreterState);

        return {
            error: error,
            value: stackTop
        }

    }

    executeImmediatelyInNewStackframe(program: Program, valuesToPushBeforeExecuting: Value[]): { error: string, value: Value } {

        this.pushCurrentProgram();

        this.currentProgram = program;
        let oldProgramPosition = this.currentProgramPosition;
        this.currentProgramPosition = 0;

        let numberOfStackframesBefore = this.stackframes.length;
        this.stackframes.push(this.currentStackframe);
        let stacksizeBefore = this.stack.length;
        this.currentStackframe = stacksizeBefore;

        for (let v of valuesToPushBeforeExecuting) this.stack.push(v);

        let oldInterpreterState = this.state;
        let stepOverNestingLevel = this.stepOverNestingLevel;
        let additionalStepFinishedFlag = this.additionalStepFinishedFlag;


        let stepCount = 0;
        let error = null;

        try {
            while (this.stackframes.length > numberOfStackframesBefore
                && stepCount < 100000 && error == null
            ) {
                let node = this.currentProgram.statements[this.currentProgramPosition];

                error = this.executeNode(node);
                stepCount++;
            }
        } catch (e) {
            error = "Fehler bei der Auswertung";
        }

        if (stepCount == 100000) this.throwException("Die Ausführung des Konstruktors dauerte zu lange.");

        let stackTop: Value;
        if (this.stack.length > stacksizeBefore) {
            stackTop = this.stack.pop();

            while (this.stack.length > stacksizeBefore) {
                this.stack.pop();
            }

        }

        this.stepOverNestingLevel = stepOverNestingLevel;
        this.additionalStepFinishedFlag = additionalStepFinishedFlag;
        // this.currentProgramPosition++;

        this.currentProgramPosition = oldProgramPosition;
        this.setState(oldInterpreterState);

        return {
            error: error,
            value: stackTop
        }

    }

    instantiateObjectImmediately(klass: Klass): RuntimeObject {
        let object = new RuntimeObject(klass);

        let value = {
            value: object,
            type: klass
        };

        let klass1 = klass;

        while (klass1 != null) {
            let aip = klass1.attributeInitializationProgram;
            if (aip.statements.length > 0) {

                this.executeImmediatelyInNewStackframe(aip, [value]);

            }
            klass1 = klass1.baseClass;
        }

        let constructor = klass.getMethodBySignature(klass.identifier + "()");
        if (constructor != null && constructor.program != null) {
            // let programWithoutReturnStatement: Program = {
            //     labelManager: null,
            //     module: constructor.program.module,
            //     statements: constructor.program.statements.slice(0, constructor.program.statements.length - 1)
            // };
            this.executeImmediatelyInNewStackframe(constructor.program, [value]);
        }

        return object;

    }

    registerDatabaseConnection(ch: ConnectionHelper) {
        this.databaseConnectionHelpers.push(ch); 
    }


}