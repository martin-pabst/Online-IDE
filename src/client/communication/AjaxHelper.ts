import { LoginRequest } from "./Data.js";

// export var credentials: { username: string, password: string } = { username: null, password: null };


export function ajax(url: string, request: any, successCallback: (response: any) => void,
    errorCallback?: (message: string) => void) {
    showNetworkBusy(true);
    $.ajax({
        type: 'POST',
        async: true,
        data: JSON.stringify(request),
        contentType: 'application/json',
        url: url,
        success: function (response: any) {
            showNetworkBusy(false);
            if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
                let error = "Fehler bei der Bearbeitung der Anfrage"
                if (response.message != null) error = response.message;

                if (error == "Not logged in") {
                    // setTimeout(() => newLogin(url, request, successCallback, errorCallback), 10000);
                    // location.reload();
                }

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



// export function newLogin(url: string, request: any, successCallback: (response: any) => void,
//     errorCallback?: (message: string) => void) {

//     if (credentials.username == null) return;
//     let loginRequest: LoginRequest = {username: credentials.username, password: credentials.password};

//     $.ajax({
//         type: 'POST',
//         data: JSON.stringify(loginRequest),
//         contentType: 'application/json',
//         url: "login",
//         success: function (response: any) {
//             if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
//             } else {
//                 ajax(url, request, successCallback, errorCallback);
//             }
//             return;
//         },
//         error: function (jqXHR, message) {
// //            ajax(url, request, successCallback, errorCallback);
//         }
//     });
// }
