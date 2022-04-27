import { ModuleStore, Module } from "src/client/compiler/parser/Module.js";
import { TextPositionWithModule } from "src/client/compiler/types/Types.js";
import { NProgram, NStep } from "../compiler/NProgram.js";
import { NRuntimeObject, NStaticClassObject } from "../NRuntimeObject.js";
import { NClass } from "../types/NClass.js";
import { NInterpreter } from "./NInterpreter.js";

type NExceptionInfo = {
    types: string[],
    stepIndex: number,
    stackSize: number
}

type NException = {
    javaClass: string,
    message: string
}

type NProgramState = {
    program: NProgram;
    currentStepList: NStep[];   // Link to program.stepSingle or program.stepMultiple
    stepIndex: number;
    stackBase: number;
    callbackAfterFinished?: (value: any) => void;
    exceptionInfoList: NExceptionInfo[];
}

enum NThreadState { running, paused, exited, exitedWithException }

export enum NThreadPoolLstate { done, running, paused, not_initialized }

export class NThread {
    stack: any[];
    programStack: NProgramState[] = [];

    currentProgramState: NProgramState;  // also lies on top of programStack

    currentlyHeldSemaphors: NSemaphor[] = [];

    state: NThreadState;

    exception: NRuntimeObject;
    stackTrace: NProgramState[];

    stepEndsWhenProgramstackLengthLowerOrEqual: number;
    stepEndsWhenStepIndexGreater: number;
    stepCallback: () => void;

    constructor(public threadPool: NThreadPool, initialStack: any[]) {
        this.stack = initialStack;
    }

    /**
     * returns true if Thread exits
     */
    run(maxNumberOfSteps: number): NThreadState {
        let numberOfSteps = 0;
        let stack = this.stack; // for performance reasons
        this.state = NThreadState.running;

        try {
            //@ts-ignore
            while (numberOfSteps < maxNumberOfSteps && this.state != NThreadState.exited) {
                // For performance reasons: store all necessary data in local variables
                let currentProgramState = this.currentProgramState;
                let stepIndex = currentProgramState.stepIndex;
                let currentStepList = currentProgramState.currentStepList;
                let stackBase = currentProgramState.stackBase;
                let helper = currentProgramState.program.helper;

                if (this.stepEndsWhenProgramstackLengthLowerOrEqual >= 0) {
                    while (numberOfSteps < maxNumberOfSteps &&
                        this.state == NThreadState.running && !this.isSingleStepCompleted()) {
                        let step = currentStepList[stepIndex];
                        stepIndex = step.run(stack, stackBase, helper, this);
                        this.currentProgramState.stepIndex = stepIndex;
                        numberOfSteps++;
                    }
                    if (this.isSingleStepCompleted()) {
                        this.stepCallback();
                        this.state = NThreadState.paused;
                    }
                } else {
                    while (numberOfSteps < maxNumberOfSteps && this.state == NThreadState.running) {
                        let step = currentStepList[stepIndex];
                        stepIndex = step.run(stack, stackBase, helper, this);
                        numberOfSteps++;
                    }
                }


                currentProgramState.stepIndex = stepIndex;
                // this currentProgram might by now not be the same as before this inner while-loop
                // because callMethod or returnFromMethod may have been called since from within 
                // step.run
            }
        } catch(exception){
            let exceptionObject: NRuntimeObject;
            if(exception["javaClass"] != null){
                exceptionObject = this.threadPool.getExceptionObject(exception.javaClass, exception.message);
            } else {
                exceptionObject = this.threadPool.getExceptionObject("RuntimeException", exception + "");
            }
            this.throwException(exceptionObject);
        }

        return this.state;
    }

    

    isSingleStepCompleted() {
        return this.programStack.length < this.stepEndsWhenProgramstackLengthLowerOrEqual ||
            this.programStack.length == this.stepEndsWhenProgramstackLengthLowerOrEqual &&
            this.currentProgramState.stepIndex > this.stepEndsWhenStepIndexGreater;
    }

    markSingleStepOver(callbackWhenSingleStepOverEnds: () => void) {

        this.stepEndsWhenProgramstackLengthLowerOrEqual = this.programStack.length - 1;
        this.stepEndsWhenStepIndexGreater = this.currentProgramState.stepIndex;
        this.stepCallback = () => {
            this.stepEndsWhenProgramstackLengthLowerOrEqual = -1;
            callbackWhenSingleStepOverEnds();
        };

    }

