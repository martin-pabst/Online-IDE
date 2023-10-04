import { PushClientLongPollingStrategy } from "./PushClientLongPollingStrategy";
import { PushClientStrategy } from "./PushClientStrategy";
import { PushClientWebsocketStrategy } from "./PushClientWebsocketStrategy";

export type PushEventType = "startPruefung" | "stopPruefung" | "doFileUpdate" | "broadcastDatabaseChange" | "checkIfAlive" | "close" | "onPruefungChanged"
                     | "onGradeChangedInPruefungAdministration"| "onGradeChangedInMainWindow" | "onOpen" | "keepAlive";

export type ServerSentMessage = {eventType: PushEventType, data?: any};

export type PushMessageHandler = (data: any) => void;

export type PushSubscriberInfo = {
    eventType: PushEventType;
    handler: PushMessageHandler;
}

export class BasePushClientManager {

    strategies: PushClientStrategy[] = [];
    currentStrategy: PushClientStrategy;

    eventTypeToSubscriberInfoMap: Map<string, PushSubscriberInfo> = new Map();

    public subscribe(eventType: PushEventType, handler: PushMessageHandler) {
        this.eventTypeToSubscriberInfoMap.set(eventType, { eventType: eventType, handler: handler });
    }
    
    public unsubscribe(eventType: PushEventType){
        this.eventTypeToSubscriberInfoMap.delete(eventType);
    }


    protected constructor(public baseURL: string){
        this.strategies = [
            new PushClientWebsocketStrategy(this),
            new PushClientLongPollingStrategy(this)
        ]

        for(let i = this.strategies.length - 2; i >= 0; i--){
            this.strategies[i].nextStrategy = this.strategies[i+1];
        }
    }

    open(){
        if(this.currentStrategy == null){
            this.currentStrategy = this.strategies[0];
            console.log(`Opening ${this.currentStrategy.name}`);
            this.currentStrategy.open();
        }
    }

    onMessage(messages: ServerSentMessage[]){

        for(let message of messages){            
            if(message.eventType == "keepAlive") return;
    
            this.eventTypeToSubscriberInfoMap.get(message.eventType)?.handler(message.data);
        }


    }

    onStrategyFailed(failedStrategy: PushClientStrategy){
        if(failedStrategy != this.currentStrategy) return;

        let oldStrategy = this.currentStrategy;
        this.currentStrategy = this.currentStrategy.nextStrategy;

        let text: string = `${oldStrategy.name} failed. `;

        if(this.currentStrategy != null){
                text += `=> Trying ${this.currentStrategy.name} in 3 seconds...`;
            setTimeout(() => {
                console.log(`Opening ${this.currentStrategy.name}`);
                this.currentStrategy.open();                
            }, 3000);
        } else {
            text += `It was the last resort, unfortunately this client has no means to receive push-messages from server.`;
        }

        console.log(text);

    }

    close() {
        if(this.currentStrategy != null){
            this.currentStrategy.close();
            this.currentStrategy = null;
        }
    }


}