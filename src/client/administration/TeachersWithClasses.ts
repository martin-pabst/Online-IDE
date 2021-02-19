import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse, TeacherData, ClassData, CRUDClassRequest, GetTeacherDataRequest, GetTeacherDataResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { TilingSprite } from "pixi.js";
import { PasswordPopup } from "./PasswordPopup.js";

declare var w2prompt: any;
declare var w2alert: any;

export class TeachersWithClassesMI extends AdminMenuItem {

    classesGridName = "tgClassesGrid";
    teachersGridName = "TgTeachersGrid";

    classesGrid: W2UI.W2Grid;
    teachersGrid: W2UI.W2Grid;

    teacherDataList: TeacherData[] = [];

    checkPermission(user: UserData): boolean {
        return user.is_schooladmin;
    }

    getButtonIdentifier(): string {
        return "Lehrkräfte mit Klassen";
    }

    onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {
        let that = this;

        if (this.teachersGrid != null) {
            this.teachersGrid.render();
        } else {
            $tableLeft.w2grid({
                name: this.teachersGridName,
                header: 'Lehrkräfte',
                selectType: "cell",
                multiSelect: true,
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true,
                    toolbarSearch: false

                },
                toolbar: {
                    items: [
                        { type: 'break' },
                        { type: 'button', id: 'passwordButton', text: 'Passwort ändern...' } //, img: 'fa-key' }
                    ],
                    onClick: function (target, data) {
                        if (target == "passwordButton") {
                            that.changePassword();
                        }
                    }
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'username', caption: 'Benutzername', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'rufname', caption: 'Rufname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'familienname', caption: 'Familienname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'numberOfClasses', caption: 'Klassen', size: '30%', sortable: true, resizable: true,
                        render: function (record: TeacherData) {
                            return '<div>' + record.classes.length + '</div>';
                        }
                    },
                    {
                        field: 'id', caption: 'PW', size: '40px', sortable: false, render: (e) => {
                            return '<div class="pw_button" title="Passwort ändern" data-recid="' + e.recid + '">PW!</div>';
                        }
                    }
                ],
                searches: [
                    { field: 'username', label: 'Benutzername', type: 'text' },
                    { field: 'rufname', label: 'Rufname', type: 'text' },
                    { field: 'familienname', label: 'Familienname', type: 'text' }
                ],
                sortData: [{ field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
                onSelect: (event) => { that.onSelectTeacher(event) },
                onUnselect: (event) => { that.onSelectTeacher(event) },
                onAdd: (event) => { that.onAddTeacher() },
                onChange: (event) => { that.onUpdateTeacher(event) },
                onDelete: (event) => { that.onDeleteTeacher(event) },
            })

            this.teachersGrid = w2ui[this.teachersGridName];

        }

        this.loadTablesFromTeacherObject();

        this.initializePasswordButtons();

        if (this.classesGrid != null) {
            this.classesGrid.render();
        } else {
            $tableRight.w2grid({
                name: this.classesGridName,
                header: 'Klassen',
                selectType: "cell",
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Name', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'teacher', caption: 'Lehrkraft', size: '30%', sortable: true, resizable: true,
                        editable: { type: 'list', items: that.teacherDataList, filter: false }
                    },
                ],
                searches: [
                    { field: 'name', label: 'Name', type: 'text' },
                ],
                sortData: [{ field: 'name', direction: 'asc' }],
                onAdd: (event) => { that.onAddClass() },
                onChange: (event) => { that.onUpdateClass(event) },
                onDelete: (event) => { that.onDeleteClass(event) },
            });