    unmarkStep() {
        this.stepEndsWhenProgramstackLengthLowerOrEqual = -1;
    }

    markStepOut(callbackWhenStepOutEnds: () => void) {

        this.stepEndsWhenProgramstackLengthLowerOrEqual = this.programStack.length - 2;
        this.stepEndsWhenStepIndexGreater = -1;
        this.stepCallback = () => {
            this.stepEndsWhenProgramstackLengthLowerOrEqual = -1;
            callbackWhenStepOutEnds();
        };

    }


    throwException(exception: NRuntimeObject) {
        let exceptionClass: NClass = exception.__getClass();
        let className = exceptionClass.identifier;
        let classNames = exceptionClass.allExtendedImplementedTypes;

        let stackTrace: NProgramState[] = [];
        do {

            let ps = this.programStack[this.programStack.length - 1];
            for (let exInfo of ps.exceptionInfoList) {
                let found = false;
                if (exInfo.types.indexOf(className) >= 0) {
                    found = true;
                } else {
                    for (let cn of classNames) {
                        if (exInfo.types.indexOf(cn) >= 0) {
                            found = true;
                            break;
                        }
                    }
                }

                if (found) {
                    stackTrace.push(Object.assign(ps));
                    ps.stepIndex = exInfo.stepIndex;
                    this.stack.splice(exInfo.stackSize, this.stack.length - exInfo.stackSize);
                    this.stack.push(exception);
                    break;
                } else {
                    stackTrace.push(ps);
                    this.programStack.pop();
                }
            }

        } while (this.programStack.length > 0)

        if (this.programStack.length == 0) {
            this.stackTrace = stackTrace;
            this.exception = exception;
            this.state = NThreadState.exitedWithException;
        }
    }

    beginCatchExceptions(exceptionInfo: NExceptionInfo) {
        exceptionInfo.stackSize = this.stack.length;
        this.currentProgramState.exceptionInfoList.push(exceptionInfo);
    }

    endCatchExceptions() {
        this.currentProgramState.exceptionInfoList.pop();
    }

    aquireSemaphor(semaphor: NSemaphor) {
        if (!semaphor.aquire(this)) {
            this.state = NThreadState.exited;
        }
    }

    returnFromMethod(returnValue: any) {
        while (this.stack.length > this.currentProgramState.stackBase) {
            this.stack.pop();
        }

        if (returnValue != null) this.stack.push(returnValue);

        this.programStack.pop();
        if (this.programStack.length > 0) {
            this.currentProgramState = this.programStack[this.programStack.length - 1];
            if (this.threadPool.executeMode == NExecuteMode.singleSteps && this.currentProgramState.currentStepList == this.currentProgramState.program.stepsMultiple) {
                this.switchFromMultipleToSingleStep(this.currentProgramState);
            }
        } else {
            this.state = NThreadState.exited;
        }
    }

    switchFromMultipleToSingleStep(programState: NProgramState) {
        let multiStep = programState.currentStepList[programState.stepIndex];
        let singleStep = multiStep.correspondingStepInOtherStepmode;
        if (singleStep != null) {
            programState.currentStepList = programState.program.stepsSingle;
            programState.stepIndex = programState.currentStepList.indexOf(singleStep);
        }
    }

    /**
     * If a step calls a library method which itself calls thread.callMethod (e.g. to call toString())
     * then this call MUST BE the last statement of this step!
     */
    callCompiledMethod(program: NProgram, callbackAfterFinished?: (value: any) => void) {
        // Object creation is faster than Object.assign, see
        // https://measurethat.net/Benchmarks/Show/18401/0/objectassign-vs-creating-new-objects3
        let state: NProgramState = {
            program: program,
            currentStepList: this.threadPool.executeMode == NExecuteMode.singleSteps ? program.stepsSingle : program.stepsMultiple,
            stackBase: this.stack.length - program.numberOfParameters - program.numberOfLocalVariables - 2,  // 2 because of [this, thread, parameter 1, ..., parameter n]
            stepIndex: 0,
            callbackAfterFinished: callbackAfterFinished,
            exceptionInfoList: []
        }

        for (let i = 0; i < program.numberOfLocalVariables + 2; i++) {
            this.stack.push(null);
        }

        this.programStack.push(state);
        this.currentProgramState = state;
    }

