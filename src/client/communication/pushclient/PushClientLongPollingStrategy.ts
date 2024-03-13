import { csrfToken } from "../AjaxHelper";
import { BasePushClientManager } from "./BasePushClientManager.js";
import { PushClientStrategy } from "./PushClientStrategy";

export class PushClientLongPollingStrategy extends PushClientStrategy {

    isClosed: boolean;
    csrfToken: string;

    shortestTimeoutMs: number = 60000;   // 60 s
    timeOpened: number = null;

    abortController: AbortController;



    constructor(manager: BasePushClientManager) {
        super("long-polling strategy", manager);
        this.isClosed = false;
    }

    open(): void {

        this.isClosed = false;

        this.abortController = new AbortController();

        this.timeOpened = performance.now();

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", csrfToken]);
        this.csrfToken = csrfToken;
        headers.push(["x-timeout", this.shortestTimeoutMs + ""]);

        try {
            fetch("/servlet/registerLongpollingListener", {
                signal: this.abortController.signal,
                method: "POST",
                headers: headers,
                body: JSON.stringify({})
            }).then((response) => {

                if (response.status != 200) {
                    console.log(`Long-polling listener got http-status: ${response.status} (${response.statusText})`);
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
                    case 401:
                        console.log("PushClientLongPollingStrategy: Got http status code 401, therefore stopping.");
                        break;
                    default:
                        this.reopen(10000, false);
                        break;
                }

            }).catch((reason) => {
                console.log(`Long-polling listener failed due to reason: ${reason}`);
                this.reopen(10000, false);
            }).finally(() => {
                this.abortController = null;
            })

        } catch (ex) {
            this.reopen(10000, false);
        }

    }

    reopen(timeout: number = 500, silently: boolean = true) {
        if (this.isClosed) return;
        if(timeout > 500){
            console.log(`Reopen long-polling listener in ${timeout / 1000} seconds...`);
        }
        setTimeout(() => {
            if (this.isClosed) return;
            this.open();
        }, timeout);

    }


    async close() {
        this.isClosed = true;
        this.abortController?.abort();

        let headers: [string, string][] = [["content-type", "text/json"]];

        headers.push(["x-token-pm", this.csrfToken]);

        await fetch("/servlet/unregisterLongpollingListener", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({})
        })
    }

}