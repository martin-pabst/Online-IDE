$(()=>{

    $('#login-button').on('click', () => {
        ajax('servlet/login', {
            'username': $('#login-username').val(),
            'password': $('#login-password').val(),
            'language': 0
        }, (response) => {
            window.location.href = response.server + "#" + response.ticket
        })
    })


})



function ajax(url, request, successCallback, errorCallback) {
    $.ajax({
        type: 'POST',
        async: true,
        data: JSON.stringify(request),
        contentType: 'application/json',
        url: url,
        success: function (response) {
            if (response.success != null && response.success == false) {
                let error = "Fehler bei der Bearbeitung der Anfrage";
                if (response.message != null)
                    error = response.message;
            }
            else {
                successCallback(response);
            }
            return;
        },
        error: function (jqXHR, message) {
            if (errorCallback) {
                let statusText = "Server nicht erreichbar.";
                if (jqXHR.status != 0) {
                    statusText = "" + jqXHR.status;
                }
                errorCallback(message + ": " + statusText);
                return;
            }
        }
    });
}