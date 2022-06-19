import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { TextPositionWithModule } from "../../compiler/types/Types.js";
import { InputManager } from "../../interpreter/InputManager.js";
import { PrintManager } from "../../main/gui/PrintManager.js";
import { ProgramControlButtons } from "../../main/gui/ProgramControlButtons.js";
import { MainBase } from "../../main/MainBase.js";
import { GNGEreignisbehandlungHelper as GNGHelper } from "../../runtimelibrary/gng/GNGEreignisbehandlung.js";
import { ProcessingHelper } from "../../runtimelibrary/graphics/Processing.js";
import { WorldHelper } from "../../runtimelibrary/graphics/World.js";
import { TimerClass } from "../../runtimelibrary/Timer.js";
import { GamepadTool } from "../../tools/GamepadTool.js";
import { KeyboardTool } from "../../tools/KeyboardTool.js";
import { NPrimitiveTypeManager } from "../types/NPrimitiveTypeManager.js";
import { NLoadController } from "./NLoadController.js";
import { NThreadPool, NThreadPoolLstate } from "./NThreadPool.js";


type NInterpreterEvents = "stop" | "done" | "resetRuntime";

export class NInterpreter {

    loadController: NLoadController;
    threadPool: NThreadPool;

    isExternalTimer: boolean = false;
    timerId: any;
    timerIntervalMs: number = 16;

    mainModule: Module;
    moduleStore: ModuleStore;
    moduleStoreVersion: number = -100;

    printManager: PrintManager;
    inputManager: InputManager;

    keyboardTool: KeyboardTool;
    gamepadTool: GamepadTool;

    eventManager: EventManager<NInterpreterEvents> = new EventManager();
    private helperRegistry: Map<string, Object> = new Map();

    worldHelper: WorldHelper;
    gngEreignisbehandlungHelper: GNGHelper;
    processingHelper: ProcessingHelper;


    actions: string[] = ["start", "pause", "stop", "stepOver",
        "stepInto", "stepOut", "restart"];
    //NThreadPoolLstatus { done, running, paused, not_initialized }

    // buttonActiveMatrix[button][i] tells if button is active at 
    // InterpreterState i
    buttonActiveMatrix: { [buttonName: string]: boolean[] } = {
        "start": [true, false, true, false],
        "pause": [false, true, false, false],
        "stop": [false, true, true, false],
        "stepOver": [true, false, true, false],
        "stepInto": [true, false, true, false],
        "stepOut": [false, false, true, false],
        "restart": [true, true, true, false]
    }



    constructor(public main: MainBase, public primitiveTypes: NPrimitiveTypeManager, public controlButtons: ProgramControlButtons, $runDiv: JQuery<HTMLElement>) {

        this.printManager = new PrintManager($runDiv, this.main);
        this.inputManager = new InputManager($runDiv, this.main);
        if (main.isEmbedded()) {
            this.keyboardTool = new KeyboardTool(jQuery('html'), main);
        } else {
            this.keyboardTool = new KeyboardTool(jQuery(window), main);
        }

        this.gamepadTool = new GamepadTool();

        // TODO: This wires up speedcontrol with interpreter
        // controlButtons.setInterpreter(this);

        this.threadPool = new NThreadPool(this);
        this.loadController = new NLoadController(this.threadPool, this);
        this.initTimer();
    }

    getHelper<HelperType>(identifier: string):HelperType {
        return <HelperType>this.helperRegistry.get(identifier);
    }

    registerHelper(identifier: string, helper: Object){
        this.helperRegistry.set(identifier, helper);
    }

    initTimer() {

        let that = this;
        let periodicFunction = () => {

            if (!that.isExternalTimer) {
                that.timerFunction(that.timerIntervalMs);
            }

        }

        this.timerId = setInterval(periodicFunction, this.timerIntervalMs);

    }

    timerFunction(timerIntervalMs: number) {
        if (this.threadPool.state == NThreadPoolLstate.running) {
            this.loadController.tick(timerIntervalMs);
        }
    }

    executeOneStep(stepInto: boolean) {

        if (this.threadPool.state != NThreadPoolLstate.paused) {
            this.init();
            if(this.threadPool.state == NThreadPoolLstate.not_initialized){
                return;
            }
            this.resetRuntime();
        }

        this.threadPool.runSingleStepKeepingThread(stepInto, () => {
            this.pause();
        });
        if (!stepInto) {
            this.threadPool.setState(NThreadPoolLstate.running);
        }
    }

    showProgramPointer(position: TextPositionWithModule) {
        throw new Error("Method not implemented.");
    }

    pause() {
        this.threadPool.setState(NThreadPoolLstate.paused);
        this.threadPool.unmarkStep();
        this.showProgramPointer(this.threadPool.getNextStepPosition());
    }

    stop(restart: boolean) {

        this.inputManager.hide();
        this.threadPool.setState(NThreadPoolLstate.done);
        this.threadPool.unmarkStep();

        this.getTimerClass().stopTimer();

        this.eventManager.fireEvent("stop");

        if (this.worldHelper != null) {
            this.worldHelper.spriteAnimations = [];
        }
        this.gngEreignisbehandlungHelper?.detachEvents();
        this.gngEreignisbehandlungHelper = null;

        if (this.worldHelper != null) {
            this.worldHelper.cacheAsBitmap();
        }


        setTimeout(() => {
            this.main.hideProgramPointerPosition();
            if (restart) {
                this.start();
            }
        }, 500);


    }

