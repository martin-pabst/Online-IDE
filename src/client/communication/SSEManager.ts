import { ajaxAsync, csrfToken } from "./AjaxHelper.js";


export type SSEEventTypeOld = "startPruefung" | "stopPruefung" | "doFileUpdate" | "broadcastDatabaseChange" | "checkIfAlive" | "close" | "onPruefungChanged"
                     | "onGradeChangedInPruefungAdministration"| "onGradeChangedInMainWindow" | "onOpen" | "keepAlive";

type SSECallbackMethod = (data: any) => Promise<any>;

type SSEMessageHandler = (data: any, callback?: SSECallbackMethod) => void;

type SSESubscriberInfo = {
    eventType: string,
    messageHandler: SSEMessageHandler
}

export type ServerSentMessageOld = {eventType: SSEEventTypeOld, messageId?: number, token?: string, data?: any};

type SseCallbackRequest = {messageId: number, token: string, data: string};

export class SSEManagerOld {
    
    static ownCsrfToken: string = null;

    static eventTypeToSubscriberInfoMap: Map<string, SSESubscriberInfo> = new Map();
    static eventSource: EventSource;
    
    public static subscribe(eventType: SSEEventTypeOld, handler: SSEMessageHandler) {
        SSEManagerOld.eventTypeToSubscriberInfoMap.set(eventType, { eventType: eventType, messageHandler: handler });
    }
    
    public static unsubscribe(eventType: SSEEventTypeOld){
        SSEManagerOld.eventTypeToSubscriberInfoMap.delete(eventType);
    }

    static open(csrfToken1: string){
        
        if(SSEManagerOld.ownCsrfToken == csrfToken1) return;

        SSEManagerOld.close();
        
        try {
            SSEManagerOld.eventSource = new EventSource("/servlet/sse?csrfToken=" + csrfToken1, {withCredentials: true});
            
            SSEManagerOld.eventSource.onmessage = (event) => {
                let ssm: ServerSentMessageOld = JSON.parse(event.data);

                if(ssm.eventType == "keepAlive"){
                    return;
                } 

                if(ssm.eventType == "checkIfAlive"){
                    ajaxAsync("/servlet/sseKeepAlive?keepAliveToken=" + ssm.data, "");
                    return;
                }

                if(ssm.eventType == "close"){
                    SSEManagerOld.close();
                }

                let subscriber = SSEManagerOld.eventTypeToSubscriberInfoMap.get(ssm.eventType);
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

            SSEManagerOld.eventSource.onerror = (event) => {
                
                console.log("SSE connection lost. Trying to reconnect in 10 seconds...");
                
                setTimeout(() => {
                    if(SSEManagerOld.eventSource == null){
                        SSEManagerOld.close();
                        console.log("Reconnecting...");
                        SSEManagerOld.open(csrfToken);
                    }
                }, 10000);
            }

        } catch(ex){
            console.log('Exception in SSEManager: ' + ex);
        }

    }

    public static close(){
        if(SSEManagerOld.eventSource != null){
            SSEManagerOld.eventSource.close();
            SSEManagerOld.eventSource = null;   
            SSEManagerOld.ownCsrfToken = null;
        }
    }


}


