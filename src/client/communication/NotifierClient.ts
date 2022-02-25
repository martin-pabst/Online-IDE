import { Main } from "../main/Main.js";
import { ajax } from "./AjaxHelper.js";
import { GetWebSocketTokenResponse } from "./Data.js";
import { NetworkManager } from "./NetworkManager.js";

type SubscriptionMessageFromClient = {
    command: number,  // 1 == "subscribe", 2 == "disconnect"
    // 3 == "keepalive request"
    token?: string   // when "subscribe"
}

type SubscriptionMessageFromServer = {
    command: number // 1 == Acknoledge Connection, 2 == Notify, 3 == disconnect, 4 == keep alive response
}

type NotifierState = "connecting" | "connected" | "subscribed" | "disconnected";

export class NotifierClient {

    connection: WebSocket;
    state: NotifierState;

    constructor(private main: Main, private networkManager: NetworkManager){
        this.connect();
    }

    connect() {
        this.state = "connecting";

        ajax('getWebSocketToken', {}, (response: GetWebSocketTokenResponse) => {

            let url: string = (window.location.protocol.startsWith("https") ? "wss://" : "ws://") + window.location.host + "/servlet/subscriptionwebsocket";
            this.connection = new WebSocket(url);

            this.connection.onerror = (error: Event) => { this.onError(error); }
            this.connection.onclose = (event: CloseEvent) => { this.onClose(event); }
            this.connection.onmessage = (event: MessageEvent) => { this.onMessage(event); }

            this.connection.onopen = (event: Event) => {
                let request: SubscriptionMessageFromClient = {
                    command: 1,   // "subscribe"
                    token: response.token
                }

                this.state = "connected";
                this.sendIntern(JSON.stringify(request));

            }

            let that = this;
            setTimeout(() => {
                if(this.state != "subscribed"){
                    this.networkManager.forcedUpdateEvery = 1;
                    this.networkManager.counterTillForcedUpdate = 1;
                }
            }, 7000);

        });
    }

    disconnect(){
        let request: SubscriptionMessageFromClient = {
            command: 2   // "disconnect"
        }

        this.state = "connected";
        this.sendIntern(JSON.stringify(request));

    }

    unsentMessages: string[] = [];
    sendIntern(message: string) {

        if (this.state != "disconnected") {
            try {
                this.connection.send(message);
            } catch (exception) {
                console.log(exception);
            }
        }
    }

    onClose(event: CloseEvent) {
        this.state = "disconnected";
    }

    onMessage(event: MessageEvent) {

        let response: SubscriptionMessageFromClient = JSON.parse(event.data);
        if (response.command == undefined) return;

        // 1 == Acknoledge Connection, 2 == Notify, 3 == disconnect, 4 == keep alive response
        switch (response.command) {
            case 1: // Acknoledge Connection
                this.state = "subscribed";
                break;
            case 2: // Notify
                this.networkManager.sendUpdates(() => {}, true);
                break;
            case 3: // disconnect
                this.state = "disconnected";
                break;
            case 4: // keep alive response
                break;
        }
    }

    onError(error: Event) {
        console.log("Fehler beim Notifier-Websocket");
    }

}