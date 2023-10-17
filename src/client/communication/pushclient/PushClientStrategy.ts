import { BasePushClientManager } from "./BasePushClientManager.js";

export abstract class PushClientStrategy {

    nextStrategy: PushClientStrategy;

    constructor(public name: string, public manager: BasePushClientManager){

    }

    abstract open(): void;

    abstract close();

}
