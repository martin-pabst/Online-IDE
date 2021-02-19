import { Main } from "../Main.js";
import { openContextMenu, ContextMenuItem } from "../../tools/HtmlTools.js";
import { Dialog } from "./Dialog.js";
import { ajax } from "../../communication/AjaxHelper.js";

export class UserMenu {



    constructor(private main: Main){
        
    }

    init(){
        let $userSettingsButton = jQuery('#buttonUserSettings');
        let that = this;

        $userSettingsButton.on("click", (e) => {

            let contextMenuItems: ContextMenuItem[] = [
                {
                    caption: "Passwort ändern...",
                    callback: () => {
                        let passwortChanger = new PasswordChanger(that.main);
                        passwortChanger.show();
                    }
                }
            ]


            openContextMenu(contextMenuItems, $userSettingsButton.offset().left, $userSettingsButton.offset().top + $userSettingsButton.height());

        });

    }


}


export class PasswordChanger {

    dialog: Dialog;

    constructor(private main: Main){

        this.dialog = new Dialog();

    }

    show() {
        this.dialog.init();
        this.dialog.heading("Passwort ändern");
        this.dialog.description("Bitte geben Sie Ihr bisheriges Passwort und darunter zweimal Ihr neues Passwort ein. <br>" + 
        "Das Passwort muss mindestens 8 Zeichen lang sein und sowohl Buchstaben als auch Zahlen oder Sonderzeichen enthalten.")
        let $oldPassword = this.dialog.input("password", "Altes Passwort");
        let $newPassword1 = this.dialog.input("password", "Neues Passwort");
        let $newPassword2 = this.dialog.input("password", "Neues Passwort wiederholen");
        let $errorDiv = this.dialog.description("", "red");
        let waitDiv = this.dialog.waitMessage("Bitte warten...")

        this.dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => {this.dialog.close()}
            },
            {
                caption: "OK",
                color: "green",
                callback: () => {
                    if($newPassword1.val() != $newPassword2.val()){
                        $errorDiv.text("Die zwei eingegebenen neuen Passwörter stimmen nicht überein.")
                    } else {
                        waitDiv(true);
                        ajax("changePassword", {oldPassword: $oldPassword.val(), newPassword: $newPassword1.val()}, () => {
                            waitDiv(false);
                            alert("Das Passwort wurde erfolgreich geändert.");
                            this.dialog.close();
                        }, (message) => {
                            waitDiv(false);
                            $errorDiv.text(message)
                        })
                    }

                }
            },
        ])
    }

}