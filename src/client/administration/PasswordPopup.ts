import { w2form, w2popup } from "../lib/w2ui-2.0.es6";

export class PasswordPopup {

    static callbackCancel: () => void;
    static callbackOK: (password: string) => void;

    static open(passwordFor: string, callbackCancel: () => void,
        callbackOK: (password: string) => void) {

        PasswordPopup.callbackOK = callbackOK;
        PasswordPopup.callbackCancel = callbackCancel;

        let form = new w2form({
                name: 'PasswordForm',
                style: 'border: 0px; background-color: transparent;',
                formHTML:
                    '<div class="w2ui-page page-0">' +
                    '    <div class="w2ui-field">' +
                    '        <label>Neues Passwort:</label>' +
                    '        <div>' +
                    '           <input name="password" type="password" autocomplete="new-password" maxlength="100" style="width: 250px"/>' +
                    '        </div>' +
                    '    </div>' +
                    '</div>' +
                    '<div class="w2ui-buttons">' +
                    '    <button class="w2ui-btn" name="cancel">Abbrechen</button>' +
                    '    <button class="w2ui-btn" name="ok">OK</button>' +
                    '</div>',
                fields: [
                    { field: 'password', type: 'password', required: true },
                ],
                record: {
                    password: '',
                },
                actions: {
                    "cancel": function () {
                        w2popup.close();
                        PasswordPopup.callbackCancel();
                    },
                    "ok": function () {
                        w2popup.close();
                        PasswordPopup.callbackOK(this.record["password"]);
                    }
                }
            });

        w2popup.open({
            title: 'Passwort ändern für ' + passwordFor,
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: false
        }).then(() => {
            form.render("#w2ui-popup #form");
        })


    }

}