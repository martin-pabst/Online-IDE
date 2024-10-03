import { ajaxAsync } from "../communication/AjaxHelper";
import { UserData } from "../communication/Data";
import { w2form } from "../lib/w2ui-2.0.es6";
import { Administration } from "./Administration";
import { AdminMenuItem } from "./AdminMenuItem";


type GetSchoolSettingsRequest = {school_id: number};
type GetSchoolSettingsResponse = {vidis_schulkennung: string, success: boolean, message: string};

type UpdateSchoolSettingsRequest = {school_id: number, vidis_schulkennung: string};
type UpdateSchoolSettingsResponse = {success: boolean, message: string};




export class SchoolSettings extends AdminMenuItem {

    $tableLeft: JQuery<HTMLElement>;
    form: w2form;

    constructor(administration: Administration) {
        super(administration);
    }


    getButtonIdentifier(): string {
        return "Schulweite Einstellungen"
    }

    async onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>, $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>): Promise<void> {

        let settings = await this.fetchSchoolSettings();

        if(!settings.success) return;

        this.$tableLeft = $tableLeft;
        $tableLeft.html(this.getHtml());

        let that = this;

        this.form = new w2form({
            box: '#form',
            name: 'form',
            record: {
                vidis_schulkennung: settings.vidis_schulkennung,
            },
            // formURL: 'data/form.html',    // you can load form from extenral file
            formHTML: jQuery('#form').html(), // or you can use form that is already in HTML
            fields: [
                { field: 'vidis_schulkennung', type: 'text', required: false },
            ],
            actions: {
                save() {
                    that.save()
                }
            }
        })

    }

    async fetchSchoolSettings():Promise<GetSchoolSettingsResponse>{
        
        let request: GetSchoolSettingsRequest = {school_id: this.administration.userData.schule_id}

        return await ajaxAsync("/servlet/getSchoolSettings", request);

    }

    async save(){
        let vidis_schulkennung: string = this.form.record.vidis_schulkennung;

        let request: UpdateSchoolSettingsRequest = {
            school_id: this.administration.userData.schule_id, 
            vidis_schulkennung: vidis_schulkennung
        }

        let response: UpdateSchoolSettingsResponse = await ajaxAsync("/servlet/updateSchoolSettings", request);

        if(response.success){
            this.form.message("Die Daten wurden erfolgreich gespeichert.")
        }

    }

    destroy() {
        this.$tableLeft.empty();
    }

    checkPermission(user: UserData): boolean { 
        return user.is_schooladmin;
    }



    getHtml(): string{
        return `
        <div id="form" style="width: 750px">
    <div class="w2ui-page page-0">
        <div class="w2ui-column-container">
            <div class="w2ui-column col-0">
                <div class="w2ui-field w2ui-span6">
                    <label>Vidis-Schulkennung</label>
                    <div><input id="vidis_schulkennung" name="vidis_schulkennung" class="w2ui-input" style="width: 300px" type="text" tabindex="1"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="w2ui-buttons">
        <button name="save" class="w2ui-btn w2ui-btn-blue" tabindex="5">Speichern</button>
    </div>
</div>
`
    }





}