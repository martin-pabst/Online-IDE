import { ModuleStore, Module } from "src/client/compiler/parser/Module.js";
import { TextPositionWithModule } from "src/client/compiler/types/Types.js";
import { NHelper, NProgram, NStep } from "../compiler/NProgram.js";
import { NRuntimeObject, NStaticClassObject } from "../NRuntimeObject.js";
import { NMethodInfo } from "../types/NAttributeMethod.js";
import { NClass } from "../types/NClass.js";
import { NInterpreter } from "./NInterpreter.js";

/**
 * every time a try-block is entered a NExceptionInfo-object is pushed
 * onto NProgramState.exceptionInfoList. On leaving the try-block it is popped.
 */
type NExceptionInfo = {
    types: string[],        // identifiers of Exceptions being catched
    stepIndexAfterTryBlock: number,  // this is usually the first step inside a catch block
    stackPointerBeforeCatch: number // after exception we have to cleanup our stack
}

/**
 * corresponds to currently executed method; program states are pushed onto NThread.programStack.
 */
type NProgramState = {
    program: NProgram;
    currentStepList: NStep[];   // Link to program.stepSingle or program.stepMultiple
    stepIndex: number;  // when step is currently executed: index of this step
    stackBase: number;  // used to adress local variables on stack
    callbackAfterFinished?: (value: any) => void;   // used when system methods call compiled methods
    exceptionInfoList: NExceptionInfo[];    // each entry corresponds to a currently entered try-block
}

enum NThreadState { running, paused, exited, exitedWithException }

export enum NThreadPoolState { ready, running, paused, not_initialized }

export class NThread {
    stack: any[];
    programStack: NProgramState[] = [];

    // for performance reasons 
    currentProgramState: NProgramState;  // also lies on top of programStack

    currentlyHeldSemaphors: NSemaphor[] = [];

    state: NThreadState;

    exception: NRuntimeObject;  // if program terminated because of exception, here it is!

    /**
     * immediately before executing a "step over" set this attributes so that run-method 
     * knows when to pause program execution
     */
    stepEndsWhenProgramstackLengthLowerOrEqual: number;
    stepEndsWhenStepIndexGreater: number;
    stepCallback: () => void;   // this is called after "step over" is done

    constructor(public threadPool: NThreadPool, initialStack: any[]) {
        this.stack = initialStack;
    }

