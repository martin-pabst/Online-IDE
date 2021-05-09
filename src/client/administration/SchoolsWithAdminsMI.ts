import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";

declare var w2prompt: any;
declare var w2alert: any;

export class SchoolsWithAdminsMI extends AdminMenuItem {

    schoolGridName = "schoolsGrid";
    adminGridName = "adminsGrid";

    schoolGrid: W2UI.W2Grid;
    adminGrid: W2UI.W2Grid;

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

        if (this.schoolGrid != null) {
            this.schoolGrid.render();
        } else {
            $tableLeft.w2grid({
                name: this.schoolGridName,
                header: 'Schulen',
                selectType: "cell",
                multiSelect: false,
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true,
                    toolbarSearch: false
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'kuerzel', caption: 'Kürzel', size: '10%', sortable: true, resizable: true, editable: { type: 'text', maxlength: "10" } },
                    { field: 'numberOfClasses', caption: 'Klassen', size: '30%', sortable: true, resizable: true },
                    { field: 'numberOfUsers', caption: 'User', size: '30%', sortable: true, resizable: true },
                ],
                searches: [
                    { field: 'name', label: 'Bezeichnung', type: 'text' }
                ],
                sortData: [{ field: 'name', direction: 'asc' }, {field: 'kuerzel', direction: 'asc'}, 
                           {field: 'numberOfClasses', direction: 'asc'}, {field: 'numberOfUsers', direction: 'asc'}],
                onSelect: (event) => { that.onSelectSchool(event) },
                onUnselect: (event) => { that.onSelectSchool(event) },
                onAdd: (event) => { that.onAddSchool() },
                onChange: (event) => { that.onUpdateSchool(event) },
                onDelete: (event) => { that.onDeleteSchool(event) },
            })

            this.schoolGrid = w2ui[this.schoolGridName];

        }


        this.loadTablesFromSchoolObject();

        if (this.adminGrid != null) {
            this.adminGrid.render();
        } else {
            $tableRight.w2grid({
                name: this.adminGridName,
                header: 'Schuladmins',
                selectType: "cell",
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
                sortData: [{ field: 'klasse', direction: 'asc' }, { field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
                onAdd: (event) => { that.onAddAdmin() },
                onChange: (event) => { that.onUpdateAdmin(event) },
                onDelete: (event) => { that.onDeleteAdmin(event) },
                onSelect: (event) => { event.done(() => { that.onSelectAdmin(event) }) },
                onUnselect: (event) => { event.done(() => { that.onSelectAdmin(event) }) },

            });

            this.adminGrid = w2ui[this.adminGridName];

        }

    }

    onSelectAdmin(event: any) {

        let adminGrid = w2ui[this.adminGridName];

        let selection = adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        if (selection.length == 1) {
            //@ts-ignore
            adminGrid.toolbar.enable('passwordButton');
        } else {
            //@ts-ignore
            adminGrid.toolbar.disable('passwordButton');
        }

    }



    changePassword(recIds: number[] = []) {
        let that = this;

        if (recIds.length == 0) {
            //@ts-ignore
            recIds = <any>this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }

        if (recIds.length != 1) {
            this.adminGrid.error("Zum Ändern eines Passworts muss genau ein Admin ausgewählt werden.");
        } else {
            let admin: UserData = <UserData>this.adminGrid.get(recIds[0] + "", false);

            let passwordFor: string = admin.rufname + " " + admin.familienname + " (" + admin.username + ")";

            PasswordPopup.open(passwordFor, () => {

            }, (password) => {
                admin.password = password;

                let request: CRUDUserRequest = {
                    type: "update",
                    data: admin,
                }
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

                ajax("CRUDUser", request, (response: CRUDResponse) => {

                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + admin.rufname + " " + admin.familienname + " (" + admin.username + ") wurde erfolgreich geändert.");

                }, () => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                });
            });

        }

    }

    onDeleteSchool(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];


        //@ts-ignore
        recIds = <any>this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        let selectedSchools: SchoolData[] = <SchoolData[]>this.schoolGrid.records.filter(
            (cd: SchoolData) => recIds.indexOf(cd.id) >= 0);


        let request: CRUDSchoolRequest = {
            type: "delete",
            data: null,
            id: recIds[0],
        }

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            recIds.forEach(id => this.schoolGrid.remove("" + id));
            this.schoolGrid.refresh();
        }, () => {
            this.schoolGrid.refresh();
        });

    }

    onUpdateSchool(event: any) {

        let data: SchoolData = <SchoolData>this.schoolGrid.records[event.index];

        data[this.schoolGrid.columns[event.column]["field"]] = event.value_new;

        let request: CRUDSchoolRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            // console.log(data);
            delete data["w2ui"]["changes"];
            this.schoolGrid.refresh();
        }, () => {
            data[this.schoolGrid.columns[event.column]["field"]] = event.value_original;
            this.schoolGrid.refresh();
        });
    }

    onAddSchool() {
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
            this.schoolGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });

            this.selectTextInCell();
        });
    }

    onSelectSchool(event: any) {

        let that = this;

        event.done(() => {
            let recIds: number[];


            //@ts-ignore
            recIds = <any>this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

            let selectedSchools: SchoolData[] = <SchoolData[]>this.schoolGrid.records.filter(
                (cd: SchoolData) => recIds.indexOf(cd.id) >= 0);


            this.adminGrid.clear();

            let adminList: UserData[] = [];

            for (let sc of selectedSchools) {
                this.adminGrid.header = "Admins der Schule " + sc.name;
                for (let sd of sc.usersWithoutClass) {
                    if (sd.is_schooladmin) adminList.push(sd);
                }
            }


            setTimeout(() => {
                this.adminGrid.add(adminList);
                this.adminGrid.refresh();
                this.onSelectAdmin(null);
                this.initializePasswordButtons();
            }, 20);


        });

    }

    initializePasswordButtons(){
        let that = this;
        setTimeout(() => {
            jQuery('.pw_button').off('click');
            jQuery('.pw_button').on('click', (e) => {
                let recid = jQuery(e.target).data('recid');
                e.preventDefault();
                e.stopPropagation();
                that.changePassword([recid]);
            });
        }, 1500);

    }

    loadTablesFromSchoolObject() {

        let userData = this.administration.userData;
        let school_id = userData.schule_id;
        if (userData.is_admin) school_id = null;

        let request: GetSchoolDataRequest = { school_id: school_id };

        ajax("getSchoolData", request, (data: GetSchoolDataResponse) => {
            this.schoolDataList = data.schoolData;
            this.schoolGrid.clear();
            if (this.adminGrid != null) this.adminGrid.clear();

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

    onDeleteAdmin(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];


        //@ts-ignore
        recIds = <any>this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        let selectedadmins: UserData[] = <UserData[]>this.adminGrid.records.filter(
            (cd: UserData) => recIds.indexOf(cd.id) >= 0 && this.administration.userData.id != cd.id);

        let request: CRUDUserRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            recIds.forEach(id => this.adminGrid.remove("" + id));
            for (let school of this.schoolDataList) {
                for (let i = 0; i < school.usersWithoutClass.length; i++) {
                    if (recIds.indexOf(school.usersWithoutClass[i].id) >= 0) {
                        school.usersWithoutClass.splice(i, 1);
                        i--;
                        school["numberOfUsers"] -= 1;
                    }
                }
            }
            this.adminGrid.refresh();
            this.schoolGrid.refresh();
        }, () => {
            this.adminGrid.refresh();
        });

    }

    onUpdateAdmin(event: any) {

        let data: UserData = <UserData>this.adminGrid.records[event.index];

        data[this.adminGrid.columns[event.column]["field"]] = event.value_new;

        let request: CRUDUserRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            // console.log(data);
            for (let key in data["w2ui"]["changes"]) {
                delete data["w2ui"]["changes"][key];
            }
            // //@ts-ignore
            // this.adminGrid.last.inEditMode = false;
        }, () => {
            data[this.adminGrid.columns[event.column]["field"]] = event.value_original;
            // this.adminGrid.refresh();
        });

    }

    onAddAdmin() {

        let selectedSchools = <number[]>this.schoolGrid.getSelection().map((d: { recid: number }) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selectedSchools.length != 1) {
            this.adminGrid.error("Wenn Sie Admins hinzufügen möchten muss links genau eine Schule ausgewählt sein.");
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
                is_schooladmin: true,
                is_teacher: true,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            let ud: UserData = request.data;
            ud.id = response.id;
            this.adminGrid.add(ud);
            this.adminGrid.editField(ud.id + "", 1, undefined, { keyCode: 13 });
            school.usersWithoutClass.push(ud);

            this.selectTextInCell();
            this.initializePasswordButtons();
        });
    }


}