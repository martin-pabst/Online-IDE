import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, ClassData, CRUDClassRequest, CRUDUserRequest, CRUDResponse, GetClassesDataRequest, GetClassesDataResponse, ChangeClassOfStudentsRequest, ChangeClassOfStudentsResponse, BulkCreateUsersRequest, BulkCreateUsersResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { Administration } from "./Administration.js";
import { TeachersWithClassesMI } from "./TeachersWithClasses.js";
import { PasswordPopup } from "./PasswordPopup.js";
import { UserMenu } from "../main/gui/UserMenu.js";
import { setSelectItems, getSelectedObject } from "../tools/HtmlTools.js";
import { w2grid } from "../lib/w2ui-2.0.es6.js";

declare var w2prompt: any;
declare var w2alert: any;

type Step = "Step 1 Paste" | "Step 2 check" | "Step 3 import" | "Step 4 print";

type Column = "rufname" | "familienname" | "username" | "passwort";
type ColumnMapping = { [column: string]: number };

export class StudentBulkImportMI extends AdminMenuItem {

    destroy() {
        this.studentGrid.destroy();
    }

    studentGrid: w2grid;

    step: Step;
    $tableLeft: JQuery<HTMLElement>;
    $tableRight: JQuery<HTMLElement>;

    $importTextArea: JQuery<HTMLElement>;
    $protocol: JQuery<HTMLElement>;

    selectedClass: ClassData;
    usersToWrite: UserData[];

    constructor(administration: Administration) {
        super(administration);
    }

    checkPermission(user: UserData): boolean {
        return user.is_teacher;
    }

    getButtonIdentifier(): string {
        return "Schülerdatenimport";
    }

    onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {


        this.$tableLeft = $tableLeft;
        this.$tableRight = $tableRight;


        $tableRight.css('flex', '2');

        let that = this;
        this.studentGrid = new w2grid({
            name: "studentgrid",
            header: 'Schüler/innen',
            selectType: "cell",
            show: {
                header: true,
                toolbar: true,
                toolbarDelete: true,
                footer: true,
                selectColumn: true,
                toolbarSearch: false
            },
            toolbar: {
                items: [
                ]
            },
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'rufname', text: 'Rufname', size: '25%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'familienname', text: 'Familienname', size: '25%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'username', text: 'Benutzername', size: '25%', sortable: true, resizable: true, editable: { type: 'text' }, sortMode: 'i18n' },
                { field: 'password', text: 'Passwort', size: '25%', sortable: false, editable: { type: 'text' } }
            ],
            searches: [
                { field: 'username', label: 'Benutzername', type: 'text' },
                { field: 'rufname', label: 'Rufname', type: 'text' },
                { field: 'familienname', label: 'Familienname', type: 'text' }
            ],
            sortData: [{ field: 'klasse', direction: 'asc' }, { field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
            onDelete: function (event) {
                if (!event.detail.force || event.isStopped) return;
                let recIds: number[] = this.studentsGrid.getSelection().map((sel) => sel["recid"]).filter((value, index, array) => array.indexOf(value) === index);
                event.onComplete = () => {
                    recIds.forEach((id) => this.studentsGrid.remove(id + ""));
                }
            }
        });

        this.studentGrid.render($tableRight[0]);

        this.showStep("Step 1 Paste");

    }

    showStep(step: Step) {

        this.$tableLeft.empty();

        switch (step) {
            case "Step 1 Paste":
                this.enableGrid(false);
                this.showStep1Paste();
                break;
            case "Step 2 check":
                this.enableGrid(true);
                this.showStep2Check();
                break;
            case "Step 3 import":
                this.enableGrid(false);
                this.showStep3Import();
                break;
            case "Step 4 print":
                this.enableGrid(false);
                this.showStep4Print();
                break;
        }

        this.step = step;
    }