    start() {

        this.main.getBottomDiv()?.console?.clearErrors();

        if (this.threadPool.state != NThreadPoolLstate.paused) {
            this.init();
            this.resetRuntime();
        }

        this.hideProgrampointerPosition();

        this.threadPool.setState(NThreadPoolLstate.running);

        this.getTimerClass().startTimer();

    }

    stepOut() {
        this.threadPool.stepOut(() => {
            this.pause();
        })
    }

    initGUI() {

        let that = this;

        let am = this.main.getActionManager();

        am.registerAction("interpreter.start", ['F4'],
            () => {
                if (am.isActive("interpreter.start")) {
                    this.start();
                } else {
                    this.pause();
                }

            }, "Programm starten", this.controlButtons.$buttonStart);

        am.registerAction("interpreter.pause", ['F4'],
            () => {
                if (am.isActive("interpreter.start")) {
                    this.start();
                } else {
                    this.pause();
                }

            }, "Pause", this.controlButtons.$buttonPause);

        am.registerAction("interpreter.stop", [],
            () => {
                this.stop(false);
            }, "Programm anhalten", this.controlButtons.$buttonStop);

        am.registerAction("interpreter.stepOver", ['F6'],
            () => {
                this.executeOneStep(false);
            }, "Einzelschritt (Step over)", this.controlButtons.$buttonStepOver);

        am.registerAction("interpreter.stepInto", ['F7'],
            () => {
                this.executeOneStep(true);
            }, "Einzelschritt (Step into)", this.controlButtons.$buttonStepInto);

        am.registerAction("interpreter.stepOut", [],
            () => {
                this.stepOut();
            }, "Step out", this.controlButtons.$buttonStepOut);

        am.registerAction("interpreter.restart", [],
            () => {
                this.stop(true);
            }, "Neu starten", this.controlButtons.$buttonRestart);

    }

    setState(oldState: NThreadPoolLstate, state: NThreadPoolLstate) {

        if (state == NThreadPoolLstate.done) {
            // TODO
            // this.closeAllWebsockets();
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

        if (state == NThreadPoolLstate.done) {
            this.eventManager.fireEvent("done");
            if (this.worldHelper != null) {
                this.worldHelper.clearActorLists();
            }
            this.gngEreignisbehandlungHelper?.detachEvents();
            this.gngEreignisbehandlungHelper = null;

        }

        if (oldState != NThreadPoolLstate.done && state == NThreadPoolLstate.done) {
            // TODO
            // this.debugger.disable();
            this.keyboardTool.unsubscribeAllListeners();
        }

        if ([NThreadPoolLstate.running, NThreadPoolLstate.paused].indexOf(oldState) < 0
            && state == NThreadPoolLstate.running) {
            // TODO
            //   this.debugger.enable();
        }

    }

    getStartableModule(moduleStore: ModuleStore): Module {

        let cem: Module;
        cem = this.main.getCurrentlyEditedModule();

        let currentlyEditedModuleIsClassOnly = false;

        // decide which module to start

        // first attempt: is currently edited Module startable?
        if (cem != null) {
            let currentlyEditedModule = moduleStore.findModuleByFile(cem.file);
            if (currentlyEditedModule != null) {
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
            for (let m of moduleStore.getModules(false)) {
                if (m.isStartable) {
                    return m;
                }
            }
        }

        return null;
    }

    resetRuntime() {
        this.printManager.clear();
        this.eventManager.fireEvent("resetRuntime");

        this.worldHelper?.destroyWorld();
        this.processingHelper?.destroyWorld();
        this.gngEreignisbehandlungHelper?.detachEvents();
        this.gngEreignisbehandlungHelper = null;
    }

    getTimerClass(): TimerClass {
        let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
        return <TimerClass>baseModule.typeStore.getType("Timer");
    }

    init() {

        this.main.getBottomDiv()?.console?.clearErrors();

        let cem = this.main.getCurrentlyEditedModule();

        cem.getBreakpointPositionsFromEditor();

        this.main.getBottomDiv()?.console?.clearExceptions();

        /*
            As long as there is no startable new Version of current workspace we keep current compiled modules so
            that variables and objects defined/instantiated via console can be kept, too. 
        */
        if (this.moduleStoreVersion != this.main.version && this.main.getCompiler().atLeastOneModuleIsStartable) {
            this.main.copyExecutableModuleStoreToInterpreter();
            this.main.getBottomDiv()?.console?.detachValues();  // detach values from console entries
        }

        let newMainModule = this.getStartableModule(this.moduleStore);

        if (newMainModule == null) {
            this.threadPool.setState(NThreadPoolLstate.not_initialized);
            return;
        }

        this.mainModule = newMainModule;

        this.threadPool.init(this.moduleStore, this.mainModule);
        this.threadPool.setState(NThreadPoolLstate.done);

    }

    hideProgrampointerPosition() {

        this.main.hideProgramPointerPosition();

    }


}