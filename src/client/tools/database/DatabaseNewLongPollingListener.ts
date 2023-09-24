import { ajaxAsync, csrfToken } from "../../communication/AjaxHelper.js";
import { DatabaseLongPollingListenerRequest, JMessageFromServer, JWebSocketMessageConnect, JWebSocketMessageDisconnect, JWebSocketMessageExecuteStatement, LongPollingListenerResponse, SendingStatementsMessageFromServer, WebSocketRequestConnect } from "../../communication/Data.js";
import { NetworkManager } from "../../communication/NetworkManager.js";
import { ServerSentMessage } from "../../communication/pushclient/PushClientManager.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ConnectionHelper } from "../../runtimelibrary/database/Connection.js";
import jQuery from 'jquery';

type JavaRegisterDatabaseSSEListenerRequest = { token: string, registerOrUnregister: "register" | "unregister" }
type JavaRegisterDatabaseSSEListenerResponse = { success: boolean, message: string }

type DatabaseChangedSSEMessage = {
    databaseId: number,
    firstNewStatementIndex?: number,
    newStatements?: string[],
    rollbackToVersion?: number
}

type OnServerStatementsCallback = (firstNewStatementIndex: number, newStatements: string[], rollbackToVersion: number) => void

export class DatabaseNewLongPollingListener {    

    private static openListeners: DatabaseNewLongPollingListener[] = [];

    isClosed: boolean;

    constructor(private networkManager: NetworkManager,
        private token: string, private databaseId: number, private onServerSentStatementsCallback: OnServerStatementsCallback) {
        
        this.isClosed = false;
        DatabaseNewLongPollingListener.openListeners.push(this);

        this.open();
    }

    static close(){
        DatabaseNewLongPollingListener.openListeners.forEach(listener => listener.close());
    }

    open(): void {

        if(this.isClosed) return;

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);

        try {
            fetch("/servlet/registerLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ token: this.token })
            }).then((response) => {

                switch (response.status) {
                    case 200:
                        response.json().then(data => this.onMessage(data));
                        this.reopen();
                        break;
                    case 502:   // timeout!
                        this.reopen();
                        break;
                    default:
                        this.reopen(10000);
                        break;
                }

            }).catch((reason) => {
                console.log(reason);
                this.reopen();
            })

        } catch (ex) {
            this.reopen();
        }

    }

    reopen(timeout: number = 500) {

        setTimeout(() => {
            this.open();
        }, timeout);

    }


    onDBMessage(data: DatabaseChangedSSEMessage) {
        if (data.databaseId != this.databaseId) return;
        console.log("Message: " + data);
        this.onServerSentStatementsCallback(data.firstNewStatementIndex, data.newStatements, data.rollbackToVersion)
    }


    close() {
        this.isClosed = true;

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);

        try {
            fetch("/servlet/unregisterLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ token: this.token })
            })

        } catch (ex) {
            
        }
    }

    onMessage(ssm: ServerSentMessage) {

        switch (ssm.eventType) {
            case 'close':
                return;
            case 'broadcastDatabaseChange':
                this.onDBMessage(ssm.data);
                return;
        }
    }






}