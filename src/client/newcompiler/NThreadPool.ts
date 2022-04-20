import { NProgram, NStep } from "./NProgram.js";
import { NRuntimeObject } from "./NRuntimeObject.js";

type NExceptionInfo = {
    types: string[],
    stepIndex: number, 
    stackSize: number
}

type NProgramState = {
    program: NProgram;
    currentStepList: NStep[];   // Link to program.stepSingle or program.stepMultiple
    stepIndex: number;
    stackBase: number;
    callbackAfterFinished?: (value: any) => void;
    exceptionInfoList: NExceptionInfo[];
}

enum NThreadStatus { running, callMethod, exited, exitedWithException, exceptionCaught}


export class NThread {
    stack: any[];
    programStack: NProgramState[] = [];

    currentProgramState: NProgramState;  // also lies on top of programStack

    currentlyHeldSemaphors: NSemaphor[] = [];

    status: NThreadStatus;

    exception: NRuntimeObject;
    stackTrace: NProgramState[];

    constructor(public threadPool: NThreadPool, initialStack: any[]) {
        this.stack = initialStack;
    }

    /**
     * returns true if Thread exits
     */
    run(maxNumberOfSteps: number): NThreadStatus {
        let numberOfSteps = 0;
        let stack = this.stack; // for performance reasons
        this.status = NThreadStatus.running;
        
        //@ts-ignore
        while(numberOfSteps < maxNumberOfSteps && this.status != NThreadStatus.exited){
        this.status = NThreadStatus.running;
        // For performance reasons: store all necessary data in local variables
        let currentProgramState = this.currentProgramState;
        let stepIndex = currentProgramState.stepIndex;
        let currentStepList = currentProgramState.currentStepList;
        let stackBase = currentProgramState.stackBase;
        let helper = currentProgramState.program.helper;

            while(numberOfSteps < maxNumberOfSteps && this.status == NThreadStatus.running){
                let step = currentStepList[stepIndex];
                stepIndex = step.run(stack, stackBase, helper, this);
                numberOfSteps++;
            }

            currentProgramState.stepIndex = stepIndex;
            // this currentProgram might by now not be the same as before this inner while-loop
            // because callMethod or returnFromMethod may have been called since from within 
            // step.run
        }

        return this.status;
    }

    throwException(exception: NRuntimeObject){
        let className = exception.__class.identifier;
        let classNames = exception.__class.allExtendedImplementedTypes;

        let stackTrace: NProgramState[] = [];
        do {

            let ps = this.programStack[this.programStack.length - 1];
            for(let exInfo of ps.exceptionInfoList){
                let found = false;
                if(exInfo.types.indexOf(className) >= 0){
                    found = true;
                } else {
                    for(let cn of classNames){
                        if(exInfo.types.indexOf(cn) >= 0){
                            found = true;
                            break;
                        }
                    }
                }

                if(found){
                    stackTrace.push(Object.assign(ps));
                    ps.stepIndex = exInfo.stepIndex;
                    this.stack.splice(exInfo.stackSize, this.stack.length - exInfo.stackSize);
                    this.stack.push(exception);
                    this.status = NThreadStatus.exceptionCaught;
                    break;
                } else {
                    stackTrace.push(ps);
                    this.programStack.pop();
                }
            }

        } while(this.programStack.length > 0)

        if(this.programStack.length == 0){
            this.stackTrace = stackTrace;
            this.exception = exception;
            this.status = NThreadStatus.exitedWithException;
        }
    }

    beginCatchExceptions(exceptionInfo: NExceptionInfo){
        exceptionInfo.stackSize = this.stack.length;
        this.currentProgramState.exceptionInfoList.push(exceptionInfo);
    }

    endCatchExceptions(){
        this.currentProgramState.exceptionInfoList.pop();
    }

    aquireSemaphor(semaphor: NSemaphor){
        if(!semaphor.aquire(this)){
            this.status = NThreadStatus.exited;
        } 
    }

