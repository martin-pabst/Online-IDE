import { LoginRequest, PerformanceData } from "./Data.js";
import jQuery from 'jquery';
import { SSEManager } from "./SSEManager.js";
// export var credentials: { username: string, password: string } = { username: null, password: null };

export class PerformanceCollector {
    static performanceData: PerformanceData[] = [];
    static performanceDataCount: number = 0;
    static lastTimeSent: number = performance.now();

    static registerPerformanceEntry(url: string, startTime: number) {
        let pe: PerformanceData = PerformanceCollector.performanceData.find(pe => pe.url == url);
        if (pe == null) {
            pe = { count: 0, sumTime: 0, url: url };
            PerformanceCollector.performanceData.push(pe);
        }
        pe.count++; //Test
        let dt = Math.round(performance.now() - startTime);
        pe.sumTime += dt;
        PerformanceCollector.performanceDataCount++;
        // console.log("Performance entry for path " + pe.url + ": " + dt + " ms, aggregated: " + pe.sumTime + " for " + pe.count + " requests.");
    }

    static sendDataToServer() {
        if (performance.now() - PerformanceCollector.lastTimeSent > 3 * 60 * 1000) {
            let request = {
                data: PerformanceCollector.performanceData
            }

            PerformanceCollector.performanceData = [];
            PerformanceCollector.performanceDataCount = 0;
            PerformanceCollector.lastTimeSent = performance.now();

            ajax("collectPerformanceData", request, () => { })

        }

    }

}

export var csrfToken: string = "";

export function ajax(url: string, request: any, successCallback: (response: any) => void,

    errorCallback?: (message: string) => void) {

        if(!url.startsWith("http")){
            url = "servlet/" + url;
        }
   

    showNetworkBusy(true);
    let time = performance.now();

    let headers: {[key: string]: string;} = {};
    if(csrfToken != null) headers = {"x-token-pm": csrfToken};

    jQuery.ajax({
        type: 'POST',
        async: true,
        data: JSON.stringify(request),
        contentType: 'application/json',
        headers: headers,
        url: url,
        success: function (response: any) {

            PerformanceCollector.registerPerformanceEntry(url, time);

            if(response["csrfToken"] != null)
            {
                csrfToken = response["csrfToken"];
                SSEManager.open(csrfToken);
            }
            

            showNetworkBusy(false);
            if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
                let error = "Fehler bei der Bearbeitung der Anfrage"
                if (response.message != null) error = response.message;
                if (response.error != null) error = response.error;

                if (error.indexOf("Not logged in") >= 0) {
                    // setTimeout(() => newLogin(url, request, successCallback, errorCallback), 10000);
                    // location.reload();
                }
                
                console.log("Netzwerkfehler: " + error);

                if (errorCallback) errorCallback(error);
            } else {
                successCallback(response);
            }
            return;

        },
        error: function (jqXHR, message) {
            showNetworkBusy(false);
            if (errorCallback) {
                let statusText = "Server nicht erreichbar."
                if (jqXHR.status != 0) {
                    statusText = "" + jqXHR.status
                }
                errorCallback(message + ": " + statusText);
                return;
            }
        }
    });
}

export function showNetworkBusy(busy: boolean) {
    if (busy) {
        jQuery('.jo_network-busy').show();
    } else {
        jQuery('.jo_network-busy').hide();
    }
}


export function extractCsrfTokenFromGetRequest(){
    let url = window.location.href;
    let tokenIndex = url.indexOf("csrfToken=");
    if(tokenIndex >= 0){
        let token = url.substring(tokenIndex + "csrfToken=".length);
        if(token != null && token.length > 0){
            csrfToken = token;
        }
    }
}


export async function ajaxAsync(url: string, data: any): Promise<any>{
    let headers: [string, string][] = [["content-type", "text/json"]];

    if(csrfToken != null){
        headers.push(["x-token-pm", csrfToken]);
    }

    try {
        let response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data)
        })

         let obj: any = await response.json()

        if(obj["token"] != null){
            csrfToken = obj["token"];
            SSEManager.open(csrfToken);
        }

        if(obj == null){
            alert("Fehler beim Übertragen der Daten.");             
        } else if(obj.success != true){
            alert("Fehler beim Übertragen der Daten:\n" + obj.message);             
        }

        return obj;
    } catch (exception){
        return {
            status: "Error",
            message: "Es ist ein Fehler aufgetreten: " + exception
        }
    }
}