    /**
     * Preconditions: 
     * a) this is on the stack
     * b) thread is on the stack
     * c) all parameters are on the stack
     * d) thread.callVirtualMethod is last statement of step
     */
    callVirtualMethod(parameterCount: number, signature: string, callbackAfterFinished?: (value: any) => void) {
        let runtimeObject = this.stack[this.stack.length - 2 - parameterCount]; // 2 because of [this, thread, parameter 1, ..., parameter n]
        let method = runtimeObject[signature];
        if (method.invoke != null) {
            this.callCompiledMethod(method, (returnValue) => {
                if (callbackAfterFinished != null) {
                    callbackAfterFinished(returnValue);
                } else {
                    if (typeof returnValue != "undefined") {
                        this.stack.push(returnValue);
                    }
                }
            });
        } else {
            let params: any[] = Array(parameterCount + 1);      // + 1 because of thread
            for (let i = 1; i <= parameterCount + 1; i++) {
                params[parameterCount - i] = this.stack.pop();
            }

            let returnValue = method.invoke.call(this.stack.pop(), params);

            if (callbackAfterFinished != null) {
                callbackAfterFinished(returnValue);
            } else {
                if (typeof returnValue != "undefined") {
                    this.stack.push(returnValue);
                }
            }
        }
    }

    callStaticMethod(classIdentifier: string, methodSignature: string) {

    }

    divide(a: number, b: number) {
        if (b == 0) {
            throw { class: "ArithmeticException", message: "Division durch 0 ist nicht definiert." };
        } else {
            return a / b;
        }
    }

    modulo(a: number, b: number) {
        if (b == 0) {
            throw { class: "ArithmeticException", message: "Modulo 0 ist nicht definiert." };
        } else {
            return a % b;
        }
    }

    cast(object: NRuntimeObject, klassOrInterface: string): NRuntimeObject {
        //@ts-ignore
        if(object != null && (<NClass>object.__class).allExtendedImplementedTypes.indexOf(klassOrInterface) < 0){
            //@ts-ignore
            throw { class: "ClassCastException", message: "Die Klasse " + object.__class.identifier + " " + " kann nicht nach " + klassOrInterface + " gecastet werden."}
        }
        return object;
    }

}

export enum NExecuteMode { singleSteps, multipleSteps };

export class NThreadPool {
    runningThreads: NThread[] = [];
    currentThreadIndex: number = 0;
    executeMode: NExecuteMode;
    semaphors: NSemaphor[] = [];
    state: NThreadPoolLstate;

    keepThread: boolean = false;    // for single step mode

    staticClassObjects: { [identifier: string]: NStaticClassObject };

    constructor(private interpreter: NInterpreter) {
        this.setState(NThreadPoolLstate.not_initialized);
    }

    run(numberOfStepsMax: number) {
        let stepsPerThread = Math.ceil(numberOfStepsMax / this.runningThreads.length);
        let numberOfSteps = 0;
        if (this.runningThreads.length == 0) return NThreadState.exited;

        if ([NThreadPoolLstate.done, NThreadPoolLstate.running].indexOf(this.state) < 0) {
            return;
        }

        this.setState(NThreadPoolLstate.running);

        while (numberOfSteps < numberOfStepsMax) {
            let currentThread = this.runningThreads[this.currentThreadIndex];

            let status = currentThread.run(stepsPerThread);
            numberOfSteps += stepsPerThread;

            switch (status) {
                case NThreadState.exited:

                    for (let semaphor of currentThread.currentlyHeldSemaphors) {
                        semaphor.release(currentThread);
                    }

                    this.runningThreads.splice(this.currentThreadIndex, 1);

                    if (this.runningThreads.length == 0) {
                        this.setState(NThreadPoolLstate.done);
                        return;
                    }

                    break;
                case NThreadState.exitedWithException:
                    // TODO: Print Exception
                    this.setState(NThreadPoolLstate.done);
                    return;
                case NThreadState.paused:
                    this.setState(NThreadPoolLstate.paused);
                    return;
            }

            if (!this.keepThread) {
                this.currentThreadIndex++;
                if (this.currentThreadIndex >= this.runningThreads.length) {
                    this.currentThreadIndex = 0;
                }
            }
        }


    }

    setState(newState: NThreadPoolLstate) {
        this.interpreter.setState(this.state, newState);
        this.state = newState;
    }

    runSingleStepKeepingThread(stepInto: boolean, callback: () => void) {
        this.keepThread = true;
        if (stepInto) {
            if (this.state <= NThreadPoolLstate.paused) {
                this.run(1);
            }
            this.keepThread = false;
            callback();
        } else {
            let thread = this.runningThreads[this.currentThreadIndex];
            if (thread == null) return;
            thread.markSingleStepOver(() => {
                this.keepThread = false;
                callback();
            });
        }
    }

