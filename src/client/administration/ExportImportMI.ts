import { AdminMenuItem } from "./AdminMenuItem.js";
import { UserData, CRUDUserRequest, CRUDSchoolRequest, CRUDResponse, SchoolData, GetSchoolDataRequest, GetSchoolDataResponse } from "../communication/Data.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";

declare var w2prompt: any;
declare var w2alert: any;

export class ExportImportMI extends AdminMenuItem {

    schoolGridName = "schoolsGridForImport";

    schoolGrid: W2UI.W2Grid;

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

        if (this.schoolGrid != null) {
            this.schoolGrid.render();
        } else {
            $tableLeft.w2grid({
                name: this.schoolGridName,
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
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'kuerzel', caption: 'Kürzel', size: '10%', sortable: true, resizable: true, editable: { type: 'text', maxlength: "10" } },
                    { field: 'numberOfClasses', caption: 'Klassen', size: '30%', sortable: true, resizable: true },
                    { field: 'numberOfUsers', caption: 'User', size: '30%', sortable: true, resizable: true },
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
                onDelete: (event) => { that.onDeleteSchool(event) },
            })

            this.schoolGrid = w2ui[this.schoolGridName];

        }


        this.loadTablesFromSchoolObject();

        $tableRight.empty();

        $tableRight.append(jQuery(`
        <div id="jo_exportschools">
        <div>
            <a href="exportSchools"><b>Markierte Schulen exportieren</b></a>
        </div>
        <div style="margin-top: 10px">
            <b>Schulen importieren:</b>
            <form action="importSchools" method="POST" enctype="multipart/form-data">
                <input type="file" name="files" multiple>
                <input id="jo_upload_school_button" type="button" value="Upload">
              </form>
        </div>
    </div>
        `))


        jQuery('#jo_upload_school_button').on('click', () => {
            jQuery.ajax({
                url: 'importSchools', 
                type: 'POST',
                data: new FormData(<HTMLFormElement>jQuery('#jo_exportschools form')[0]), // The form with the file inputs.
                processData: false,
                contentType: false                    // Using FormData, no need to process data.
              }).done(function(response){
                console.log(response);
                console.log("Success: Files sent!");
              }).fail(function(){
                console.log("An error occurred, the files couldn't be sent!");
              });
        })

    }


    onDeleteSchool(event: any) {
        if (!event.force || event.isStopped) return;

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

        let data: SchoolData = <SchoolData>this.schoolGrid.records[event.index];
        let field = this.schoolGrid.columns[event.column]["field"];
        data[field] = event.value_new;

        let request: CRUDSchoolRequest = {
            type: "update",
            data: data,
        }

        ajax("CRUDSchool", request, (response: CRUDResponse) => {
            // console.log(data);
            delete data["w2ui"]["changes"];
            this.schoolGrid.refreshCell(data["recid"], field);
        }, () => {  
            data[field] = event.value_original;
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

    onChangeSelection(event: any) {

        let recIds: number[] = <number[]>this.schoolGrid.getSelection();
        if (recIds.length == 0){
            return;
        } 

        jQuery('#jo_exportschools a').attr('href', 'exportSchools?ids=' + recIds.join(','));


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