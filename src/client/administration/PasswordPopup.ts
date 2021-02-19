export class PasswordPopup {

    static callbackCancel: () => void;
    static callbackOK: (password: string) => void;

    static open(passwordFor: string, callbackCancel: () => void,
        callbackOK: (password: string) => void) {

        PasswordPopup.callbackOK = callbackOK;
        PasswordPopup.callbackCancel = callbackCancel;

        if (w2ui["PasswordForm"] == null) {
            $().w2form({
                name: 'PasswordForm',
                style: 'border: 0px; background-color: transparent;',
                formHTML:
                    '<div class="w2ui-page page-0">' +
                    '    <div class="w2ui-field">' +
                    '        <label>Neues Passwort:</label>' +
                    '        <div>' +
                    '           <input name="password" type="password" maxlength="100" style="width: 250px"/>' +
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

        }


        $().w2popup({
            title: 'Passwort ändern für ' + passwordFor,
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: true,
            onToggle: function (event) {
                $(w2ui.foo.box).hide();
                event.onComplete = function () {
                    $(w2ui.foo.box).show();
                    w2ui.foo.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    //@ts-ignore
                    $('#w2ui-popup #form').w2render('PasswordForm');
                }
            }
        });


    }

}