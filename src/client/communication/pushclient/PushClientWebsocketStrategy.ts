import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager, ServerSentMessage } from "./BasePushClientManager.js";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientWebsocketStrategy extends PushClientStrategy {

    csrfToken: string;

    websocket: WebSocket;

    isClosed: boolean;

    constructor(manager: BasePushClientManager) {
        super("websocket strategy", manager);
    }

    open(): void {

        this.isClosed = false;

        try {

            let url: string = (window.location.protocol.startsWith("https") ? "wss://" : "ws://") + window.location.host + "/servlet/pushWebsocket?csrfToken=" + csrfToken;

            this.websocket = new WebSocket(url);
    
            this.websocket.onopen = (event) => {}
    
            this.websocket.onclose = (event) => {
                console.log("Websocket has been closed, code: " + event.code + ", reason: " + event.reason);
                this.manager.onStrategyFailed(this);
                this.isClosed = true;
            }
    
            this.websocket.onerror = (event) => { 
                console.log("Error on websocket, type: " + event.type);
                this.websocket.close();
                this.manager.onStrategyFailed(this);
                this.isClosed = true;
            }
    
            this.websocket.onmessage = (event) => {
                if(event.data == "pong") return;
                const msg: ServerSentMessage = JSON.parse(event.data);
                this.manager.onMessage(msg);
            }

            this.doPing();

        } catch (ex){
            this.manager.onStrategyFailed(this);
        }

    }

    doPing(){
        setTimeout(() => {
            if(!this.isClosed){
                this.websocket.send("ping");
                this.doPing();
            }            
        }, 25000);

    }


    close() {
        this.isClosed = true;
        this.websocket.close();
    }

}