    showStep4Print() {

        let description: string = `Die Schüler/innen wurden erfolgreich angelegt und der Klasse ${this.selectedClass.name} zugeordnet.
        Eine Liste der Zugangsdaten zum Ausdrucken erhalten Sie durch Klick auf den Button "Drucken...".
        `

        this.$tableLeft.append($('<div class="jo_bulk_heading">Schritt 4: Fertig!</div>'));
        let $description = $(`<div class="jo_bulk_description"></div>`);
        $description.html(description);
        this.$tableLeft.append($description);

        let $buttondiv = $(`<div class="jo_bulk_buttondiv" style="justify-content: space-between"></div>`);
        this.$tableLeft.append($buttondiv);
        let $buttonPrint = $(`<div class="jo_buttonContinue jo_button jo_active">Drucken...</div>`);
        $buttondiv.append($buttonPrint);

        let $buttonWriteUsers = $(`<div class="jo_buttonContinue jo_button jo_active">OK</div>`);
        $buttondiv.append($buttonWriteUsers);

        let $printDiv = $('#print');
        $printDiv.empty();
        this.usersToWrite.forEach((user) => {
            $printDiv.append(`<div style="page-break-inside: avoid;">
            <div><b>URL:</b> https://www.online-ide.de</div>
            <div><b>Name:</b> ${user.rufname} ${user.familienname}</div>
            <div><b>Klasse:</b> ${this.selectedClass.name}</div>
            <div><b>Benutzername:</b> ${user.username}</div>
            <div style="margin-bottom: 3em"><b>Passwort:</b> ${user.password}</div>
            </div>`);
        });

        $buttonPrint.on('click', () => {
            $('#outer').css('display', 'none');
            window.print();
            $('#outer').css('display', '');
        })

        $buttonWriteUsers.on('click', () => {

            this.studentGrid.clear();
            this.showStep("Step 1 Paste");

        })


    }

    showStep3Import() {

        let description: string = `Die Schüler/innen können jetzt angelegt und der Klasse ${this.selectedClass.name} zugeordnet werden.`

        this.$tableLeft.append($('<div class="jo_bulk_heading">Schritt 3: Benutzer anlegen</div>'));
        let $description = $(`<div class="jo_bulk_description"></div>`);
        $description.html(description);
        this.$tableLeft.append($description);

        let $buttondiv = $(`<div class="jo_bulk_buttondiv" style="justify-content: space-between"></div>`);
        this.$tableLeft.append($buttondiv);
        let $buttonBack = $(`<div class="jo_buttonContinue jo_button jo_active">Zurück</div>`);
        $buttondiv.append($buttonBack);
        let $buttonWriteUsers = $(`<div class="jo_buttonWriteUsers jo_button jo_active">Benutzer anlegen</div>`);
        $buttondiv.append($buttonWriteUsers);

        this.$protocol = $('<div class="jo_bulk_protocol"></div>');
        this.$tableLeft.append(this.$protocol);
        this.$protocol.hide();

        $buttonBack.on('click', () => {
            this.showStep("Step 2 check");
        })


        $buttonWriteUsers.on('click', () => {

            $buttonWriteUsers.removeClass('jo_active');

            this.$protocol.show();
            this.$protocol.html("<div>Die Benutzer werden angelegt. Bitte warten...</div>");

            let request: BulkCreateUsersRequest = {
                onlyCheckUsernames: false,
                schule_id: this.administration.userData.schule_id,
                users: this.usersToWrite
            }

            ajax('bulkCreateUsers', request, (response: BulkCreateUsersResponse) => {
                this.showStep("Step 4 print");
            }, (message) => {
                alert("Fehler: " + message);
                this.showStep("Step 2 check");
            });

        })


    }

