import { ajaxAsync, csrfToken } from "./AjaxHelper.js";


type SSEEventType = "startPruefung" | "stopPruefung" | "doFileUpdate" | "broadcastDatabaseChange" | "checkIfAlive" | "close" | "onPruefungChanged"
                     | "onGradeChangedInPruefungAdministration"| "onGradeChangedInMainWindow" | "onOpen" | "keepAlive";

type SSECallbackMethod = (data: any) => Promise<any>;

type SSEMessageHandler = (data: any, callback?: SSECallbackMethod) => void;

type SSESubscriberInfo = {
    eventType: string,
    messageHandler: SSEMessageHandler
}

export type ServerSentMessage = {eventType: SSEEventType, messageId?: number, token?: string, data?: any};

type SseCallbackRequest = {messageId: number, token: string, data: string};

export class SSEManager {
    
    static ownCsrfToken: string = null;

    static eventTypeToSubscriberInfoMap: Map<string, SSESubscriberInfo> = new Map();
    static eventSource: EventSource;
    
    public static subscribe(eventType: SSEEventType, handler: SSEMessageHandler) {
        SSEManager.eventTypeToSubscriberInfoMap.set(eventType, { eventType: eventType, messageHandler: handler });
    }
    
    public static unsubscribe(eventType: SSEEventType){
        SSEManager.eventTypeToSubscriberInfoMap.delete(eventType);
    }

    static open(csrfToken1: string){
        
        if(SSEManager.ownCsrfToken == csrfToken1) return;

        SSEManager.close();
        
        try {
            SSEManager.eventSource = new EventSource("/servlet/sse?csrfToken=" + csrfToken1, {withCredentials: true});
            
            SSEManager.eventSource.onmessage = (event) => {
                let ssm: ServerSentMessage = JSON.parse(event.data);

                if(ssm.eventType == "keepAlive"){
                    return;
                } 

                if(ssm.eventType == "checkIfAlive"){
                    ajaxAsync("/servlet/sseKeepAlive?keepAliveToken=" + ssm.data, "");
                    return;
                }

                if(ssm.eventType == "close"){
                    SSEManager.close();
                }

                let subscriber = SSEManager.eventTypeToSubscriberInfoMap.get(ssm.eventType);
                if(subscriber != null){

                    let callback: SSECallbackMethod = undefined;

                    if(ssm.messageId != null){
                        callback = async (data?: any) => {
                            let message: SseCallbackRequest = {messageId: ssm.messageId, token: ssm.token, data: JSON.stringify(data)}
                            return ajaxAsync("/servlet/sseCallback",  message);
                        }
                    }

                    subscriber.messageHandler(ssm.data, callback)
                }
            };

            SSEManager.eventSource.onerror = (event) => {
                
                console.log("SSE connection lost. Trying to reconnect in 10 seconds...");
                
                setTimeout(() => {
                    if(SSEManager.eventSource == null){
                        SSEManager.close();
                        console.log("Reconnecting...");
                        SSEManager.open(csrfToken);
                    }
                }, 10000);
            }

        } catch(ex){
            console.log('Exception in SSEManager: ' + ex);
        }

    }

    public static close(){
        if(SSEManager.eventSource != null){
            SSEManager.eventSource.close();
            SSEManager.eventSource = null;   
            SSEManager.ownCsrfToken = null;
        }
    }


}


