import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
import { MoveTeacherToSchoolPopup } from "./MoveTeacherToSchoolPopup.js";
import { w2grid, w2utils } from "../lib/w2ui-2.0.es6.js";

declare var w2prompt: any;
declare var w2alert: any;

export class SchoolsWithAdminsMI extends AdminMenuItem {
    destroy() {
        this.schoolGrid.destroy();
        this.teacherGrid.destroy();
    }

    schoolGrid: w2grid;
    teacherGrid: w2grid;

    schoolDataList: SchoolData[] = [];

    checkPermission(user: UserData): boolean {
        return user.is_admin;
    }

    getButtonIdentifier(): string {
        return "Schulen mit Administratoren";
    }

    onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {
        let that = this;

        this.schoolGrid = new w2grid({
            name: "schoolgrid",
            header: 'Schulen',
            // selectType: "cell",
            multiSelect: false,
            show: {
                header: true,
                toolbar: true,
                toolbarAdd: true,
                toolbarDelete: true,
                footer: true,
                selectColumn: true,
                toolbarSearch: true
            },
            defaultOperator: {
                'text'    : 'contains',
                'number'  : '=',
                'date'    : 'is',
                'list'    : 'is',
                'enum'    : 'in',
                'hex'     : 'begins',
                'color'   : 'begins'
            },
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'name', text: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'kuerzel', text: 'Kürzel', size: '10%', sortable: true, resizable: true, editable: { type: 'text', maxlength: "10" } },
                { field: 'numberOfClasses', text: 'Klassen', size: '30%', sortable: true, resizable: true },
                { field: 'numberOfUsers', text: 'User', size: '30%', sortable: true, resizable: true },
            ],
            searches: [
                { field: 'name', label: 'Bezeichnung', type: 'text' }
            ],
            sortData: [{ field: 'name', direction: 'asc' }, { field: 'kuerzel', direction: 'asc' },
            { field: 'numberOfClasses', direction: 'asc' }, { field: 'numberOfUsers', direction: 'asc' }],
            onSelect: (event) => {
                // event.done(() => {
                    setTimeout(() => {
                        that.onSelectSchool();
                    }, 100);
                // });
            },
            onUnselect: (event) => { that.onUnSelectSchool(event) },
            onAdd: (event) => { that.onAddSchool(event) },
            onChange: (event) => { that.onUpdateSchool(event) },
            onDelete: (event) => { that.onDeleteSchool(event) },
        })

        this.schoolGrid.render($tableLeft[0]);

        this.loadTablesFromSchoolObject();

        this.teacherGrid = new w2grid({
            name: "teachergrid",
            header: 'Lehrkräfte',
            // selectType: "cell",
            show: {
                header: true,
                toolbar: true,
                toolbarAdd: true,
                toolbarDelete: true,
                footer: true,
                selectColumn: true,
                toolbarSearch: false,
                toolbarInput: false
            },
            toolbar: {
                items: [
                    { type: 'break' },
                    { type: 'button', id: 'passwordButton', text: 'Passwort ändern...' }, //, img: 'fa-key' }
                    { type: 'button', id: 'moveTeacherButton', text: 'Versetzen in Schule...' } //, img: 'fa-key' }
                ],
                onClick: function (target, data) {
                    switch (target) {
                        case "passwordButton":
                            that.changePassword();
                            break;
                        case "moveTeacherButton":
                            that.moveTeacherToOtherSchool();
                            break;
                    }
                }
            },
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'username', text: 'Benutzername', size: '30%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'rufname', text: 'Rufname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'familienname', text: 'Familienname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'is_schooladmin', text: 'Admin', size: '10%', sortable: true, resizable: false, editable: { type: 'checkbox', style: 'text-align: center' } },
                {
                    field: 'id', text: 'PW', size: '40px', sortable: false, render: (e) => {
                        return '<div class="pw_button" title="Passwort ändern" data-recid="' + e.recid + '" style="visibility: hidden">PW!</div>';
                    }
                }
            ],
            searches: [
                { field: 'username', label: 'Benutzername', type: 'text' },
                { field: 'rufname', label: 'Rufname', type: 'text' },
                { field: 'familienname', label: 'Familienname', type: 'text' }
            ],
            sortData: [{ field: 'klasse', direction: 'asc' }, { field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
            onAdd: (event) => { that.onAddTeacher() },
            onChange: (event) => { that.onUpdateTeacher(event) },
            onDelete: (event) => { that.onDeleteTeacher(event) },
            onSelect: (event) => { event.done(() => { that.onSelectTeacher(event) }) },
            onUnselect: (event) => { event.done(() => { that.onSelectTeacher(event) }) },

        });

        this.teacherGrid.render($tableRight[0]);

    }

    onSelectTeacher(event: any) {
        // let selection = adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        if (event != null && this.teacherGrid.getSelection().length == 1) {
            //@ts-ignore
            this.teacherGrid.toolbar.enable('passwordButton');
        } else {
            //@ts-ignore
            this.teacherGrid.toolbar.disable('passwordButton');
        }

    }


    moveTeacherToOtherSchool() {
        let recIds = <number[]>this.teacherGrid.getSelection();
        if (recIds.length != 1) {
            this.teacherGrid.error("Zum Verschieben in eine andere Schule muss genau eine Lehrkraft ausgewählt werden.");
        } else {
            let teacher: UserData = <UserData>this.teacherGrid.get(recIds[0] + "", false);
            let oldSchool = this.schoolDataList.find(sd => sd.id == teacher.schule_id);
            MoveTeacherToSchoolPopup.open(`${teacher.rufname} ${teacher.familienname} (${teacher.username})`,
                oldSchool, <SchoolData[]>this.schoolGrid.records, () => {
                    // on cancel...
                }, (newSchool: SchoolData) => {

                    newSchool = this.schoolDataList.find(s => s.id == newSchool.id);

                    if (teacher.schule_id == newSchool.id) {
                        alert("Die gewählte Schule stimmt mit der bisherigen Schule überein, es wird daher nichts verändert.");
                        return;
                    }

                    teacher.schule_id = newSchool.id;

                    let request: CRUDUserRequest = {
                        type: "update",
                        data: teacher,
                    }

                    ajax("CRUDUser", request, (response: CRUDResponse) => {
                        newSchool.usersWithoutClass.push(teacher);
                        oldSchool.usersWithoutClass.splice(oldSchool.usersWithoutClass.indexOf(teacher), 1);
                        this.onSelectSchool();
                    }, (error) => {
                        w2alert('Fehler beim Versetzen der Lehrkraft: ' + error);
                    });

                }
            )
        }
    }

    changePassword(recIds: number[] = []) {

        if (recIds.length == 0) {
            recIds = <number[]>this.teacherGrid.getSelection();
            //@ts-ignore
            // recIds = <any>this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
            let teacher: UserData = <UserData>this.teacherGrid.get(recIds[0] + "", false);

            let passwordFor: string = teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ")";
        }

        if (recIds.length != 1) {
            this.teacherGrid.error("Zum Ändern eines Passworts muss genau ein Admin ausgewählt werden.");
        } else {
            let admin: UserData = <UserData>this.teacherGrid.get(recIds[0] + "", false);

            let passwordFor: string = admin.rufname + " " + admin.familienname + " (" + admin.username + ")";

            PasswordPopup.open(passwordFor, () => {

            }, (password) => {
                admin.password = password;

                let request: CRUDUserRequest = {
                    type: "update",
                    data: admin,
                }
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

                ajax("CRUDUser", request, (response: CRUDResponse) => {

                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + admin.rufname + " " + admin.familienname + " (" + admin.username + ") wurde erfolgreich geändert.");

                }, () => {
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                });
            });

        }

    }

    onDeleteSchool(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[] = <number[]>this.schoolGrid.getSelection();


        //@ts-ignore
        // recIds = <any>this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        // let selectedSchools: SchoolData[] = <SchoolData[]>this.schoolGrid.records.filter(
        //     (cd: SchoolData) => recIds.indexOf(cd.id) >= 0);


        let request: CRUDSchoolRequest = {
            type: "delete",
            data: null,
            id: recIds[0],
        }

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            this.schoolGrid.remove("" + recIds[0]);
            this.schoolGrid.refresh();
        }, () => {
            this.schoolGrid.refresh();
        });

    }

    onUpdateSchool(event: any) {

        let data: SchoolData = <SchoolData>this.schoolGrid.records[event.detail.index];
        let field = this.schoolGrid.columns[event.detail.column]["field"];
        data[field] = event.detail.value.new;

        let request: CRUDSchoolRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            // console.log(data);
            delete data["w2ui"]["changes"];
            this.schoolGrid.refreshCell(data["recid"], field);
        }, () => {
            data[field] = event.detail.value.original;
            this.schoolGrid.refresh();
        });
    }

    onAddSchool(event) {
        let request: CRUDSchoolRequest = {
            type: "create",
            data: {
                id: -1,
                name: "Name der Schule",
                kuerzel: "kuerzel",
                classes: [],
                usersWithoutClass: []
            },
        };

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            let cd: SchoolData = request.data;
            cd.id = response.id;
            this.schoolGrid.add(cd);
            this.schoolGrid.refresh();
            setTimeout(() => {                
                let index = this.schoolGrid.records.findIndex(r => r["id"] == cd.id);
                //@ts-ignore
                this.schoolGrid.scrollIntoView(index, undefined, true);
                //@ts-ignore
                this.schoolGrid.editField(cd.id, 1, undefined, { keyCode: 13 });
            }, 1000);

            // this.selectTextInCell();
        });
    }

    onSelectSchool() {

        let recIds: number[] = <number[]>this.schoolGrid.getSelection();
        if (recIds.length == 0) {
            return;
        }

        jQuery('#jo_exportschools a').attr('href', 'servlet/exportSchools?ids=' + recIds.join(','));

        // event.done(() => {

        // old: for selecttype = "cell"
        //@ts-ignore
        // recIds = <any>this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);


        let selectedSchools: SchoolData[] = <SchoolData[]>this.schoolGrid.records.filter(
            (cd: SchoolData) => recIds.indexOf(cd.id) >= 0);

        let adminList: UserData[] = [];

        for (let sc of selectedSchools) {
            this.teacherGrid.header = "Lehrkräfte der Schule " + sc.name;
            for (let sd of sc.usersWithoutClass) {
                if (sd.is_teacher) adminList.push(sd);
            }
        }

        // setTimeout(() => {
        this.teacherGrid.clear();
        this.teacherGrid.add(adminList);
        this.teacherGrid.refresh();
        this.onSelectTeacher(null);           // to disable "change password"-Button
        this.initializePasswordButtons();
        // }, 20);


        // });

    }

    onUnSelectSchool(event) {
        this.teacherGrid.clear();
    }

    initializePasswordButtons() {
        let that = this;
        setTimeout(() => {
            jQuery('.pw_button').off('click');
            jQuery('.pw_button').on('click', (e) => {
                let recid = jQuery(e.target).data('recid');
                e.preventDefault();
                e.stopPropagation();
                that.changePassword([recid]);
            }).css('visibility', 'visible');
        }, 1000);

    }

    loadTablesFromSchoolObject() {

        let userData = this.administration.userData;
        let school_id = userData.schule_id;
        if (userData.is_admin) school_id = null;

        let request: GetSchoolDataRequest = { school_id: school_id };

        ajax("getSchoolData", request, (data: GetSchoolDataResponse) => {
            this.schoolDataList = data.schoolData;
            this.schoolGrid.clear();
            if (this.teacherGrid != null) this.teacherGrid.clear();

            for (let school of this.schoolDataList) {
                school["numberOfClasses"] = school.classes.length;
                let n = 0;
                school.classes.forEach(c => n += c.students.length);
                n += school.usersWithoutClass.length;
                school["numberOfUsers"] = n;
            }

            this.schoolGrid.add(this.schoolDataList);

            this.schoolGrid.refresh();
        }, (error) => {
            w2alert('Fehler beim Holen der Daten: ' + error);
            debugger;
        });


    }

    onDeleteTeacher(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[] = <number[]>this.teacherGrid.getSelection();


        //@ts-ignore
        // recIds = <any>this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        let selectedadmins: UserData[] = <UserData[]>this.teacherGrid.records.filter(
            (cd: UserData) => recIds.indexOf(cd.id) >= 0 && this.administration.userData.id != cd.id);

        let request: CRUDUserRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            recIds.forEach(id => this.teacherGrid.remove("" + id));
            for (let school of this.schoolDataList) {
                for (let i = 0; i < school.usersWithoutClass.length; i++) {
                    if (recIds.indexOf(school.usersWithoutClass[i].id) >= 0) {
                        school.usersWithoutClass.splice(i, 1);
                        i--;
                        school["numberOfUsers"] -= 1;
                    }
                }
            }
            this.teacherGrid.refresh();
            this.schoolGrid.refresh();
        }, () => {
            this.teacherGrid.refresh();
        });

    }

    onUpdateTeacher(event: any) {

        let data: UserData = <UserData>this.teacherGrid.records[event.detail.index];
        let field: string = this.teacherGrid.columns[event.detail.column]["field"];
        data[field] = event.detail.value.new;

        let request: CRUDUserRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            // console.log(data);
            for (let key in data["w2ui"]["changes"]) {
                delete data["w2ui"]["changes"][key];
            }
            data["w2ui"]["changes"] = null;
            this.teacherGrid.refreshCell(data["recid"], field)
            // //@ts-ignore
            // this.adminGrid.last.inEditMode = false;
        }, () => {
            data[field] = event.detail.value.original;
            // this.adminGrid.refresh();
        });

    }

    onAddTeacher() {

        let selectedSchools = <number[]>this.schoolGrid.getSelection();
        // let selectedSchools = <number[]>this.schoolGrid.getSelection().map((d: { recid: number }) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selectedSchools.length != 1) {
            this.teacherGrid.error("Wenn Sie Lehrkräfte hinzufügen möchten muss links genau eine Schule ausgewählt sein.");
            return;
        }
        let schoolId = selectedSchools[0];
        let school = <SchoolData>this.schoolGrid.get("" + schoolId, false);

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
            this.teacherGrid.add(ud);
            this.teacherGrid.editField(ud.id + "", 1, undefined, { keyCode: 13 });
            school.usersWithoutClass.push(ud);

            this.initializePasswordButtons();
        });
    }


}