            this.classesGrid = w2ui[this.classesGridName];

        }

    }

    initializePasswordButtons() {
        setTimeout(() => {
            jQuery('.pw_button').off('click');
            let that = this;
            jQuery('.pw_button').on('click', (e) => {
                let recid = jQuery(e.target).data('recid');
                e.preventDefault();
                e.stopPropagation();
                that.changePassword([recid]);
            });
        }, 1500);

    }

    changePassword(recIds: number[] = []) {
        let that = this;

        if (recIds.length == 0) {
            //@ts-ignore
            recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }

        if (recIds.length != 1) {
            this.teachersGrid.error("Zum Ändern eines Passworts muss genau eine Lehrkraft ausgewählt werden.");
        } else {
            let teacher: UserData = <UserData>(this.teachersGrid.get(recIds[0] + "", false)["userData"]);

            let passwordFor: string = teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ")";
            PasswordPopup.open(passwordFor, () => { }, (password) => {
                teacher.password = password;

                let request: CRUDUserRequest = {
                    type: "update",
                    data: teacher,
                }
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

                ajax("CRUDUser", request, (response: CRUDResponse) => {

                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ") wurde erfolgreich geändert.");
            }, () => {
                //@ts-ignore
                w2utils.unlock(jQuery('body'));
                w2alert('Fehler beim Ändern des Passworts!');
                });
            });


            // w2prompt({
            //     label: 'Neues Passwort',
            //     value: '',
            //     attrs: 'style="width: 200px" type="password"',
            //     title: "Passwort für " + admin.rufname + " " + admin.familienname + " (" + admin.username + ")",
            //     ok_text: "OK",
            //     cancel_text: "Abbrechen",
            //     width: 600,
            //     height: 200
            // })
            //     .change(function (event) {

            //     })
            //     .ok(function (password) {
            //         admin.password = password;

            //         let request: CRUDUserRequest = {
            //             type: "update",
            //             data: admin,
            //         }

            //         ajax("CRUDUser", request, (response: CRUDResponse) => {

            //             w2alert('Das Passwort für ' + admin.rufname + " " + admin.familienname + " (" + admin.username + ") wurde erfolgreich geändert.");

            //         }, () => {
            //             w2alert('Fehler beim Ändern des Passworts!');
            //         });


            //     });

            // jQuery('#w2prompt').attr("type", "password");
        }

    }

    onAddTeacher() {
        let schoolId = this.administration.userData.schule_id;

        let request: CRUDUserRequest = {
            type: "create",
            data: {
                id: -1,
                schule_id: schoolId,
                klasse_id: null,
                username: "Benutzername" + Math.round(Math.random() * 10000000),
                rufname: "Rufname",
                familienname: "Familienname",
                is_admin: false,
                is_schooladmin: false,
                is_teacher: true,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            let ud: UserData = request.data;
            ud.id = response.id;

            let teacherData = {
                userData: ud,
                classes: [],
                username: ud.username,
                familienname: ud.familienname,
                rufname: ud.rufname,
                id: ud.id,
                text: ud.rufname + " " + ud.familienname
            };

            this.teachersGrid.add(teacherData);
            this.teachersGrid.editField(ud.id + "", 1, undefined, { keyCode: 13 });
            this.teacherDataList.push(teacherData);

            this.selectTextInCell();

            this.initializePasswordButtons();

        });
    }

    // lastRecId: number = -1;

    onSelectTeacher(event: any) {

        // if (event.recid == this.lastRecId) {
        //     return;
        // }

        // this.lastRecId = event.recid;

        event.done(() => {
            let recIds: number[];

            //@ts-ignore
            recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

            if (recIds.length == 1) {
                //@ts-ignore
                this.teachersGrid.toolbar.enable('passwordButton');
            } else {
                //@ts-ignore
                this.teachersGrid.toolbar.disable('passwordButton');
            }

            let selectedTeachers: TeacherData[] = <TeacherData[]>this.teacherDataList.filter(
                (cd: TeacherData) => recIds.indexOf(cd.userData.id) >= 0);


            let classesList: ClassData[] = [];

            for (let sc of selectedTeachers) {
                for (let sd of sc.classes) {
                    sd["teacher"] = sc.userData.rufname + " " + sc.userData.familienname;
                    classesList.push(sd);
                }
            }


            setTimeout(() => {
                this.classesGrid.clear();
                this.classesGrid.add(classesList);
                this.classesGrid.refresh();
            }, 5);
        });

    }

    loadTablesFromTeacherObject() {

        let request: GetTeacherDataRequest = { school_id: this.administration.userData.schule_id };

        ajax("getTeacherData", request, (data: GetTeacherDataResponse) => {
            this.teacherDataList = data.teacherData;

            this.teachersGrid.clear();

            for (let teacher of this.teacherDataList) {
                teacher["id"] = teacher.userData.id;
                teacher["username"] = teacher.userData.username;
                teacher["familienname"] = teacher.userData.familienname;
                teacher["rufname"] = teacher.userData.rufname;
                teacher["text"] = teacher.userData.rufname + " " + teacher.userData.familienname
            }

            this.teachersGrid.add(this.teacherDataList);

            this.teachersGrid.refresh();

            if (this.classesGrid != null) {
                this.classesGrid.columns[2]["editable"].items = this.teacherDataList;
                this.classesGrid.clear();
            }


        }, () => {
            w2alert('Fehler beim Holen der Daten.');
        });


    }

    onDeleteTeacher(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];


        //@ts-ignore
        recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        let selectedteachers: TeacherData[] = <TeacherData[]>this.teachersGrid.records.filter(
            (cd: TeacherData) => recIds.indexOf(cd.userData.id) >= 0 && this.administration.userData.id != cd.userData.id);

        let request: CRUDUserRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            recIds.forEach(id => this.teachersGrid.remove("" + id));
            for (let i = 0; i < this.teacherDataList.length; i++) {
                if (recIds.indexOf(this.teacherDataList[i].userData.id) >= 0) {
                    this.teacherDataList.splice(i, 1);
                    i--;
                }
            }
            this.teachersGrid.refresh();
            this.classesGrid.clear();
        }, () => {
            this.teachersGrid.refresh();
        });

    }

    onUpdateTeacher(event: any) {

        let data: TeacherData = <TeacherData>this.teachersGrid.records[event.index];

        data.userData[this.teachersGrid.columns[event.column]["field"]] = event.value_new;
        data[this.teachersGrid.columns[event.column]["field"]] = event.value_new;

        data.userData.password = null;

        let request: CRUDUserRequest = {
            type: "update",
            data: data.userData,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            // console.log(data);
            for (let key in data["w2ui"]["changes"]) {
                delete data["w2ui"]["changes"][key];
            }
        }, () => {
            data.userData[this.teachersGrid.columns[event.column]["field"]] = event.value_original;
            data[this.teachersGrid.columns[event.column]["field"]] = event.value_original;
        });

    }

    onAddClass() {

        let selectedTeachers = <number[]>this.teachersGrid.getSelection().map((d: { recid: number }) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selectedTeachers.length != 1) {
            this.classesGrid.error("Wenn Sie Klassen hinzufügen möchten muss links genau eine Lehrkraft ausgewählt sein.");
            return;
        }
        let teacherId = selectedTeachers[0];
        let teacherData = <TeacherData>this.teachersGrid.get("" + teacherId, false);

        let request: CRUDClassRequest = {
            type: "create",
            data: {
                id: -1,
                name: "Name",
                lehrkraft_id: teacherId,
                schule_id: teacherData.userData.schule_id,
                students: []
            },
        };

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            let cd: ClassData = request.data;
            cd.id = response.id;
            cd["teacher"] = teacherData.userData.rufname + " " + teacherData.userData.familienname;
            this.classesGrid.add(cd);
            this.classesGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            teacherData.classes.push(cd);

            this.selectTextInCell();
        });
    }

    onDeleteClass(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];


        //@ts-ignore
        recIds = <any>this.classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        let selectedClasss: ClassData[] = <ClassData[]>this.classesGrid.records.filter(
            (cd: ClassData) => recIds.indexOf(cd.id) >= 0);


        let request: CRUDClassRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            recIds.forEach(id => {
                let cd: ClassData = <ClassData>this.classesGrid.get(id + "");
                this.classesGrid.remove("" + id)
                let ld: TeacherData = <TeacherData>this.teachersGrid.get(cd.lehrkraft_id + "");
                if (ld != null) {
                    ld.classes = ld.classes.filter((cl) => cl.id != cd.id);
                }
            });
            this.classesGrid.refresh();
        }, () => {
            this.classesGrid.refresh();
        });

    }

    onUpdateClass(event: any) {

        let data: ClassData = <ClassData>this.classesGrid.records[event.index];

        if (event.column == 2) {
            let teacher: TeacherData = event.value_new;
            if (teacher == null || typeof teacher == "string") {
                this.classesGrid.refresh();
                return;
            } else {
                let teacherOld1 = this.teacherDataList.find((td) => td.userData.id == data.lehrkraft_id);
                if (teacherOld1 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                let teacherOld2 = this.teachersGrid.get(data.lehrkraft_id + "");
                if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.lehrkraft_id = teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2: TeacherData = <any>this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null) teacherNew2.classes.push(data);
                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }

        data[this.classesGrid.columns[event.column]["field"]] = event.value_new;

        let request: CRUDClassRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            // console.log(data);
            if (event.column != 2) delete data["w2ui"]["changes"];
            this.classesGrid.refresh();
        }, () => {
            data[this.classesGrid.columns[event.column]["field"]] = event.value_original;
            this.classesGrid.refresh();
        });
    }


}