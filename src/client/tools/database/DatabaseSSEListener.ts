import { ajaxAsync, csrfToken } from "../../communication/AjaxHelper.js";
import { DatabaseLongPollingListenerRequest, JMessageFromServer, JWebSocketMessageConnect, JWebSocketMessageDisconnect, JWebSocketMessageExecuteStatement, LongPollingListenerResponse, SendingStatementsMessageFromServer, WebSocketRequestConnect } from "../../communication/Data.js";
import { NetworkManager } from "../../communication/NetworkManager.js";
import { SSEManager, ServerSentMessage } from "../../communication/SSEManager.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ConnectionHelper } from "../../runtimelibrary/database/Connection.js";
import jQuery from 'jquery';

type JavaRegisterDatabaseSSEListenerRequest = { token: string, registerUnregister: "register" | "unregister" }
type JavaRegisterDatabaseSSEListenerResponse = { success: boolean, message: string }

type DatabaseChangedSSEMessage = {
    databaseId: number,
    firstNewStatementIndex?: number,
    newStatements?: string[],
    rollbackToVersion?: number
}

type OnServerStatementsCallback = (firstNewStatementIndex: number, newStatements: string[], rollbackToVersion: number) => void

export class DatabaseSSEListener {

    isClosed: boolean = false;

    static sseEventSource: EventSource;
    static subscribers: DatabaseSSEListener[] = [];


    constructor(private networkManager: NetworkManager,
        private token: string, private databaseId: number, private onServerSentStatementsCallback: OnServerStatementsCallback) {

        let request: JavaRegisterDatabaseSSEListenerRequest = { token: token, registerUnregister: "register" }
        ajaxAsync(networkManager.sqlIdeURL + "jRegisterSSEListener", request);

        DatabaseSSEListener.subscribe(this)

    }

    onMessage(data: DatabaseChangedSSEMessage) {
        if (data.databaseId != this.databaseId) return;
        console.log("Message: " + data);
        this.onServerSentStatementsCallback(data.firstNewStatementIndex, data.newStatements, data.rollbackToVersion)
    }

    close() {
        DatabaseSSEListener.unsubscribe(this);
        let request: JavaRegisterDatabaseSSEListenerRequest = { token: this.token, registerUnregister: "unregister" }
        ajaxAsync(this.networkManager.sqlIdeURL + "servlet/jRegisterSSEListener", request);
    }


    private static subscribe(listener: DatabaseSSEListener) {
        if (this.sseEventSource == null) {
            DatabaseSSEListener.openSSE(listener.networkManager);
        }

        DatabaseSSEListener.subscribers.push(listener);
    }

    private static unsubscribe(listener: DatabaseSSEListener) {
        DatabaseSSEListener.subscribers.splice(DatabaseSSEListener.subscribers.indexOf(listener));
    }

    private static openSSE(networkManager: NetworkManager) {
        try {
            DatabaseSSEListener.sseEventSource = new EventSource(networkManager.sqlIdeURL + "sse?javaCsrfToken=" + csrfToken);

            DatabaseSSEListener.sseEventSource.onmessage = (event) => {
                let ssm: ServerSentMessage = JSON.parse(event.data);

                if (ssm.eventType == "checkIfAlive") {
                    ajaxAsync(networkManager.sqlIdeURL + "sseKeepAlive?keepAliveToken=" + ssm.data, "");
                    return;
                }

                if (ssm.eventType == "close") {
                    DatabaseSSEListener.closeSSE();
                }

                for (let subscriber of DatabaseSSEListener.subscribers) {
                    subscriber.onMessage(ssm.data);
                }

            }

            console.log("SSE-Client opened with token " + csrfToken)

        } catch (ex) {
            console.log(ex);
        }

    }

    public static closeSSE() {
        let es = DatabaseSSEListener.sseEventSource;
        if (es != null) {
            DatabaseSSEListener.sseEventSource = null;
            es.close();
            console.log("SSE-Client closed");
        }
    }

}