    showStep2Check() {

        let description: string = `Bitte wählen Sie im Auswahlfeld die Klasse aus, in die die Schülerdaten importiert werden sollen. Sie können die Daten in der Tabelle noch bearbeiten, bevor Sie sie zur Überprüfung (noch kein Import!) absenden.`

        this.$tableLeft.append($('<div class="jo_bulk_heading">Schritt 2: Daten überprüfen</div>'));
        let $description = $(`<div class="jo_bulk_description"></div>`);
        $description.html(description);
        this.$tableLeft.append($description);

        let request: GetClassesDataRequest = {
            school_id: this.administration.userData.schule_id
        }

        let $select = <JQuery<HTMLSelectElement>>$('<select class="jo_bulk_chooseClass"></select>');
        this.$tableLeft.append($select);

        ajax('getClassesData', request, (response: GetClassesDataResponse) => {
            // cd.id, cd.name
            setSelectItems($select, response.classDataList.map((cd) => {
                return {
                    caption: cd.name,
                    value: cd.id,
                    object: cd
                }
            }));
        });


        let $buttondiv = $(`<div class="jo_bulk_buttondiv" style="justify-content: space-between"></div>`);
        this.$tableLeft.append($buttondiv);
        let $buttonBack = $(`<div class="jo_buttonContinue jo_button jo_active">Zurück</div>`);
        $buttondiv.append($buttonBack);
        let $buttonContinue = $(`<div class="jo_buttonContinue jo_button jo_active">Daten überprüfen...</div>`);
        $buttondiv.append($buttonContinue);

        this.$tableLeft.append($('<div class="jo_bulk_heading_protocol">Fehlerprotokoll</div>'));
        this.$protocol = $('<div class="jo_bulk_protocol"></div>');
        this.$tableLeft.append(this.$protocol);

        $buttonBack.on('click', () => {
            this.showStep("Step 1 Paste");
        })

        $buttonContinue.on('click', () => {
            this.selectedClass = getSelectedObject($select);
            this.checkData(this.selectedClass);
        })


    }

    checkData(classData: ClassData) {
        this.studentGrid.mergeChanges();

        this.usersToWrite = <UserData[]>this.studentGrid.records

        let request: BulkCreateUsersRequest = {
            onlyCheckUsernames: true,
            schule_id: this.administration.userData.schule_id,
            users: this.usersToWrite
        }

        ajax('bulkCreateUsers', request, (response: BulkCreateUsersResponse) => {
            if (response.namesAlreadyUsed.length == 0) {

                for (let user of this.usersToWrite) {
                    user.schule_id = this.administration.userData.schule_id;
                    user.klasse_id = classData.id;
                    user.is_admin = false;
                    user.is_schooladmin = false;
                    user.is_teacher = false;
                }

                this.showStep("Step 3 import");
            } else {
                this.$protocol.html('Diese Benutzernamen sind schon anderen Benutzern zugeordnet und können daher nicht verwendet werden: <br>' + response.namesAlreadyUsed.join(", "));
            }
        }, (message) => {
            alert("Fehler: " + message);
        });

        return false;
    }

    showStep1Paste() {

        let description: string = `
        Zum Importieren wird eine Tabelle mit den Spalten Rufname, Familienname, Username und (optional:) Passwort benötigt, 
        wobei die Daten in den Zellen jeweils mit Tab-Zeichen getrennt sind. Sie erhalten dieses Format beispielsweise, 
        indem Sie eine Tabelle in Excel in die Zwischenablage kopieren. <br> Falls die erste Zeile Spaltenköpfe mit
        den korrekten Bezeichnern (Rufname, Familienname, Username, Passwort) enthält, kümmert sich der Import-Algorithmus
        um die richtige Reihenfolge und blendet ggf. auch überflüssige Spalten aus. Falls eine Zeile kein Passwort enthält, 
        setzt die Online-IDE ein Zufallspasswort.<br>
        Bitte fügen Sie den Inhalt der Tabelle per Copy-Paste in dieses Eingabefeld ein:`

        this.$tableLeft.append($('<div class="jo_bulk_heading">Schritt 1: Daten einlesen</div>'));
        let $description = $(`<div class="jo_bulk_description"></div>`);
        this.$tableLeft.append($description);
        // this.$tableLeft.append(description);

        this.$importTextArea = $(`<textarea class="jo_bulk_importarea"></textarea>`);
        this.$tableLeft.append(this.$importTextArea);
        this.$importTextArea.html('');

        let $buttondiv = $(`<div class="jo_bulk_buttondiv" style="justify-content: flex-end"></div>`);
        this.$tableLeft.append($buttondiv);
        let $buttonContinue = $(`<div class="jo_buttonContinue jo_button jo_active">Weiter</div>`);
        $buttondiv.append($buttonContinue);

        $buttonContinue.on('click', () => {
            this.parseText(<string>this.$importTextArea.val());
            this.showStep("Step 2 check");
        })

        // this.$tableLeft.append($('<div class="jo_bulk_heading_protocol">Importprotokoll</div>'));
        // this.$protocol = $('<div class="jo_bulk_protocol"></div>');
        // this.$tableLeft.append(this.$protocol);

        $description.html(description);

    }

