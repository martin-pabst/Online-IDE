import { JMessageFromServer, JWebSocketMessageConnect, JWebSocketMessageDisconnect, JWebSocketMessageExecuteStatement, SendingStatementsMessageFromServer, WebSocketRequestConnect } from "../../communication/Data.js";
import { NetworkManager } from "../../communication/NetworkManager.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ConnectionHelper } from "../../runtimelibrary/database/Connection.js";

export class DatabaseWebSocket {

    connection: WebSocket;
    isOpen: boolean;
    callbackWhenOpen: (error: string) => void;

    constructor(private networkManager: NetworkManager, 
        private connectionHelper: ConnectionHelper, private interpreter: Interpreter,
        private onServerSentStatementsCallback: (message: SendingStatementsMessageFromServer) => void) {

    }

    open(callback: (error: string) => void) {
        let url = this.networkManager.sqlIdeURL.replace("http", "ws") + "jwebsocket";
        this.connection = new WebSocket(url);

        this.connection.onerror = (error: Event) => { this.onError(error); }
        this.connection.onclose = (event: CloseEvent) => { this.onClose(event); }
        this.connection.onmessage = (event: MessageEvent) => { this.onMessage(event); }

        this.connection.onopen = (event: Event) => {
            
            let request: JWebSocketMessageConnect = {
                command: 1,
                databaseVersion: this.connectionHelper.databaseData.statements.length,
                token: this.connectionHelper.token
            }
            this.callbackWhenOpen = callback;
            this.sendIntern(JSON.stringify(request));

        }
    }


    onError(error: Event) {
        this.interpreter.throwException("Kommunikationsfehler beim WebSocket");
        this.isOpen = false;
        if(this.callbackWhenOpen){
            this.callbackWhenOpen("Die Websocket-Datenbankverbindung kam nicht zustande.");
            this.callbackWhenOpen = null;
        }
    }

    onClose(event: CloseEvent) {
        this.isOpen = false;
        if(this.callbackWhenOpen){
            this.callbackWhenOpen("Die Websocket-Datenbankverbindung kam nicht zustande.");
            this.callbackWhenOpen = null;
        }
    }

    onMessage(event: MessageEvent) {
        this.isOpen = true;
        if(this.callbackWhenOpen){
            this.callbackWhenOpen(null);
            this.callbackWhenOpen = null;
        }
        let response: JMessageFromServer = JSON.parse(event.data);
        if (response.command == undefined) return;

        switch (response.command) {
            case 2: 
                if(this.onServerSentStatementsCallback != null){
                    this.onServerSentStatementsCallback(<SendingStatementsMessageFromServer>response);
                }
                break;
            case 3: // disconnect message from server
                this.isOpen = false;
                break;
            case 4: // keepalive message from server
                break;
        }
    }

    close(){
        let message: JWebSocketMessageDisconnect = {
            command: 4
        };
        this.sendIntern(JSON.stringify(message));
    }

    sendIntern(message: string) {
        try {
            this.connection.send(message);
        } catch (exception) {
            console.log(exception); 
        }
    }

}