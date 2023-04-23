import { csrfToken } from "../../communication/AjaxHelper.js";
import { DatabaseLongPollingListenerRequest, JMessageFromServer, JWebSocketMessageConnect, JWebSocketMessageDisconnect, JWebSocketMessageExecuteStatement, LongPollingListenerResponse, SendingStatementsMessageFromServer, WebSocketRequestConnect } from "../../communication/Data.js";
import { NetworkManager } from "../../communication/NetworkManager.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { ConnectionHelper } from "../../runtimelibrary/database/Connection.js";
import jQuery from 'jquery';

export class DatabaseLongPollingListener {

    identifier: number = Math.floor(Math.random() * 999999999);
    isClosed: boolean = false;

    constructor(private networkManager: NetworkManager,
        private token: string,
        private onServerSentStatementsCallback: (firstNewStatementIndex: number, newStatements: string[], rollbackToVersion: number) => void) {
    }

    longPoll() {
        let that = this;

        let request: DatabaseLongPollingListenerRequest = {
            token: this.token,
            listenerIdentifier: this.identifier
        }

        let headers: {[key: string]: string;} = {};
        if(csrfToken != null) headers = {"x-token-pm": csrfToken};

        jQuery.ajax({
            type: 'POST',
            async: true,
            headers: headers,
            data: JSON.stringify(request),
            contentType: 'application/json',
            url: that.networkManager.sqlIdeURL + "jRegisterLongPollingListener",
            success: function (resp: string) {
                if (resp != null && !that.isClosed && resp != "") {
                    let response: LongPollingListenerResponse = JSON.parse(resp);
                    if (response.success) {
                        that.onServerSentStatementsCallback(response.firstNewStatementIndex,
                            response.newStatements, response.rollbackToVersion);
                    }
                }

                if (!that.isClosed) {
                    setTimeout(() => {
                        that.longPoll();
                    }, 100);
                }
            },
            error: function (jqXHR, message) {
                if (!that.isClosed) {
                    setTimeout(() => {
                        that.longPoll();
                    }, 1000);
                }
            }
        });

    }

    close(){
        this.isClosed = true;
    }

}