    parseText(text: string) {

        // this.$protocol.empty();

        let lines1: string[] = text.split(/\r?\n/);

        let lines: string[][] = [];
        for (let line1 of lines1) {
            if (line1.length > 6) {
                let columns: string[] = line1.split(/\t/);
                lines.push(columns);
            }
        }

        let cm = this.getColumnMapping(lines);
        let columnMapping: ColumnMapping = cm.columnMapping;

        let userData: UserData[] = this.makeUserData(lines, columnMapping);
        if (userData.length > 0) {
            this.studentGrid.clear();
            this.studentGrid.add(userData);
            this.studentGrid.refresh();
        }
    }

    makeUserData(lines: string[][], columnMapping: ColumnMapping): UserData[] {

        let userData: UserData[] = [];
        let id: number = 1;

        for (let line of lines) {
            let password: string = this.getRandomPassword();
            if(columnMapping["passwort"] && line[columnMapping["passwort"]] != null){
                password = line[columnMapping["passwort"]].trim()
            } 

            userData.push({
                id: id++,
                familienname: line[columnMapping["familienname"]],
                rufname: line[columnMapping["rufname"]],
                username: line[columnMapping["username"]].trim(),
                password: password,
                is_admin: false,
                is_schooladmin: false,
                is_teacher: false,
                klasse_id: -1,
                schule_id: -1
            });
        }

        return userData;

    }

    getRandomPassword(): string {
        let goodCharacters: string = "abcdefghkmnpqrstuvwxyABCDEFGHKLMNPQRSTUVW123456789#!$";
        let pw: string = '';
        for(let i = 0; i< 8; i++){
            pw += goodCharacters.charAt(Math.trunc(Math.random() * goodCharacters.length));
        }        
        return pw;
    }

    getColumnMapping(lines: string[][]): { columnMapping: ColumnMapping, line1HasHeaders: boolean } {

        let columnHeaders: string[] = ["rufname", "familienname", "username", "passwort"];

        let columnMapping: ColumnMapping = {
            "rufname": 0,
            "familienname": 1,
            "username": 2,
            "passwort": 3
        }

        if (lines.length < 2) {
            // this.$protocol.append($(`<div>In den Daten sind weniger als zwei Zeilen zu finden. Es wird daher nicht nach einer Kopfzeile gesucht.</div>`))
            return { columnMapping: columnMapping, line1HasHeaders: false };
        }

        let missingHeaders: string[] = [];
        let headersFound: string[] = [];
        let maxColumnIndex: number = 0;

        for (let header of columnHeaders) {
            let index = lines[0].findIndex(column => column.toLocaleLowerCase() == header.toLocaleLowerCase());

            if (index == -1 && header.toLocaleLowerCase() == "passwort") {
                index = lines[0].findIndex(column => column.toLocaleLowerCase() == "password");
            }

            if (index == -1) {
                missingHeaders.push(header);
            } else {
                columnMapping[header] = index;
                if (index > maxColumnIndex) maxColumnIndex = index;
                headersFound.push(header);
            }
        }

        // this.$protocol.append($(`<div>In der 1. Zeile wurden folgende Spaltenköpfe gefunden: ${headersFound.join(", ")}</div>`));
        // if (missingHeaders.length > 0)
        //     this.$protocol.append($(`<div class="jo_bulk_error">Nicht gefunden wurden: ${missingHeaders.join(", ")}</div>`));

        let line1HasHeaders = missingHeaders.length < 2;

        let lineNumber: number = 1;
        if (line1HasHeaders) {
            lines.splice(0, 1);
            lineNumber++;
        }

        for (let line of lines) {
            if (line.length < maxColumnIndex + 1) {
                // this.$protocol.append($(`<div class="jo_bulk_error">In Zeile ${lineNumber} gibt es nur ${line.length} Spalten. Benötigt werden aber ${maxColumnIndex + 1} Spalten.</div>`));
            }
            lineNumber++;
        }

        return { columnMapping: columnMapping, line1HasHeaders: line1HasHeaders }

    }

    enableGrid(enabled: boolean) {
        if (enabled) {
            this.studentGrid.unlock();
        } else {
            this.studentGrid.lock("", false);
        }
    }


}