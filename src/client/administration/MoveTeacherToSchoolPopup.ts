import { SchoolData } from "../communication/Data";
import { w2form, w2popup } from "../lib/w2ui-2.0.es6";

export class MoveTeacherToSchoolPopup {

    static callbackCancel: () => void;
    static callbackOK: (newSchoolId: SchoolData) => void;
    
    static open(name: string, oldSchool: SchoolData, schoolDataList: SchoolData[],
        callbackCancel: () => void,
        callbackOK: (newSchoolId: SchoolData) => void) {
            
            schoolDataList.forEach(sd => sd.text = sd.name);

            MoveTeacherToSchoolPopup.callbackOK = callbackOK;
            MoveTeacherToSchoolPopup.callbackCancel = callbackCancel;
            
            let form = new w2form({
                name: 'MoveTeacherForm',
                style: 'border: 0px; background-color: transparent;',
                fields: [
                    { field: 'oldSchool', type: 'text', required: false, disabled: true,
                    html: { label: 'Bisherige Schule', attr: 'style="width: 300px"' } },
                    { field: 'newSchool', type: 'list',
                    html: { label: 'Neue Schule', attr: 'style="width: 300px"' }, options: { items: schoolDataList.sort((a, b) => a.text.localeCompare(b.text)) } }
                ],
                record: {
                    oldSchool: oldSchool.name,
                    newSchool: oldSchool,
                },
                actions: {
                    "cancel": function () {
                        w2popup.close();
                        MoveTeacherToSchoolPopup.callbackCancel();
                    },
                    "ok": function () {
                        w2popup.close();
                        MoveTeacherToSchoolPopup.callbackOK(this.record["newSchool"]);
                    }
                }
            });



        w2popup.open({
            title: 'Lehrkraft verschieben: ' + name,
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: false,
        }).then(() => {
            form.render("#w2ui-popup #form");
        })


    }

}