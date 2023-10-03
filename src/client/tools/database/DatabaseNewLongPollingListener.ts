import { csrfToken } from "../../communication/AjaxHelper.js";
import { NetworkManager } from "../../communication/NetworkManager.js";
import { ServerSentMessage } from "../../communication/pushclient/BasePushClientManager.js";
import { SqlIdeUrlHolder } from "../../main/SqlIdeUrlHolder.js";

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
    abortController: AbortController;

    shortestTimeoutMs: number = 60000;   // 60 s
    timeOpened: number = null;

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

        this.abortController = new AbortController();

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", "JJ" + csrfToken]);
        headers.push(["x-timeout", this.shortestTimeoutMs + ""]);

        try {
            fetch(SqlIdeUrlHolder.sqlIdeURL + "registerLongpollingListener", {
                signal: this.abortController.signal,
                method: "POST",
                headers: headers,
                body: JSON.stringify({ token: this.token })
            }).then((response) => {

                if (response.status != 200) {
                    let timeMs = Math.round(performance.now() - this.timeOpened) - 4000;
                    if (timeMs < this.shortestTimeoutMs) this.shortestTimeoutMs = timeMs;
                }

                switch (response.status) {
                    case 200:
                        response.json().then(data => {
                            console.log("http 200: " + data);
                            this.onMessage(data);
                            this.reopen();
                        })
                        break;
                    case 502:   // timeout!
                        this.reopen();
                        break;
                    default:
                        this.reopen(10000);
                        break;
                }

            }).catch((reason) => {
                if((""+reason).indexOf("abort") < 0){
                    console.log(reason);
                    this.reopen(10000);
                }
            }).finally(() => {
                this.abortController = null;
            })

        } catch (ex) {
            console.log("Exception opening DatabaseLongPollingListener: " + ex);
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

        this.abortController?.abort();

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", "JJ" + csrfToken]);

        try {
            fetch("/servlet/unregisterLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ token: this.token })
            })

        } catch (ex) {
            
        }
    }

    onMessage(ssm: ServerSentMessage[]) {

        for(let message of ssm){
            switch (message.eventType) {
                case 'close':
                    return;
                case 'broadcastDatabaseChange':
                    this.onDBMessage(message.data);
                    return;
            }
        }

    }






}