    stepOut(callback: () => void) {
        this.keepThread = true;
        let thread = this.runningThreads[this.currentThreadIndex];
        if (thread == null) return;
        thread.markStepOut(() => {
            this.keepThread = false;
            callback();
        });
    }

    unmarkStep() {
        let thread = this.runningThreads[this.currentThreadIndex];
        thread.unmarkStep();
    }

    switchAllThreadsToSingleStepMode() {
        for (let thread of this.runningThreads) {
            this.switchThreadToSingleStepMode(thread);
        }

        for (let s of this.semaphors) {
            for (let thread of s.waitingThreads) {
                this.switchThreadToSingleStepMode(thread);
            }
        }
    }

    private switchThreadToSingleStepMode(thread: NThread) {
        let currentState = thread.currentProgramState;
        if (currentState.currentStepList == currentState.program.stepsMultiple) {
            thread.switchFromMultipleToSingleStep(currentState);
        }
    }

    createThread(program: NProgram, initialStack: any[] = [], callbackAfterFinished?: (value: any) => void) {

        let thread = new NThread(this, initialStack);
        thread.callCompiledMethod(program, callbackAfterFinished);
    }

    suspendThread(thread: NThread) {
        let index = this.runningThreads.indexOf(thread);
        if (index >= 0) {
            this.runningThreads.splice(index, 1);
            if (this.currentThreadIndex >= index) {
                this.currentThreadIndex--;
            }
        }
    }

    restoreThread(thread: NThread) {
        this.runningThreads.push(thread);
    }

    /**
     * for displaying next program position in editor
     */
    getNextStepPosition(): TextPositionWithModule {
        let currentThread = this.runningThreads[this.currentThreadIndex];
        let programState = currentThread.currentProgramState;
        let step = programState.currentStepList[programState.stepIndex];
        return {
            module: programState.program.module,
            position: step.start
        }
    }

    init(moduleStore: ModuleStore, mainModule: Module) {

        let mainThread = new NThread(this, []);

        this.staticClassObjects = moduleStore.staticClassObjects;
        Object.entries(this.staticClassObjects).forEach(([identifier, staticClassObject]) => {
            staticClassObject.__a = staticClassObject.__initialValues.slice();
            // push initialization programs on top of program stack
        })



        // TODO!!

        // Instantiate enum value-objects; initialize static attributes; call static constructors

        // this.programStack.push({
        //     program: this.mainModule.mainProgram,
        //     programPosition: 0,
        //     textPosition: { line: 1, column: 1, length: 0 },
        //     method: "Hauptprogramm",
        //     callbackAfterReturn: null,
        //     isCalledFromOutside: "Hauptprogramm"

        // })

        // for (let m of this.moduleStore.getModules(false)) {
        //     this.initializeEnums(m);
        //     this.initializeClasses(m);
        // }

        // this.popProgram();

        this.runningThreads.push(mainThread);
        this.currentThreadIndex = 0;
    }

    getExceptionObject(javaClass: any, message: any): NRuntimeObject {

        let exceptionStaticClass = this.staticClassObjects[javaClass];
        let klass = exceptionStaticClass.__class;
        let exception:NRuntimeObject = this.makeObject(klass);
        exception.__a.push(message);
        return exception;
    }

    makeObject(klass: NClass): NRuntimeObject{
        let obj = Object.create(klass.runtimeObjectPrototype);
        obj.__a = [];
        return obj;
    }

}

export class NSemaphor {
    counter: number;        // Number of currently available tokens

    runningThreads: NThread[] = [];
    waitingThreads: NThread[] = [];

    constructor(private threadPool: NThreadPool, private capacity: number) {
        this.counter = capacity;
        threadPool.semaphors.push(this);
    }

    aquire(thread: NThread): boolean {
        if (this.counter > 0) {
            this.counter--;
            this.runningThreads.push(thread);
            thread.currentlyHeldSemaphors.push(this);
            return true;
        } else {
            this.threadPool.suspendThread(thread);
            this.waitingThreads.push(thread);
            return false;
        }
    }

    release(thread: NThread) {
        let index = this.runningThreads.indexOf(thread);
        if (index >= 0) {
            this.runningThreads.splice(index, 1);
            if (this.waitingThreads.length > 0) {
                this.threadPool.restoreThread(this.waitingThreads.shift());
            } else {
                this.counter++;
            }
        } else {
            // Error: Thread had no token!
        }
    }



}