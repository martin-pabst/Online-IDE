import { AdminMenuItem } from "./AdminMenuItem.js";
import { GetTeacherDataRequest, GetTeacherDataResponse, TeacherData, UserData, ClassData, CRUDClassRequest, CRUDUserRequest, CRUDResponse, GetClassesDataRequest, GetClassesDataResponse, ChangeClassOfStudentsRequest, ChangeClassOfStudentsResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { Administration } from "./Administration.js";
import { TeachersWithClassesMI } from "./TeachersWithClasses.js";
import { PasswordPopup } from "./PasswordPopup.js";

declare var w2prompt: any;
declare var w2alert: any;

export class ClassesWithStudentsMI extends AdminMenuItem {
    destroy() {
        w2ui[this.classesGridName].destroy();
        w2ui[this.studentGridName].destroy();
    }



    classesGridName = "classesGrid";
    studentGridName = "studentsGrid";

    allClassesList: ClassData[] = [];
    teacherDataList: TeacherData[] = [];

    constructor(administration: Administration) {
        super(administration);
        this.initChooseClassPopup();
    }

    checkPermission(user: UserData): boolean {
        return user.is_teacher;
    }

    getButtonIdentifier(): string {
        return "Klassen mit Schülern";
    }

    onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {

        $tableRight.css('flex', '1');

        let that = this;

        this.loadTablesFromTeacherObject(() => {
            $tableLeft.w2grid({
                name: this.classesGridName,
                header: 'Klassen',
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
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'numberOfStudents', caption: 'Schüler/innen', size: '30%', sortable: false, resizable: true,
                        render: function (record: ClassData) {
                            return '<div>' + record.students.length + '</div>';
                        }
                    },
                    {
                        field: 'teacher', caption: 'Lehrkraft', size: '30%', sortable: true, resizable: true,
                        editable: { type: 'list', items: that.teacherDataList, filter: false },
                        render: function (record: ClassData) {
                            let teacher = that.teacherDataList.find(td => td.userData.id == record.lehrkraft_id);
                            if (teacher != null) {
                                return '<div>' + teacher.userData.rufname + " " + teacher.userData.familienname + '</div>';
                            }
                        }
                    },
                    {
                        field: 'teacher2', caption: 'Zweitlehrkraft', size: '30%', sortable: true, resizable: true,
                        render: function (record: ClassData) {
                            let teacher = that.teacherDataList.find(td => td.userData.id == record.zweitlehrkraft_id);
                            if (teacher != null) {
                                return '<div>' + teacher.userData.rufname + " " + teacher.userData.familienname + '</div>';
                            }
                        },
                        editable: {
                            type: 'list', items: that.teacherDataList.slice(0).concat([{
                                //@ts-ignore
                                userData: { id: -1, rufname: "Keine Zweitlehrkraft", familienname: "" },
                                classes: [],
                                id: -1,
                                text: "Keine Zweitlehrkraft"
                            }]), filter: false
                        }
                    },
                    {
                        field: 'aktiv', caption: 'aktiv', size: '10%', sortable: false, resizable: false, style: 'text-align: center',
                        editable: { type: 'checkbox', style: 'text-align: center' }
                    }
                ],
                searches: [
                    { field: 'name', label: 'Bezeichnung', type: 'text' }
                ],
                sortData: [{ field: 'name', direction: 'ASC' }],
                onSelect: (event) => { event.done(() => { that.onSelectClass(event) }) },
                onUnselect: (event) => { event.done(() => { that.onUnselectClass(event) }) },
                onAdd: (event) => { that.onAddClass() },
                onChange: (event) => { that.onUpdateClass(event) },
                onDelete: (event) => { that.onDeleteClass(event) },
            })

            this.loadClassDataList(() => {
                $tableRight.w2grid({
                    name: this.studentGridName,
                    header: 'Schüler/innen',
                    // selectType: "cell",
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
                            { type: 'button', id: 'passwordButton', text: 'Passwort ändern...' }, //, img: 'fa-key' },
                            { type: 'button', id: 'changeClassButton', text: 'Klasse ändern...' } //, img: 'fa-key' }
                        ],
                        onClick: function (target, data) {
                            if (target == "passwordButton") {
                                that.changePassword();
                            } else if (target == "changeClassButton") {
                                that.changeClass();
                            }
                        }
                    },
                    recid: "id",
                    columns: [
                        { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                        {
                            field: 'klasse', caption: 'Klasse', size: '10%', sortable: true, resizable: true
                        },
                        { field: 'username', caption: 'Benutzername', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                        { field: 'rufname', caption: 'Rufname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                        { field: 'familienname', caption: 'Familienname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                        {
                            field: 'id', caption: 'PW', size: '40px', sortable: false, render: (e) => {
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
                    onAdd: (event) => { that.onAddStudent() },
                    onChange: (event) => { that.onUpdateStudent(event) },
                    onDelete: (event) => { that.onDeleteStudent(event) },
                    onClick: (event) => {
                        if (event.column == 1) {
                            w2ui[that.studentGridName].editField(event.recid, event.column);
                        }
                    },
                    onSelect: (event) => { event.done(() => { that.onSelectStudent(event) }) },
                    onUnselect: (event) => { event.done(() => { that.onUnselectStudent(event) }) },
                });
                this.loadTables();
            });

        })


    }

    onUnselectStudent(event) {
        let studentGrid = w2ui[this.studentGridName];
        let selection = studentGrid.getSelection();

        if (selection.length == 0) {
            //@ts-ignore
            studentGrid.toolbar.disable('changeClassButton');

            //@ts-ignore
            studentGrid.toolbar.disable('passwordButton');
        }
    }


    onSelectStudent(event: any) {

        let studentGrid = w2ui[this.studentGridName];

        let selection = studentGrid.getSelection();

        // let selection = studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        if (selection.length > 0) {
            //@ts-ignore
            studentGrid.toolbar.enable('changeClassButton');
        } else {
            //@ts-ignore
            studentGrid.toolbar.disable('changeClassButton');
        }

        if (selection.length == 1) {
            //@ts-ignore
            studentGrid.toolbar.enable('passwordButton');
        } else {
            //@ts-ignore
            studentGrid.toolbar.disable('passwordButton');
        }

    }

    changeClass() {
        let recIds: number[];
        let that = this;

        let studentGrid: W2UI.W2Grid = w2ui[this.studentGridName];
        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        recIds = <number[]>studentGrid.getSelection();
        //@ts-ignore
        // recIds = <any>studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let students: UserData[] = recIds.map((id) => <UserData>studentGrid.get(id + ""));

        this.openChooseClassPopup((newClass: ClassData) => {

            newClass = that.allClassesList.find((cl) => cl.id == newClass.id);

            let request: ChangeClassOfStudentsRequest = {
                student_ids: recIds,
                new_class_id: newClass.id
            }

            ajax("changeClassOfStudents", request, (response: ChangeClassOfStudentsResponse) => {

                w2alert("Die Schüler wurden erfolgreich in die Klasse " + newClass.name + " verschoben.");

                for (let klasse of this.allClassesList) {
                    klasse.students = klasse.students.filter((student) => recIds.indexOf(student.id) < 0);
                }

                for (let student of students) newClass.students.push(student);

                for (let rc of classesGrid.records) {
                    let rc1 = <ClassData>rc;
                    rc1.students = this.allClassesList.find((cl) => cl.id == rc1.id).students;
                }
                classesGrid.refresh();

                that.updateStudentTableToSelectedClasses();

            }, (message: string) => {
                w2alert("Fehler beim versetzen der Schüler: " + message);
            });

        }, this.allClassesList);





    }

    changePassword(recIds: number[] = []) {
        let that = this;


        let studentGrid: W2UI.W2Grid = w2ui[this.studentGridName];


        if (recIds.length == 0) {
            recIds = <number[]>studentGrid.getSelection();
            //@ts-ignore
            // recIds = <any>studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }

        if (recIds.length != 1) {
            studentGrid.error("Zum Ändern eines Passworts muss genau ein Schüler ausgewählt werden.");
        } else {
            let student: UserData = <UserData>studentGrid.get(recIds[0] + "", false);

            let passwordFor: string = student.rufname + " " + student.familienname + " (" + student.username + ")";
            PasswordPopup.open(passwordFor, () => {
                studentGrid.searchReset();
                that.preparePasswordButtons();
            }, (password) => {

                student.password = password;

                let request: CRUDUserRequest = {
                    type: "update",
                    data: student,
                }
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

                ajax("CRUDUser", request, (response: CRUDResponse) => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));

                    w2alert('Das Passwort für ' + student.rufname + " " + student.familienname + " (" + student.username + ") wurde erfolgreich geändert.");
                    studentGrid.searchReset();
                    that.preparePasswordButtons();
                }, () => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                    studentGrid.searchReset();
                    that.preparePasswordButtons();
                });


            });

        }

    }

    onDeleteClass(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];

        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        recIds = <number[]>classesGrid.getSelection();
        //@ts-ignore
        // recIds = <any>classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        // let selectedClasses: ClassData[] = <ClassData[]>classesGrid.records.filter(
        //     (cd: ClassData) => recIds.indexOf(cd.id) >= 0);


        let request: CRUDClassRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            recIds.forEach(id => {
                classesGrid.remove("" + id);
                this.allClassesList = this.allClassesList.filter(cd => cd.id != id);
            }
            );

            classesGrid.refresh();
        }, () => {
            classesGrid.refresh();
        });

    }

    onUpdateClass(event: any) {
        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        let data: ClassData = <ClassData>classesGrid.records[event.index];

        let field = classesGrid.columns[event.column]["field"];

        if (data[field] != undefined) data[field] = event.value_new;

        if (event.column == 3) {
            let teacher: TeacherData = event.value_new;
            if (teacher == null || typeof teacher == "string") {
                classesGrid.refresh();
                return;
            } else {
                let teacherOld1 = this.teacherDataList.find((td) => td.userData.id == data.lehrkraft_id);
                if (teacherOld1 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                // let teacherOld2 = this.teachersGrid.get(data.lehrkraft_id + "");
                // if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.lehrkraft_id = teacher.userData.id;
                teacher.classes.push(data);

                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }

        if (event.column == 4) {
            let teacher: TeacherData = event.value_new;
            if (teacher == null || typeof teacher == "string") {
                return;
            } else {
                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
                data.zweitlehrkraft_id = teacher.userData.id == -1 ? null : teacher.userData.id;
            }
        }

        let request: CRUDClassRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            // console.log(data);
            delete data["w2ui"]["changes"][field];
            classesGrid.refreshCell(data["recid"], field);

            let classData = this.allClassesList.find(c => "" + c.id == data["recid"]);
            if (classData != null) {
                classData[field] = event.value_new;
                if (field == "name") {
                    classData.text = event.value_new;
                }
            }
        }, () => {
            data[field] = event.value_original;
            delete data["w2ui"]["changes"][field];
            classesGrid.refreshCell(data["recid"], field);
        });
    }

    onAddClass() {
        let userData = this.administration.userData;

        let request: CRUDClassRequest = {
            type: "create",
            data: {
                id: -1,
                schule_id: userData.schule_id,
                lehrkraft_id: userData.id,
                zweitlehrkraft_id: null,
                name: "Name der Klasse",
                aktiv: true,
                students: []
            },
        };

        ajax("CRUDClass", request, (response: CRUDResponse) => {
            let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];
            let cd: ClassData = request.data;
            cd.id = response.id;
            classesGrid.add(cd);

            cd.lehrkraft_id = userData.id;
            cd.schule_id = userData.schule_id;
            cd.students = [];

            classesGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            this.allClassesList.push(cd)

            this.selectTextInCell();
        });
    }


    onUnselectClass(event: any) {

        this.updateStudentTableToSelectedClasses();
        this.preparePasswordButtons();

    }


    onSelectClass(event: any) {

        this.updateStudentTableToSelectedClasses();
        this.preparePasswordButtons();

    }

    preparePasswordButtons() {
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

    loadTablesFromTeacherObject(callback: () => void) {

        let request: GetTeacherDataRequest = { school_id: this.administration.userData.schule_id };

        ajax("getTeacherData", request, (data: GetTeacherDataResponse) => {
            this.teacherDataList = data.teacherData;

            for (let teacher of this.teacherDataList) {
                teacher["id"] = teacher.userData.id;
                teacher["username"] = teacher.userData.username;
                teacher["familienname"] = teacher.userData.familienname;
                teacher["rufname"] = teacher.userData.rufname;
                teacher["text"] = teacher.userData.rufname + " " + teacher.userData.familienname
            }

            callback();

        }, () => {
            w2alert('Fehler beim Holen der Daten.');
        });


    }


    updateStudentTableToSelectedClasses() {
        let recIds: number[];

        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        //@ts-ignore
        // recIds = <any>classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        recIds = <number[]>classesGrid.getSelection();

        let selectedClasses: ClassData[] = this.allClassesList.filter(
            (cd: ClassData) => recIds.indexOf(cd.id) >= 0);

        let studentsGrid: W2UI.W2Grid = w2ui[this.studentGridName];

        let studentList: UserData[] = [];

        for (let cd of selectedClasses) {
            for (let sd of cd.students) {
                //@ts-ignore
                sd.klasse = cd.name;
                studentList.push(sd);
            }
        }

        // studentsGrid.records = studentList;
        // setTimeout(() => {
        studentsGrid.clear();
        studentsGrid.add(studentList);
        studentsGrid.refresh();
        this.onSelectStudent(null);
        // }, 20);

    }

    loadClassDataList(callback: () => void) {

        let request: GetClassesDataRequest = {
            school_id: this.administration.userData.schule_id
        }

        ajax('getClassesData', request, (response: GetClassesDataResponse) => {
            this.allClassesList = response.classDataList;
            for (let cd of this.allClassesList) {
                cd.text = cd.name;
            }
            callback();
        });


    }

    loadTables() {
        let classesTable = w2ui[this.classesGridName];
        if (classesTable == null) {
            return;
        }
        classesTable.clear();

        classesTable.add(this.allClassesList);
        classesTable.refresh();
    }

    onDeleteStudent(event: any) {
        if (!event.force || event.isStopped) return;

        let recIds: number[];

        let studentGrid: W2UI.W2Grid = w2ui[this.studentGridName];
        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        //@ts-ignore
        // recIds = <any>studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        recIds = <number[]>studentGrid.getSelection();

        let request: CRUDUserRequest = {
            type: "delete",
            data: null,
            ids: recIds,
        }

        let that = this;

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            recIds.forEach(id => studentGrid.remove("" + id));
            this.allClassesList.forEach(klass => {
                for (let i = 0; i < klass.students.length; i++) {
                    let student = klass.students[i];
                    if (recIds.indexOf(student.id) >= 0) {
                        klass.students.splice(i, 1);
                        i--;
                    }
                }
            })

            studentGrid.refresh();
            classesGrid.refresh();
        }, (message: string) => {
            w2alert('Fehler beim Löschen der Schüler: ' + message);
            studentGrid.refresh();
        });

    }

    onUpdateStudent(event: any) {
        let studentGrid: W2UI.W2Grid = w2ui[this.studentGridName];

        let data: UserData = <UserData>studentGrid.records[event.index];

        let value_new_presented = event.value_new;
        let value_old_database: number = data.klasse_id;

        if (event.column == 1) {
            let classData: ClassData = event.value_new;
            value_new_presented = classData.name;
            if (event.value_new.id == null) {
                event.preventDefault();
                return;
            }
            data.klasse_id = event.value_new.id;
        }

        let field = studentGrid.columns[event.column]["field"];
        data[field] = value_new_presented;


        let request: CRUDUserRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            delete data["w2ui"]["changes"][field];
            studentGrid.refreshCell(data["recid"], field);
        }, (message: string) => {
            data[field] = event.value_original;
            data.klasse_id = value_old_database;
            delete data["w2ui"]["changes"][field];
            studentGrid.refreshCell(data["recid"], field);
            alert(message);
        });

    }

    onAddStudent() {
        let userData = this.administration.userData;
        let studentGrid: W2UI.W2Grid = w2ui[this.studentGridName];

        let classesGrid: W2UI.W2Grid = w2ui[this.classesGridName];

        let selectedClasses = <number[]>classesGrid.getSelection();

        // let selectedClasses = <number[]>classesGrid.getSelection().filter((value, index, array) => array.indexOf(value) === index).map(cl => (<any>cl).recid);
        if (selectedClasses.length != 1) {
            studentGrid.error("Wenn Sie Schüler hinzufügen möchten muss links genau eine Klasse ausgewählt sein.");
            return;
        }
        let classId = selectedClasses[0];
        let klass = <ClassData>classesGrid.get("" + classId, false);

        let request: CRUDUserRequest = {
            type: "create",
            data: {
                id: -1,
                schule_id: userData.schule_id,
                klasse_id: classId,
                username: "Benutzername" + Math.round(Math.random() * 10000000),
                rufname: "Rufname",
                familienname: "Familienname",
                is_admin: false,
                is_schooladmin: false,
                is_teacher: false,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };

        //@ts-ignore
        w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);

        ajax("CRUDUser", request, (response: CRUDResponse) => {
            let ud: UserData = request.data;
            ud.id = response.id;
            ud["klasse"] = klass.name;
            studentGrid.add(ud);
            studentGrid.editField(ud.id + "", 2, undefined, { keyCode: 13 });
            klass.students.push(ud);

            this.selectTextInCell();

            this.preparePasswordButtons();
            classesGrid.refresh();
            // @ts-ignore
            w2utils.unlock(jQuery('body'));

        }, (errormessage) => {
            //@ts-ignore
            w2utils.unlock(jQuery('body'));
            w2alert("Beim Anlegen des Benutzers ist ein Fehler aufgetreten: " + errormessage);
        });
    }

    initChooseClassPopup() {
        let that = this;
        if (!w2ui.chooseClassForm) {
            jQuery().w2form({
                name: 'chooseClassForm',
                style: 'border: 0px; background-color: transparent;',
                formHTML:
                    '<div class="w2ui-page page-0">' +
                    '    <div class="w2ui-field">' +
                    '        <label>Neue Klasse:</label>' +
                    '        <div>' +
                    '           <input name="newClass" type="text" style="width: 150px"/>' +
                    '        </div>' +
                    '    </div>' +
                    '</div>' +
                    '<div class="w2ui-buttons">' +
                    '    <button class="w2ui-btn" name="cancel">Abbrechen</button>' +
                    '    <button class="w2ui-btn" name="OK">OK</button>' +
                    '</div>',
                fields: [
                    {
                        field: 'newClass', type: 'list', required: true,
                        options: { items: [] }
                    },
                ],
                record: {
                    newClass: 'John',
                },
                actions: {
                    "cancel": function () {
                        w2popup.close();
                    },
                    "OK": function () {
                        w2popup.close();
                        this.myCallback(this.record.newClass);
                    }
                }
            });
        }
    }

    openChooseClassPopup(callback: (newClass: ClassData) => void, classList: any) {

        w2ui["chooseClassForm"].myCallback = callback;
        w2ui["chooseClassForm"].fields[0].options.items = classList;

        //@ts-ignore
        jQuery().w2popup('open', {
            title: 'Neue Klasse wählen',
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: true,
            onToggle: function (event) {
                jQuery(w2ui.chooseClassForm.box).hide();
                event.onComplete = function () {
                    jQuery(w2ui.chooseClassForm.box).show();
                    w2ui.chooseClassForm.resize();
                }
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    //@ts-ignore
                    jQuery('#w2ui-popup #form').w2render('chooseClassForm');
                }
            }
        });
    }

}