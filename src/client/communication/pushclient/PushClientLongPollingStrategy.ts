import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager } from "./BasePushClientManager.js";
import { PushClientManager } from "./PushClientManager";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientLongPollingStrategy extends PushClientStrategy {

    isClosed: boolean;
    csrfToken: string;

    constructor(manager: BasePushClientManager) {
        super("long-polling strategy", manager);
        this.isClosed = false;
    }

    open(): void {

        if (this.isClosed) return;

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);
        this.csrfToken = csrfToken;

        try {
            fetch("/servlet/registerLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({})
            }).then((response) => {

                switch (response.status) {
                    case 200:
                        response.json().then(data => this.manager.onMessage(data));
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
                this.reopen(10000);
            })

        } catch (ex) {
            this.reopen();
        }

    }

    reopen(timeout: number = 4000) {

        setTimeout(() => {
            this.open();
        }, 4000);

    }


    close() {
        this.isClosed = true;
        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", this.csrfToken]);

        fetch("/servlet/unregisterLongpollingListener", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({})
        })
    }

}