    returnFromMethod(returnValue: any){
        while(this.stack.length > this.currentProgramState.stackBase){
            this.stack.pop();
        }
        
        if(returnValue != null) this.stack.push(returnValue);

        this.programStack.pop();
        if(this.programStack.length > 0){
            this.currentProgramState = this.programStack[this.programStack.length - 1];
            if(this.threadPool.executeMode == NExecuteMode.singleSteps && this.currentProgramState.currentStepList == this.currentProgramState.program.stepsMultiple){
                this.switchFromMultipleToSingleStep(this.currentProgramState);
            }
        } else {
            this.status = NThreadStatus.exited;
        }
    }

    switchFromMultipleToSingleStep(programState: NProgramState) {
        let multiStep = programState.currentStepList[programState.stepIndex];
        let singleStep = multiStep.correspondingStepInOtherStepmode;
        if(singleStep != null){
            programState.currentStepList = programState.program.stepsSingle;
            programState.stepIndex = programState.currentStepList.indexOf(singleStep);
        }
    }

    callMethod(program: NProgram, callbackAfterFinished?: (value: any) => void){
        let state: NProgramState = {
            program: program,
            currentStepList: this.threadPool.executeMode == NExecuteMode.singleSteps ? program.stepsSingle : program.stepsMultiple,
            stackBase: this.stack.length - program.numberOfParamters - program.numberOfLocalVariables,
            stepIndex: 0,
            callbackAfterFinished: callbackAfterFinished,
            exceptionInfoList: []
        }
        
        for(let i = 0; i < program.numberOfLocalVariables; i++){
            this.stack.push(null);
        }

        this.programStack.push(state);
        this.currentProgramState = state;
        this.status = NThreadStatus.callMethod;
    }
}

export enum NExecuteMode { singleSteps, multipleSteps};

export class NThreadPool {
    runningThreads: NThread[] = [];
    currentThreadIndex: number = 0;
    executeMode: NExecuteMode;
    semaphors: NSemaphor[] = [];

    run(numberOfStepsMax: number): NThreadStatus {
        let stepsPerThread = Math.ceil(numberOfStepsMax/this.runningThreads.length);
        let numberOfSteps = 0;
        if(this.runningThreads.length == 0) return;

        while(numberOfSteps < numberOfStepsMax){
            let currentThread = this.runningThreads[this.currentThreadIndex];
            
            let status = currentThread.run(stepsPerThread);
            numberOfSteps += stepsPerThread;

            switch(status){
                case NThreadStatus.exited:
                    
                    for(let semaphor of currentThread.currentlyHeldSemaphors){
                        semaphor.release(currentThread);
                    }

                    this.runningThreads.splice(this.currentThreadIndex, 1);
                    
                    if(this.runningThreads.length == 0){
                        return NThreadStatus.exited;
                    }
                    
                    break;
                case NThreadStatus.exitedWithException:
                    // TODO: Print Exception
                    return NThreadStatus.exitedWithException;
            }

            this.currentThreadIndex++;
            if(this.currentThreadIndex >= this.runningThreads.length){
                this.currentThreadIndex = 0;
            }
        }

        return NThreadStatus.running;

    }

    runSingleStepKeepingThread(){
        // save threadIndex
        let threadIndex = this.currentThreadIndex;
        let currentThread = this.runningThreads[threadIndex];

        this.run(1);

        // restore threadIndex
        if(this.runningThreads.length > 0 && this.runningThreads[threadIndex] == currentThread){
            this.currentThreadIndex = threadIndex;
        }
    }

    switchAllThreadsToSingleStepMode(){
        for(let thread of this.runningThreads){
            this.switchThreadToSingleStepMode(thread);
        }

        for(let s of this.semaphors){
            for(let thread of s.waitingThreads){
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

    createThread(program: NProgram, initialStack: any[] = [], callbackAfterFinished?: (value: any) => void){
        
        let thread = new NThread(this, initialStack);
        thread.callMethod(program, callbackAfterFinished);        
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
    getNextStep(): NStep {
        let currentThread = this.runningThreads[this.currentThreadIndex];
        let programState = currentThread.currentProgramState;
        return programState.currentStepList[programState.stepIndex];
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