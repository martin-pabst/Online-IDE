import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager, ServerSentMessage } from "./BasePushClientManager.js";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientWebsocketStrategy extends PushClientStrategy {

    csrfToken: string;

    websocket: WebSocket;

    isClosed: boolean;

    openedTimestamp: number;

    currentTimer: any;

    constructor(manager: BasePushClientManager) {
        super("websocket strategy", manager);
    }

    open(): void {

        this.isClosed = false;

        try {

            let url: string = (window.location.protocol.startsWith("https") ? "wss://" : "ws://") + window.location.host + "/servlet/pushWebsocket?csrfToken=" + csrfToken;

            this.websocket = new WebSocket(url);
    
            this.websocket.onopen = (event) => {
                this.openedTimestamp = performance.now();
            }
    
            this.websocket.onclose = (event) => {
                console.log("Websocket has been closed, code: " + event.code + ", reason: " + event.reason);

                this.isClosed = true;
                
                if(event.code == 1001 && performance.now() - this.openedTimestamp > 1e4){
                    // timeout? => reopen
                    console.log("Reason was timeout, dt > 10s => Reopen!");
                    this.open();
                } else {
                    this.manager.onStrategyFailed(this);
                    this.isClosed = true;
                }
                
            }
    
            this.websocket.onerror = (event) => { 
                console.log("Error on websocket, type: " + event.type);
                this.websocket.close();
                this.manager.onStrategyFailed(this);
                this.isClosed = true;
            }
    
            this.websocket.onmessage = (event) => {
                if(event.data == "pong") return;
                const msg: ServerSentMessage[] = JSON.parse(event.data);
                this.manager.onMessage(msg);
            }

            if(this.currentTimer != null){
                clearTimeout(this.currentTimer);
            }

            this.doPing();

        } catch (ex){
            this.manager.onStrategyFailed(this);
            this.isClosed = true;
        }

    }

    doPing(){
        this.currentTimer = setTimeout(() => {
            if(!this.isClosed){
                this.websocket.send("ping");
                this.doPing();
            } else {
                this.currentTimer = null;
            }            
        }, 25000);

    }


    async close() {
        this.isClosed = true;
        this.websocket.close();
    }

}