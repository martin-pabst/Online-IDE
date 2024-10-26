import { findGetParameter } from '../../tools/HtmlTools';
import { setCookie } from '../../tools/HttpTools';
import { VidisNewUserRequest } from '../communication/Data';
import '/include/css/registerUser.css';

type NewUserResponse = {success: boolean, message: string, fromSqlIde: boolean, singleUseToken: string}

window.onload = () => {

     // let sqlIdeToken = location.search.split('sqlIdeToken=')[1];


    let singleUseToken = findGetParameter('singleUseToken');

    if(!singleUseToken){
        singleUseToken = findGetParameter('sqlIdeToken');
        // setCookie("singleUseToken", singleUseToken, 600);
    }


    document.getElementById('newAccountButton').addEventListener('pointerdown', () => {
        let nickname: string = (<HTMLInputElement>document.getElementById('nickname')).value + "";
        if (nickname.length == 0) {
            document.getElementById('message2').textContent = "Bitte geben Sie Ihren Nickname (= Username) ein.";
        } else {

            document.getElementById('message2').textContent = "";
            document.getElementById('login-spinner').style.visibility = "visible";

            let request: VidisNewUserRequest = {
                singleUseToken: singleUseToken,
                nickname: nickname,
                klasse: null, //(<HTMLInputElement>document.getElementById('klasse')).value + "",
                username: null,
                password: null
            }

            doVidisRequest(request);

        }

    })

    document.getElementById('mergeAccountsButton').addEventListener('pointerdown', () => {
        let username: string = (<HTMLInputElement>document.getElementById('login-username')).value + "";
        let password: string = (<HTMLInputElement>document.getElementById('login-password')).value + "";
        if (username.length == 0) {
            document.getElementById('message1').textContent = "Bitte geben Sie Ihren Benutzernamen ein.";
        } else if (password.length == 0) {
            document.getElementById('message1').textContent = "Bitte geben Sie Ihr Passwort ein.";
        } else {
            document.getElementById('message1').textContent = "";
            document.getElementById('login-spinner').style.visibility = "visible";

            let request: VidisNewUserRequest = {
                singleUseToken: singleUseToken,
                username: username,
                password: password,
                nickname: null, klasse: null
            }

            doVidisRequest(request);

        }
    })



}

function doVidisRequest(request: VidisNewUserRequest) {

    fetch("/servlet/vidisNewUser", {
        method: "POST",
        body: JSON.stringify(request)
    }).then(resp => {
        resp.json().then((newUserResponse: NewUserResponse) => {
            if (newUserResponse.success) {

                if(newUserResponse.fromSqlIde){
                    window.location.assign("https://sql-ide.de/index.html?singleUseToken=" + newUserResponse.singleUseToken);
                } else {
                    window.location.assign("/index.html?singleUseToken=" + newUserResponse.singleUseToken);
                }


            } else {
                alert("Fehler beim Anmelden:\n" + newUserResponse.message);
            }
        })
    })


}