    /**
     * contains main loop of program execution
     * maxNumberOfSteps corresponds to maximum granted execution time
     */
    run(maxNumberOfSteps: number): NThreadState {
        let numberOfSteps = 0;
        let stack = this.stack; // for performance reasons
        this.state = NThreadState.running;

        try {
            //@ts-ignore
            while (numberOfSteps < maxNumberOfSteps && this.state != NThreadState.exited) {
                // For performance reasons: store all necessary data in local variables
                let currentProgramState: NProgramState = null;
                let currentStepList: NStep[];
                let stackBase: number;
                let helper: NHelper;

                // has user pressed "step over"-button?
                // then for performance reasons enter a special while-loop
                // which tests for "step over"-completion after every step
                if (this.stepEndsWhenProgramstackLengthLowerOrEqual >= 0) {
                    while (numberOfSteps < maxNumberOfSteps &&
                        this.state == NThreadState.running && !this.isSingleStepCompleted()) {

                        if (currentProgramState != this.currentProgramState) {
                            currentProgramState = this.currentProgramState;
                            currentStepList = currentProgramState.currentStepList;
                            stackBase = currentProgramState.stackBase;
                            helper = currentProgramState.program.helper;
                        }

                        let step = currentStepList[currentProgramState.stepIndex];
                        currentProgramState.stepIndex = step.run(stack, stackBase, helper, this);
                        numberOfSteps++;
                    }
                    if (this.isSingleStepCompleted()) {
                        this.stepCallback();
                        this.state = NThreadState.paused;
                    }
                } else {
                    // we keep this loop as fast as possible:
                    while (numberOfSteps < maxNumberOfSteps && this.state == NThreadState.running) {

                        if (currentProgramState != this.currentProgramState) {
                            currentProgramState = this.currentProgramState;
                            currentStepList = currentProgramState.currentStepList;
                            stackBase = currentProgramState.stackBase;
                            helper = currentProgramState.program.helper;
                        }

                        let step = currentStepList[currentProgramState.stepIndex];
                        currentProgramState.stepIndex = step.run(stack, stackBase, helper, this);
                        numberOfSteps++;
                    }
                }


                // this currentProgram might by now not be the same as before this inner while-loop
                // because callMethod or returnFromMethod may have been called since from within 
                // step.run
            }
        } catch (exception) {
            let exceptionObject: NRuntimeObject;
            if (exception["class"] != null) {
                exceptionObject = this.threadPool.getExceptionObject(exception.javaClass, exception.message);
            } else {
                exceptionObject = this.threadPool.getExceptionObject("RuntimeException", exception + "");
            }
            this.throwException(exceptionObject);
        }

        this.threadPool.numberOfSteps += Math.min(numberOfSteps, 1);

        return this.state;
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

    private callJsMethod(parameterCount: number, invoke: any, callbackAfterFinished?: (value: any) => void) {
        let params: any[] = Array(parameterCount + 1);      // + 1 because of thread
        for (let i = 1; i <= parameterCount + 1; i++) {
            params[parameterCount - i] = this.stack.pop();
        }

        // Alternative: splice
        // let params = this.stack.splice(this.stack.length - (parameterCount + 1));

        let returnValue = invoke.call(this.stack.pop(), params);

        if (callbackAfterFinished != null) {
            callbackAfterFinished(returnValue);
        } else {
            if (typeof returnValue != "undefined") {
                this.stack.push(returnValue);
            }
        }
    }

    /**
     * Preconditions: 
     * a) this is on the stack
     * b) thread is on the stack
     * c) all parameters are on the stack
     * d) thread.callVirtualMethod is last statement of step
     * 
     * Could also be used for static methods. In this case this = threadPool.staticClassObjects[classIdentifier]
     */
    callVirtualMethodFromProgram(parameterCount: number, signature: string, callbackAfterFinished?: (value: any) => void) {
        let runtimeObject = this.stack[this.stack.length - 2 - parameterCount]; // 2 because of [this, thread, parameter 1, ..., parameter n]
        let method: NMethodInfo = runtimeObject[signature];
        if (method.invoke == null) {
            this.callCompiledMethod(method.program, callbackAfterFinished);
        } else {
            this.callJsMethod(parameterCount, method.invoke, callbackAfterFinished);
        }
    }

    /**
     * Could also be used for static methods. In this case runtimeObject = threadPool.staticClassObjects[classIdentifier
     */
    callVirtualMethodFromJs(runtimeObject: any, signature: string, parameters: any[], callbackAfterFinished?: (value: any) => void) {
        // let runtimeObject = this.stack[this.stack.length - 2 - parameterCount]; // 2 because of [this, thread, parameter 1, ..., parameter n]
        let method: NMethodInfo = runtimeObject[signature];
        if (method.invoke == null) {
            this.stack.push(runtimeObject, this, ...parameters);
            this.callCompiledMethod(method.program, callbackAfterFinished);
        } else {
            parameters.unshift(this);

            let returnValue = method.invoke.call(runtimeObject, parameters);

            if (callbackAfterFinished != null) {
                callbackAfterFinished(returnValue);
            } else {
                if (typeof returnValue != "undefined") {
                    this.stack.push(returnValue);
                }
            }
        }
    }


    returnFromMethod(returnValue: any) {
        while (this.stack.length > this.currentProgramState.stackBase) {
            this.stack.pop();
        }

        let callback = this.programStack.pop().callbackAfterFinished;
        if (callback != null) {
            callback(returnValue);
        } else {
            if (typeof returnValue != "undefined") this.stack.push(returnValue);
        }

        if (this.programStack.length > 0) {
            this.currentProgramState = this.programStack[this.programStack.length - 1];
            if (this.threadPool.executeMode == NExecuteMode.singleSteps &&
                this.currentProgramState.currentStepList == this.currentProgramState.program.stepsMultiple) {
                this.switchFromMultipleToSingleStep(this.currentProgramState);
            }
        } else {
            this.state = NThreadState.exited;
        }
    }

    private isSingleStepCompleted() {
        return this.programStack.length < this.stepEndsWhenProgramstackLengthLowerOrEqual ||
            this.programStack.length == this.stepEndsWhenProgramstackLengthLowerOrEqual &&
            this.currentProgramState.stepIndex > this.stepEndsWhenStepIndexGreater;
    }

    markSingleStepOver(callbackWhenSingleStepOverEnds: () => void) {

        this.stepEndsWhenProgramstackLengthLowerOrEqual = this.programStack.length - 1;
        this.stepEndsWhenStepIndexGreater = this.currentProgramState.stepIndex;
        this.stepCallback = () => {
            this.unmarkStep();
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
            this.unmarkStep();
            callbackWhenStepOutEnds();
        };

    }


    /**
     * pops entries from programStack until it finds try..catch-block which corresponds to exception.
     * if found, resumes execution in catch-block.
     * if not found, stops program execution.
     * Leaves stacktrace in this.stacktrace and exception in this.exception.
     */
    throwException(exception: NRuntimeObject) {
        let exceptionClass: NClass = exception.__class;
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
                    for (let cn in classNames) {
                        if (exInfo.types.indexOf(cn) >= 0) {
                            found = true;
                            break;
                        }
                    }
                }

                if (found) {
                    stackTrace.push(Object.assign(ps));
                    ps.stepIndex = exInfo.stepIndexAfterTryBlock;
                    this.stack.splice(exInfo.stackPointerBeforeCatch, this.stack.length - exInfo.stackPointerBeforeCatch);
                    this.stack.push(exception); // as 'parameter' for catch-block
                    this.currentProgramState = ps;
                    break;
                } else {
                    stackTrace.push(ps);
                    this.programStack.pop();
                }
            }

        } while (this.programStack.length > 0)

        exception.__a[exception.__fai + 1] = this.stacktraceToString(stackTrace);   // set stacktrace-attribute of throwable

        if (this.programStack.length == 0) {
            this.exception = exception;
            this.state = NThreadState.exitedWithException;
        }
    }

    stacktraceToString(stacktrace: NProgramState[]): string {
        if (stacktrace == null || stacktrace.length == 0) {
            return "No stacktrace available";
        }
        let s: string = "";
        for (let ps of stacktrace) {
            let step: NStep = ps.currentStepList[ps.stepIndex];
            s += "   at ";
            let method = ps.program.method;
            if (method != null) {
                s += method.classOrInterfaceOrEnum.identifier + "." + method.identifier;
            } else {
                s += "main program";
            }
            s += "(File " + ps.program.filename + " line " + step.start.line + " column " + step.start.column + ")\n";
        }
        return s;
    }

    /**
     * Call this everytime a try... block starts
     */
    beginCatchExceptions(exceptionInfo: NExceptionInfo) {
        exceptionInfo.stackPointerBeforeCatch = this.stack.length;
        this.currentProgramState.exceptionInfoList.push(exceptionInfo);
    }

    /**
     * Call this everytime a try... block ends (before jumping over catch block)
     */
    endCatchExceptions() {
        this.currentProgramState.exceptionInfoList.pop();
    }

    aquireSemaphor(semaphor: NSemaphor) {
        if (!semaphor.aquire(this)) {
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
        if (object != null && (<NClass>object.__class).allExtendedImplementedTypes.indexOf(klassOrInterface) < 0) {
            //@ts-ignore
            throw { class: "ClassCastException", message: "Die Klasse " + object.__class.identifier + " " + " kann nicht nach " + klassOrInterface + " gecastet werden." }
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
    state: NThreadPoolState;

    keepThread: boolean = false;    // for single step mode

    staticClassObjects: { [identifier: string]: NStaticClassObject };

    numberOfSteps: number;

    constructor(private interpreter: NInterpreter) {
        this.setState(NThreadPoolState.not_initialized);
    }

    run(numberOfStepsMax: number) {
        let stepsPerThread = Math.ceil(numberOfStepsMax / this.runningThreads.length);
        this.numberOfSteps = 0;
        if (this.runningThreads.length == 0) return NThreadState.exited;

        if ([NThreadPoolState.ready, NThreadPoolState.running].indexOf(this.state) < 0) {
            return;
        }

        this.setState(NThreadPoolState.running);

        while (this.numberOfSteps < numberOfStepsMax) {
            let currentThread = this.runningThreads[this.currentThreadIndex];

            let status = currentThread.run(stepsPerThread);  // increases this.numberOfSteps as side effekt!

            switch (status) {
                case NThreadState.exited:

                    for (let semaphor of currentThread.currentlyHeldSemaphors) {
                        semaphor.release(currentThread);
                    }

                    this.runningThreads.splice(this.currentThreadIndex, 1);

                    if (this.runningThreads.length == 0) {
                        this.setState(NThreadPoolState.ready);
                        return;
                    }

                    break;
                case NThreadState.exitedWithException:
                    let exception = currentThread.exception;
                    let stacktrace = exception.__a[exception.__fai + 1];
                    // TODO: Print Exception
                    this.setState(NThreadPoolState.ready);
                    return;
                case NThreadState.paused:
                    this.setState(NThreadPoolState.paused);
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

    setState(newState: NThreadPoolState) {
        this.interpreter.setState(this.state, newState);
        this.state = newState;
    }

    runSingleStepKeepingThread(stepInto: boolean, callback: () => void) {
        if ([NThreadPoolState.paused, NThreadPoolState.ready].indexOf(this.state) < 0) {
            callback();
        }

        this.keepThread = true;
        if (stepInto) {
            this.run(1);
            this.keepThread = false;
            callback();
        } else {
            let thread = this.runningThreads[this.currentThreadIndex];
            if (thread == null) return;
            thread.markSingleStepOver(() => {
                this.keepThread = false;
                callback();
            });
            this.state = NThreadPoolState.running;
        }
    }
    
    stepOut(callback: () => void) {
        if ([NThreadPoolState.paused, NThreadPoolState.ready].indexOf(this.state) < 0) {
            callback();
        }
        
        this.keepThread = true;
        let thread = this.runningThreads[this.currentThreadIndex];
        if (thread == null) return;
        thread.markStepOut(() => {
            this.keepThread = false;
            callback();
        });
        this.state = NThreadPoolState.running;
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
        let exception: NRuntimeObject = this.makeObject(klass);
        exception.__a.push(message);
        return exception;
    }

    makeObject(klass: NClass): NRuntimeObject {
        let obj = Object.create(klass.runtimeObjectPrototype);
        obj.__a = klass.initialAttributeValues.slice();
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