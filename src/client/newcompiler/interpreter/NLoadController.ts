import { NInterpreter } from "./NInterpreter.js";
import { NThreadPool, NThreadPoolLstate } from "./NThreadPool.js";

export class NLoadController {

    private maxLoadFactor: number = 0.7;

    private lastTickTime: number = 0;

    private stepsPerSecondGoal: number;
    private timeBetweenStepsGoal: number;

    constructor(private threadPool: NThreadPool, private interpreter: NInterpreter) {
        this.setStepsPerSecond(100);
    }

    tick(deltaUntilNextTick: number) {
        let t0 = performance.now();
        let deltaTime = t0 - this.lastTickTime;

        if (deltaTime < this.timeBetweenStepsGoal) return;
        this.lastTickTime = t0;

        if (this.timeBetweenStepsGoal >= deltaUntilNextTick && this.threadPool.state == NThreadPoolLstate.running) {
            this.threadPool.run(1);
            if(this.stepsPerSecondGoal <= 12){
                this.interpreter.showProgramPointer(this.threadPool.getNextStepPosition());
            }
            return;
        }

        let stepsPerTickGoal = this.stepsPerSecondGoal / 1000 * deltaUntilNextTick;
        let batch = Math.max(stepsPerTickGoal, 1000);

        let i: number = 0;
        while (i < stepsPerTickGoal &&
            (performance.now() - t0) / deltaUntilNextTick < this.maxLoadFactor &&
            this.threadPool.state == NThreadPoolLstate.running) {

            this.threadPool.run(batch);
            i += batch;

        }

    }

    setStepsPerSecond(value: number) {
        this.stepsPerSecondGoal = value;
        this.timeBetweenStepsGoal = 1000 / value;
    }



}