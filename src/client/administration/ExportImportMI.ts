import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse, ImportSchoolsResponse, GetMessagesResponse, GetMessagesRequest } from "../communication/Data.js";
import { ajax, csrfToken } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
import { w2grid } from "../lib/w2ui-2.0.es6.js";

declare var w2prompt: any;
declare var w2alert: any;

export class ExportImportMI extends AdminMenuItem {
    destroy() {
        this.schoolGrid.destroy();
    }

    schoolGrid: w2grid;

    schoolDataList: SchoolData[] = [];

    checkPermission(user: UserData): boolean {
        return user.is_admin;
    }

    getButtonIdentifier(): string {
        return "Schulen Exportieren/Importieren";
    }

    onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>) {
        let that = this;

        this.schoolGrid = new w2grid({
            name: "schoolGridExportImport",
            header: 'Schulen',
            // selectType: "cell",
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
            recid: "id",
            columns: [
                { field: 'id', text: 'ID', size: '20px', sortable: true, hidden: true },
                { field: 'name', text: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                { field: 'kuerzel', text: 'Kürzel', size: '10%', sortable: true, resizable: true, editable: { type: 'text', maxlength: "10" } },
                { field: 'numberOfClasses', text: 'Klassen', size: '30%', sortable: true, resizable: true },
                { field: 'numberOfUsers', text: 'User', size: '30%', sortable: true, resizable: true },
            ],
            searches: [
                { field: 'name', label: 'Bezeichnung', type: 'text' }
            ],
            sortData: [{ field: 'name', direction: 'asc' }, { field: 'kuerzel', direction: 'asc' },
            { field: 'numberOfClasses', direction: 'asc' }, { field: 'numberOfUsers', direction: 'asc' }],
            onSelect: (event) => { event.done(() => { that.onChangeSelection(event) }) },
            onUnSelect: (event) => { event.done(() => { that.onChangeSelection(event) }) },
            onAdd: (event) => { that.onAddSchool() },
            onChange: (event) => { that.onUpdateSchool(event) },
            onDelete: (event) => { that.onDeleteSchools(event) },
        })

        this.schoolGrid.render($tableLeft[0]);

        this.loadTablesFromSchoolObject();

        $tableRight.empty();

        $tableRight.append(jQuery(`
        <div id="jo_exportschools">
        <div>
            <a href="servlet/exportSchools?csrfToken=${csrfToken}"><b>Markierte Schulen exportieren</b></a>
        </div>
        <div style="margin-top: 10px">
            <b>Schulen importieren:</b>
            <form action="servlet/importSchools" method="POST" enctype="multipart/form-data">
                <input type="file" name="files" multiple>
                <input id="jo_upload_school_button" type="button" value="Upload">
              </form>
        </div>
        <div class="jo_importSchoolsLoggingDiv"></div>
    </div>
        `))


        jQuery('#jo_upload_school_button').on('click', () => {
            let loggingDiv = jQuery('.jo_importSchoolsLoggingDiv');
            loggingDiv.empty();
            loggingDiv.append(jQuery('<div style="color: green; font-weight: bold; margin-bottom: 5px;">Die Daten werden hochgeladen. Bitte warten...</div>'));

            let headers: { [key: string]: string; } = {};
            if (csrfToken != null) headers = { "x-token-pm": csrfToken };

            jQuery.ajax({
                url: 'servlet/importSchools',
                type: 'POST',
                data: new FormData(<HTMLFormElement>jQuery('#jo_exportschools form')[0]), // The form with the file inputs.
                processData: false,
                enctype: 'multipart/form-data',
                headers: headers,
                contentType: false,
                cache: false
            }).done(function (response: ImportSchoolsResponse) {
                console.log(response);
                let fetchLog = () => {
                    let request: GetMessagesRequest = { type: response.messageType }
                    ajax("getMessages", request, (response: GetMessagesResponse) => {
                        if (response.messages.length > 0) {
                            let done = false;
                            for (let message of response.messages) {

                                loggingDiv.append(jQuery('<div>' + message.text + "</div>"));
                                loggingDiv[0].scrollTop = loggingDiv[0].scrollHeight;
                                done = done || message.done;
                                if (message.text.indexOf("abgeschlossen!") >= 0) {
                                    that.loadTablesFromSchoolObject();
                                }
                            }
                            if (done) {
                                that.loadTablesFromSchoolObject();
                            } else {
                                setTimeout(fetchLog, 1000);
                            }

                        } else {
                            setTimeout(fetchLog, 1000);
                        }
                    })
                }

                fetchLog();

            }).fail(function () {
                console.log("An error occurred, the files couldn't be sent!");
            });
        })

    }


    onDeleteSchools(event: any) {
        if (!event.detail.force || event.isStopped) return;

        let recIds: number[] = <number[]>this.schoolGrid.getSelection();


        //@ts-ignore
        // recIds = <any>this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);

        // let selectedSchools: SchoolData[] = <SchoolData[]>this.schoolGrid.records.filter(
        //     (cd: SchoolData) => recIds.indexOf(cd.id) >= 0);

        let that = this;

        let deleteOneSchool = () => {

            if (recIds.length > 0) {
                let id = recIds.pop();
                let request: CRUDSchoolRequest = {
                    type: "delete",
                    data: null,
                    id: id,
                }

                ajax("CRUDSchool", request, (response: CRUDResponse) => {
                    this.schoolGrid.remove("" + id);
                    this.schoolGrid.refresh();
                    deleteOneSchool();
                }, () => {
                    this.schoolGrid.refresh();
                });

            }

        }

        deleteOneSchool();

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
            setTimeout(() => {                
                let index = this.schoolGrid.records.findIndex(r => r["id"] == cd.id);
                //@ts-ignore
                this.schoolGrid.scrollIntoView(index, undefined, true);
                //@ts-ignore
                this.schoolGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            }, 100);

        });
    }

    onChangeSelection(event: any) {

        let recIds: number[] = <number[]>this.schoolGrid.getSelection();
        if (recIds.length == 0) {
            return;
        }

        jQuery('#jo_exportschools a').attr('href', 'servlet/exportSchools?ids=' + recIds.join(',') + "&csrfToken=" + csrfToken);


    }


    loadTablesFromSchoolObject() {

        let userData = this.administration.userData;
        let school_id = userData.schule_id;
        if (userData.is_admin) school_id = null;

        let request: GetSchoolDataRequest = { school_id: school_id };

        ajax("getSchoolData", request, (data: GetSchoolDataResponse) => {
            this.schoolDataList = data.schoolData;
            this.schoolGrid.clear();

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



}