import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager } from "./BasePushClientManager.js";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientLongPollingStrategy extends PushClientStrategy {

    isClosed: boolean;
    csrfToken: string;

    constructor(manager: BasePushClientManager) {
        super("long-polling strategy", manager);
        this.isClosed = false;
    }

    open(): void {

        console.log(`Opening ${this.name}`);

        this.isClosed = false;

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);
        this.csrfToken = csrfToken;

        try {
            fetch("/servlet/registerLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({})
            }).then((response) => {

                if(response.status != 200){
                    console.log(`Long-polling listener got http-status: ${response.status} (${response.statusText})`);
                }

                switch (response.status) {
                    case 200:
                        response.json().then(data => this.manager.onMessage(data));
                        this.reopen();
                        break;
                    case 502:   // timeout!
                    case 504:   // gateway timeout!
                        this.reopen();
                        break;
                    default:
                        this.reopen(10000);
                        break;
                }

            }).catch((reason) => {
                console.log(`Long-polling listener failed due to reason: ${reason}`);
                this.reopen(10000);
            })

        } catch (ex) {
            this.reopen(10000);
        }

    }

    reopen(timeout: number = 500) {
        if (this.isClosed) return;
        console.log(`Reopen long-polling listener in ${timeout/1000} seconds...`);
        setTimeout(() => {
            if (this.isClosed) return;
            this.open();
        }, timeout);

    }


    async close() {
        this.isClosed = true;
        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", this.csrfToken]);

        await fetch("/servlet/unregisterLongpollingListener", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({})
        })
    }

}