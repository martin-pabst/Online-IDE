import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager } from "./BasePushClientManager.js";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientLongPollingStrategy extends PushClientStrategy {

    isClosed: boolean;
    csrfToken: string;

    shortestTimeoutMs: number = 60000;   // 60 s
    timeOpened: number = null;


    constructor(manager: BasePushClientManager) {
        super("long-polling strategy", manager);
        this.isClosed = false;
    }

    open(): void {

        this.isClosed = false;
        this.timeOpened = performance.now();

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);
        this.csrfToken = csrfToken;
        headers.push(["x-timeout", this.shortestTimeoutMs + ""]);

        try {
            fetch("/servlet/registerLongpollingListener", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({})
            }).then((response) => {

                if (response.status != 200) {
                    console.log(`Long-polling listener got http-status: ${response.status} (${response.statusText})`);
                }

                if(response.status != 200){
                    let timeMs = Math.round(performance.now() - this.timeOpened) - 4000;
                    if (timeMs < this.shortestTimeoutMs) this.shortestTimeoutMs = timeMs;
                }

                switch (response.status) {
                    case 200:
                        response.json().then(data => {
                            this.manager.onMessage(data)
                        });
                        this.reopen();
                        break;
                    case 502:   // timeout!
                    case 504:   // gateway timeout!
                        this.reopen(1000, false);
                        break;
                    default:
                        this.reopen(10000, false);
                        break;
                }

            }).catch((reason) => {
                console.log(`Long-polling listener failed due to reason: ${reason}`);
                this.reopen(10000, false);
            })

        } catch (ex) {
            this.reopen(10000, false);
        }

    }

    reopen(timeout: number = 500, silently: boolean = true) {
        if (this.isClosed) return;
        console.log(`Reopen long-polling listener in ${timeout / 1000} seconds...`);
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