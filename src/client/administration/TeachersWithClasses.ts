import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse, TeacherData, ClassData, CRUDClassRequest, GetTeacherDataRequest, GetTeacherDataResponse } from "../communication/Data.js";
import { ajax, ajaxAsync } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
import { SelectTeacherPopup } from "./SelectTeacherPopup.js";
import { w2alert, w2grid, w2utils } from "../lib/w2ui-2.0.es6.js";


export class TeachersWithClassesMI extends AdminMenuItem {

    destroy() {
        this.classesGrid.destroy();
        this.teachersGrid.destroy();
        this.classesWithoutTeachersGrid.destroy();
        this.$tableRight.removeClass('jo_twc_right');
    }

    classesGrid: w2grid;
    teachersGrid: w2grid;
    classesWithoutTeachersGrid: w2grid;

    teacherData: TeacherData[] = [];
    classesWithoutTeacher: ClassData[];

    $tableRight: JQuery<HTMLElement>;

    checkPermission(user: UserData): boolean {
        return user.is_schooladmin;
    }

    getButtonIdentifier(): string {
        return "Lehrkräfte mit Klassen";
    }

    async onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {

        let that = this;
        this.$tableRight = $tableRight;

        this.teachersGrid = new w2grid({
            name: "teachersGrid",
            header: 'Lehrkräfte',
            // selectType: "cell",
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
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'username', text: 'Benutzername', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                { field: 'rufname', text: 'Rufname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                { field: 'familienname', text: 'Familienname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                {
                    field: 'numberOfClasses', text: 'Klassen', size: '30%', sortable: true, resizable: true,
                    render: function (record: TeacherData) {
                        return '<div>' + record.classes.length + '</div>';
                    }
                },
                {
                    field: 'id', text: 'PW', size: '40px', sortable: false, render: (e) => {
                        return '<div class="pw_button" title="Passwort ändern" style="visibility: hidden" data-recid="' + e.recid + '">PW!</div>';
                    }
                }
            ],
            searches: [
                { field: 'username', label: 'Benutzername', type: 'text' },
                { field: 'rufname', label: 'Rufname', type: 'text' },
                { field: 'familienname', label: 'Familienname', type: 'text' }
            ],
            sortData: [{ field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
            onSelect: (event) => { event.done(()=>{that.onSelectTeacher()}) },
            // onUnselect: (event) => { that.onUnSelectTeacher(event) },
            onAdd: (event) => { that.onAddTeacher() },
            onChange: (event) => { that.onUpdateTeacher(event) },
            onDelete: (event) => { that.onDeleteTeacher(event) },
        })

        this.teachersGrid.render($tableLeft[0]);

        await this.loadTablesFromTeacherObject();

        this.initializePasswordButtons();

        let $topRight = jQuery('<div class="jo_twc_topRight"></div>');
        let $bottomRight = jQuery('<div class="jo_twc_bottomRight"></div>');

        $tableRight.addClass('jo_twc_right');
        $tableRight.append($topRight, $bottomRight);

        this.classesGrid = new w2grid({
            name: "classesGrid",
            header: 'Klassen',
            // selectType: "cell",
            multiSelect: true,
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
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'name', text: 'Name', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                {
                    field: 'teacher', text: 'Lehrkraft', size: '30%', sortable: true, resizable: true,
                    editable: { type: 'list', items: that.teacherData, showAll: true, openOnFocus: true }
                },
                {
                    field: 'teacher2', text: 'Zweitlehrkraft', size: '30%', sortable: true, resizable: true,
                    render: function (record: ClassData) {
                        let teacher = that.teacherData.find(td => td.userData.id == record.zweitlehrkraft_id);
                        if (teacher != null) {
                            return '<div>' + teacher.userData.rufname + " " + teacher.userData.familienname + '</div>';
                        }
                    },
                    editable: {
                        type: 'list', items: that.teacherData.slice(0).concat([{
                            //@ts-ignore
                            userData: { id: -1, rufname: "Keine Zweitlehrkraft", familienname: "" },
                            classes: [],
                            id: -1,
                            text: "Keine Zweitlehrkraft"
                        }]), showAll: true, openOnFocus: true
                    }
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

        this.classesGrid.render($topRight[0]);

        this.classesWithoutTeachersGrid = new w2grid({
            name: "classesWithoutTeacher",
            header: 'Klassen ohne Lehrkräfte',
            // selectType: "cell",
            multiSelect: true,
            show: {
                header: true,
                toolbar: true,
                toolbarDelete: true,
                footer: true,
                selectColumn: true
            },
            toolbar: {
                items: [
                    { type: 'break' },
                    { type: 'button', id: 'setTeacherButton', text: 'Lehrkraft zuordnen...' }
                ],
                onClick: function (target, data) {
                    switch (target) {
                        case "setTeacherButton":
                            that.setTeacher();
                            break;
                    }
                }
            },
            recid: "id",
            columns: [
                { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'name', caption: 'Name', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } }
            ],
            searches: [
                { field: 'name', label: 'Name', type: 'text' },
            ],
            sortData: [{ field: 'name', direction: 'asc' }],
            onChange: (event) => { that.onUpdateClassWithoutTeacher(event) },
            onDelete: (event) => { that.onDeleteClassWithoutTeacher(event) },
        });

        this.classesWithoutTeachersGrid.render($bottomRight[0]);

        this.fillClassesWithoutTeacherGrid();


    }

    setTeacher() {
        let recIds = <number[]>this.classesWithoutTeachersGrid.getSelection();
        if (recIds.length != 1) {
            this.classesWithoutTeachersGrid.error("Es muss genau eine Klasse ausgewählt werden.");
        } else {
            let klass: ClassData = <ClassData>this.classesWithoutTeachersGrid.get(recIds[0] + "", false);
            SelectTeacherPopup.open(klass.name,
                this.teacherData, () => {
                    // on cancel...
                }, (teacher: TeacherData) => {

                    klass.lehrkraft_id = teacher.userData.id;

                    let request: CRUDClassRequest = {
                        type: "update",
                        data: klass,
                    }

                    ajax("CRUDClass", request, (response: CRUDResponse) => {
                        this.classesWithoutTeacher.splice(this.classesWithoutTeacher.indexOf(klass), 1);
                        teacher = (<TeacherData[]>this.teacherData).find(t => t.userData.id == teacher.userData.id);
                        teacher.classes.push(klass);
                        this.onSelectTeacher();
                        this.fillClassesWithoutTeacherGrid();
                    }, (error) => {
                        w2alert('Fehler beim Zuordnen der Lehrkraft: ' + error);
                    });

                }
            )
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
            }).css('visibility', 'visible');
        }, 1000);

    }

    changePassword(recIds: number[] = []) {

        if (recIds.length == 0) {
            recIds = <number[]>this.teachersGrid.getSelection();
            //@ts-ignore
            //recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
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
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

                ajax("CRUDUser", request, (response: CRUDResponse) => {

                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ") wurde erfolgreich geändert.");
                }, () => {
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                });
            });

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
            this.teacherData.push(teacherData);

