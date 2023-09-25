import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager, PushEventType, PushMessageHandler, ServerSentMessage } from "./BasePushClientManager.js";
import { PushClientLongPollingStrategy } from "./PushClientLongPollingStrategy";
import { PushClientStrategy } from "./PushClientStrategy";
import { PushClientWebsocketStrategy } from "./PushClientWebsocketStrategy";


export class PushClientManager extends BasePushClientManager {

    private static instance: PushClientManager;


    public static subscribe(eventType: PushEventType, handler: PushMessageHandler) {
        PushClientManager.getInstance().subscribe(eventType, handler);
    }
    
    public static unsubscribe(eventType: PushEventType){
        PushClientManager.getInstance().unsubscribe(eventType);
    }


    public static getInstance(): PushClientManager {
        if(PushClientManager.instance == null){
            PushClientManager.instance = new PushClientManager();
        }
        return PushClientManager.instance;
    }



}