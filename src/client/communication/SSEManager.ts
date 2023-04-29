import { ajaxAsync } from "./AjaxHelper.js";

type SSECallbackMethod = (data: any) => Promise<any>;

type SSEMessageHandler = (data: any, callback?: SSECallbackMethod) => void;

type SSESubscriberInfo = {
    eventType: string,
    messageHandler: SSEMessageHandler
}

type ServerSentMessage = {eventType: string, messageId?: number, token?: string, data?: any};

type SseCallbackRequest = {messageId: number, token: string, data: string};

export class SSEManager {

    static instance: SSEManager;

    static eventTypeToSubscriberInfoMap: Map<string, SSESubscriberInfo> = new Map();
    static eventSource: EventSource;

    static open(csrfToken: string){

        SSEManager.close();

        try {
            SSEManager.eventSource = new EventSource("/servlet/sse?csrfToken=" + csrfToken, {withCredentials: true});
            
            SSEManager.eventSource.onmessage = (event) => {
                let ssm: ServerSentMessage = JSON.parse(event.data);
                let subscriber = SSEManager.eventTypeToSubscriberInfoMap.get(ssm.eventType);
                if(subscriber != null){

                    let callback: SSECallbackMethod = undefined;

                    if(ssm.messageId != null){
                        callback = async (data: any) => {
                            let message: SseCallbackRequest = {messageId: ssm.messageId, token: ssm.token, data: JSON.stringify(data)}
                            return ajaxAsync("/servlet/sseCallback",  message);
                        }
                    }

                    subscriber.messageHandler(ssm.data, callback)
                }
            };

        } catch(ex){
            console.log(ex);
        }

    }

    public static close(){
        if(SSEManager.eventSource != null){
            SSEManager.eventSource.close();
            SSEManager.eventSource = null;   
        }
    }

    public static subscribe(eventType: string, handler: SSEMessageHandler) {
        this.eventTypeToSubscriberInfoMap.set(eventType, { eventType: eventType, messageHandler: handler });
    }


}