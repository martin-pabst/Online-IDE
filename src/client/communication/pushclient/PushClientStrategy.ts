import { PushClientManager } from "./PushClientManager";

export abstract class PushClientStrategy {

    nextStrategy: PushClientStrategy;

    constructor(public name: string, public manager: PushClientManager){

    }

    abstract open(): void;

    abstract close();

}
