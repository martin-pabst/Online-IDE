import { Type, Method, Parameterlist, Value, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility, Interface } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Module } from "../compiler/parser/Module.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { Enum } from "../compiler/types/Enum.js";
import { InterpreterState, Interpreter } from "../interpreter/Interpreter.js";
import { Program } from "../compiler/parser/Program.js";


export class Runnable extends Interface {

    constructor(module: Module) {
        super("Runnable", module);

        this.addMethod(new Method("run", new Parameterlist([
            // { identifier: "deltaTimeInMs", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            false, false, "Wird vom Timer immer wieder aufgerufen"));
    }

}

type TimerEntry = {
    timerListener: RuntimeObject,
    dt: number,
    running: boolean,
    lastTimeFired: number,
    method: Method
}

export class TimerClass extends Klass {

    timerEntries: TimerEntry[] = [];
    timerRunning: boolean = false;

    timerStarted: boolean = false;

    constructor(module: Module) {
        super("Timer", module, "Timer Klasse zur periodischen Ausführung von Methoden");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        this.staticClass.classObject = new RuntimeObject(this.staticClass);

        this.addMethod(new Method("repeat", new Parameterlist([
            {
                identifier: "runnable", type: module.typeStore.getType("Runnable"),
                declaration: null, usagePositions: null, isFinal: true
            },
            {
                identifier: "deltaTimeInMs", type: intPrimitiveType,
                declaration: null, usagePositions: null, isFinal: true
            },
        ]), voidPrimitiveType,
            (parameters) => {

                let tl: RuntimeObject = <RuntimeObject>parameters[1].value;
                let dt: number = <number>parameters[2].value;

                let timerEntry: TimerEntry = {
                    timerListener: tl,
                    dt: dt,
                    lastTimeFired: 0,
                    running: true,
                    method: tl.class.getMethod("run", new Parameterlist([
                        // {
                        //     identifier: "deltaTimeInMs",
                        //     type: intPrimitiveType,
                        //     declaration: null,
                        //     isFinal: true,
                        //     usagePositions: null
                        // }
                    ]))
                }

                this.timerEntries.push(timerEntry);

                // console.log("TimerListener added with dt = " + dt + " ms.");

            }, false, true, "Fügt ein neues TimerListener-Objekt hinzu und ruft dessen tick-Methode immer wieder auf."));

    }

    startTimer(){
        if(!this.timerStarted){
            this.timerStarted = true;
            this.processTimerEntries();
        }
    }
    
    stopTimer(){
        this.timerStarted = false;
    }

    processTimerEntries() {

        if(!this.timerStarted){
            return;
        }

        if (this.timerEntries.length > 0) {
            let interpreter = this.module?.main?.getInterpreter();

            if (interpreter != null) {
                if (!this.timerRunning && interpreter.state == InterpreterState.running) {
                    let t: number = performance.now();
                    for (let timerentry of this.timerEntries) {
                        let dt = t - timerentry.lastTimeFired;
                        if (dt >= timerentry.dt) {
                            this.runEntry(timerentry, interpreter, Math.round(dt));
                            timerentry.lastTimeFired = t;
                        }
                    }
                }

                switch (interpreter.state) {
                    case InterpreterState.done:
                    case InterpreterState.error:
                    case InterpreterState.not_initialized:
                        this.timerEntries = [];
                        this.timerRunning = false;
                        break;
                }

            }

        }


        let that = this;
        setTimeout(() => {
            that.processTimerEntries();
        }, 10);

    }

    runEntry(timerentry: TimerEntry, interpreter: Interpreter, dt: number) {
        let stackElements: Value[] = [
            {
                type: timerentry.timerListener.class,
                value: timerentry.timerListener
            },
            // {
            //     type: intPrimitiveType,
            //     value: dt
            // }
        ];

        this.timerRunning = true;
        let that = this;

        interpreter.runTimer(timerentry.method, stackElements, (interpreter) => {
            that.timerRunning = false;
        }, false);
    }

}