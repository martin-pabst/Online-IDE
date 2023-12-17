import { SchoolData, TeacherData } from "../communication/Data";
import { w2form, w2popup } from "../lib/w2ui-2.0.es6";

export class SelectTeacherPopup {

    static callbackCancel: () => void;
    static callbackOK: (teacher: TeacherData) => void;
    
    static open(className: string, teacherList: TeacherData[],
        callbackCancel: () => void,
        callbackOK: (teacher: TeacherData) => void) {
            
            SelectTeacherPopup.callbackOK = callbackOK;
            SelectTeacherPopup.callbackCancel = callbackCancel;

            teacherList.forEach(td => td["text"] = td.userData.familienname + ", " + td.userData.rufname + " (" + td.userData.username + ")");
            
            let form = new w2form({
                name: 'SelectTeacherForm',
                style: 'border: 0px; background-color: transparent;',
                fields: [
                    { field: 'klass', type: 'text', required: false, disabled: true,
                    html: { caption: 'Klasse', attr: 'style="width: 300px"' } },
                    { field: 'teacher', type: 'list',
                    html: { caption: 'Lehrkraft', attr: 'style="width: 300px"' }, options: { items: teacherList.sort((a, b) => a.userData.familienname.localeCompare(b.userData.familienname)) } }
                ],
                record: {
                    klass: className,
                    teacher: null,
                },
                actions: {
                    "cancel": function () {
                        w2popup.close();
                        SelectTeacherPopup.callbackCancel();
                    },
                    "ok": function () {
                        w2popup.close();
                        SelectTeacherPopup.callbackOK(this.record["teacher"]);
                    }
                }
            });



        w2popup.open({
            title: 'Zuordnen einer Lehrkraft zur Klasse ' + className,
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: false,
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    //@ts-ignore
                    $('#w2ui-popup #form').w2render('SelectTeacherForm');
                }
            }
        }).then(() => {
            form.render('#w2ui-popup #form');
        })


    }

}