            this.initializePasswordButtons();

        });
    }

    onUnSelectTeacher(event) {
        this.classesGrid.clear();
    }

    onSelectTeacher() {

        let recIds: number[] = <number[]>this.teachersGrid.getSelection();

        if (recIds.length != 1) return;

        // //@ts-ignore
        // recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        if (recIds.length == 1) {
            //@ts-ignore
            this.teachersGrid.toolbar.enable('passwordButton');
        } else {
            //@ts-ignore
            this.teachersGrid.toolbar.disable('passwordButton');
        }

        let selectedTeachers: TeacherData[] = <TeacherData[]>this.teacherData.filter(
            (cd: TeacherData) => recIds.indexOf(cd.userData.id) >= 0);


        let classesList: ClassData[] = [];

        for (let sc of selectedTeachers) {
            for (let sd of sc.classes) {
                sd["teacher"] = sc.userData.rufname + " " + sc.userData.familienname;
                let teacher2 = this.teacherData.find(td => td.userData.id == sd.zweitlehrkraft_id);
                if (teacher2 != null) {
                    sd["teacher2"] = sc.userData.rufname + " " + sc.userData.familienname;
                }
                classesList.push(sd);
            }
        }


        this.classesGrid.clear();
        this.classesGrid.add(classesList);
        this.classesGrid.refresh();

    }

    fillClassesWithoutTeacherGrid() {

        this.classesWithoutTeacher.forEach(c => c.text = c.name);

        this.classesWithoutTeachersGrid.clear();
        this.classesWithoutTeachersGrid.add(this.classesWithoutTeacher);
        this.classesWithoutTeachersGrid.refresh();
    }

    async loadTablesFromTeacherObject() {

        let request: GetTeacherDataRequest = { school_id: this.administration.userData.schule_id };

        let data: GetTeacherDataResponse = await ajaxAsync("/servlet/getTeacherData", request);

        this.teacherData = data.teacherData;
        this.classesWithoutTeacher = data.classesWithoutTeacher;

        this.teachersGrid.clear();

        for (let teacher of this.teacherData) {
            teacher["id"] = teacher.userData.id;
            teacher["username"] = teacher.userData.username;
            teacher["familienname"] = teacher.userData.familienname;
            teacher["rufname"] = teacher.userData.rufname;
            teacher["text"] = teacher.userData.rufname + " " + teacher.userData.familienname
        }

        this.teachersGrid.add(this.teacherData);

        this.teachersGrid.refresh();

        if (this.classesGrid != null) {
            this.classesGrid.columns[2]["editable"].items = this.teacherData;
            this.classesGrid.columns[3]["editable"].items = this.teacherData;
            this.classesGrid.clear();
        }


    }

    onDeleteTeacher(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[];

        recIds = <number[]>this.teachersGrid.getSelection();

        //@ts-ignore
        // recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        // let selectedteachers: TeacherData[] = <TeacherData[]>this.teachersGrid.records.filter(
        //     (cd: TeacherData) => recIds.indexOf(cd.userData.id) >= 0 && this.administration.userData.id != cd.userData.id);

        let request: CRUDUserRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            recIds.forEach(id => this.teachersGrid.remove("" + id));
            for (let i = 0; i < this.teacherData.length; i++) {
                if (recIds.indexOf(this.teacherData[i].userData.id) >= 0) {
                    this.teacherData.splice(i, 1);
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

        let data: TeacherData = <TeacherData>this.teachersGrid.records[event.detail.index];

        let field = this.teachersGrid.columns[event.detail.column]["field"];

        data.userData[field] = event.detail.value.new;
        data[field] = event.detail.value.new;

        data.userData.password = null;

        let request: CRUDUserRequest = {
            type: "update",
            data: data.userData,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            // console.log(data);
            // for (let key in data["w2ui"]["changes"]) {
            delete data["w2ui"]["changes"][field];
            // }
            this.teachersGrid.refreshCell(data["recid"], field);
        }, () => {
            data.userData[field] = event.detail.value.original;
            data[field] = event.detail.value.original;
            delete data["w2ui"]["changes"][field];
            this.teachersGrid.refreshCell(data["recid"], field);
        });

    }

    onAddClass() {

        let selectedTeachers = <number[]>this.teachersGrid.getSelection();

        // let selectedTeachers = <number[]>this.teachersGrid.getSelection().map((d: { recid: number }) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
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
                zweitlehrkraft_id: null,
                schule_id: teacherData.userData.schule_id,
                aktiv: true,
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

        });
    }

    onDeleteClass(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[] = <number[]>this.classesGrid.getSelection();

        //@ts-ignore
        // recIds = <any>this.classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        // let selectedClasss: ClassData[] = <ClassData[]>this.classesGrid.records.filter(
        //     (cd: ClassData) => recIds.indexOf(cd.id) >= 0);

        let request: CRUDClassRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            recIds.forEach(id => {

                for(let teacher of this.teachersGrid.records){
                    let te = <TeacherData> teacher;
                    te.classes = te.classes.filter((cl) => cl.id != id);
                }

            });
            this.classesGrid.refresh();
        }, () => {
            this.classesGrid.refresh();
        });

    }

    onDeleteClassWithoutTeacher(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[] = <number[]>this.classesWithoutTeachersGrid.getSelection();

        let request: CRUDClassRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            recIds.forEach(id => {
                let cd: ClassData = <ClassData>this.classesWithoutTeachersGrid.get(id + "");
                this.classesWithoutTeachersGrid.remove("" + id)
                let ld: TeacherData = <TeacherData>this.teachersGrid.get(cd.lehrkraft_id + "");
                if (ld != null) {
                    ld.classes = ld.classes.filter((cl) => cl.id != cd.id);
                }
                this.classesWithoutTeacher.splice(this.classesWithoutTeacher.indexOf(cd), 1);
            });
            this.classesWithoutTeachersGrid.refresh();
        }, () => {
            this.classesWithoutTeachersGrid.refresh();
        });

    }

    onUpdateClass(event: any) {

        let data: ClassData = <ClassData>this.classesGrid.records[event.detail.index];

        let newValue = event.detail.value.new;

        if (event.detail.column == 2) {
            let teacher: TeacherData = event.detail.value.new;
            if (teacher == null || typeof teacher == "string") {
                this.classesGrid.refresh();
                return;
            } else {
                let teacherOld1 = this.teacherData.find((td) => td.userData.id == data.lehrkraft_id);
                if (teacherOld1 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                // let teacherOld2 = this.teachersGrid.get(data.lehrkraft_id + "");
                // if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.lehrkraft_id = teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2: TeacherData = <any>this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null) teacherNew2.classes.push(data);
                newValue = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }

        if (event.detail.column == 3) {
            let teacher: TeacherData = event.detail.value.new;
            if (teacher == null || typeof teacher == "string") {
                this.classesGrid.refresh();
                return;
            } else {
                let teacherOld1 = this.teacherData.find((td) => td.userData.id == data.zweitlehrkraft_id);
                if (teacherOld1 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                // let teacherOld2 = this.teachersGrid.get(data.zweitlehrkraft_id + "");
                // if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.zweitlehrkraft_id = teacher.userData.id == -1 ? null : teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2: TeacherData = <any>this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null) teacherNew2.classes.push(data);
                newValue = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }



        let field = this.classesGrid.columns[event.detail.column]["field"];
        data[field] = newValue;

        let request: CRUDClassRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            if (data["w2ui"] && data["w2ui"]["changes"][field] != null) {
                delete data["w2ui"]["changes"][field];
                this.classesGrid.refreshCell(data["recid"], field);
            }
        }, () => {
            if (data["w2ui"] && data["w2ui"]["changes"][field] != null) {
                data[field] = event.detail.value.original;
                delete data["w2ui"]["changes"][field];
                this.classesGrid.refreshCell(data["recid"], field);
            }
        });
    }

    onUpdateClassWithoutTeacher(event: any) {

        let data: ClassData = <ClassData>this.classesGrid.records[event.detail.index];

        let field = this.classesGrid.columns[event.detail.column]["field"];
        data[field] = event.detail.value.new;

        let request: CRUDClassRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            if (data["w2ui"]["changes"][field] != null) {
                delete data["w2ui"]["changes"][field];
            }
            this.classesWithoutTeachersGrid.refreshCell(data["recid"], field);
        }, () => {
            data[field] = event.detail.value.original;
            delete data["w2ui"]["changes"][field];
            this.classesWithoutTeachersGrid.refreshCell(data["recid"], field);
        });
    }


}