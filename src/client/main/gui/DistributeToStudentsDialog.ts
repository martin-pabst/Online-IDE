import { ClassData, UserData } from "../../communication/Data.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../Main.js";
import jQuery from "jquery";

export class DistributeToStudentsDialog {

    $dialog: JQuery<HTMLElement>;
    $dialogMain: JQuery<HTMLElement>;
    studentCount: number = 0;

    constructor(private classes: ClassData[], private workspace: Workspace, private main: Main){
        this.init();
    }

    private init() {
        this.$dialog = jQuery('#dialog');
        jQuery('#main').css('visibility', 'hidden');
        this.$dialog.append(jQuery(
            `<div class="jo_ds_heading">Austeilen eines Workspace an einzelne Schüler/innen</div>
             <div class="jo_ds_settings">
                <div class="jo_ds_settings_caption">Workspace:</div><div class="jo_ds_workspacename">${this.workspace.name}</div>
                <div class="jo_ds_settings_caption">Liste filtern:</div><div class="jo_ds_filterdiv"><input class="dialog-input"></input></div>
             </div>
             <div class="jo_ds_student_list jo_scrollable">
             </div>
             <div class="jo_ds_selected_message"></div>
             <div class="dialog-buttonRow jo_ds_buttonRow">
                <button id="jo_ds_cancel_button">Abbrechen</button>
                <button id="jo_ds_distribute_button">Austeilen</button>
             </div>
            `
        ));

        let $studentList = jQuery('.jo_ds_student_list');
        let that = this;

        for(let klass of this.classes){
            for(let student of klass.students){
                let $studentLine = jQuery('<div class="jo_ds_student_line">');
                let $studentClass = jQuery(`<div class="jo_ds_student_class">${klass.name}</div>`);                
                let $studentName = jQuery(`<div class="jo_ds_student_name">${student.rufname} ${student.familienname}</div>`);
                $studentLine.append($studentClass, $studentName);
                $studentList.append($studentLine);
                $studentLine.on('mousedown', () => {
                    $studentLine.toggleClass('jo_active');
                     that.studentCount += $studentLine.hasClass('jo_active') ? 1 : -1;
                     jQuery('.jo_ds_selected_message').text(`${that.studentCount} Schüler/inn/en selektiert`);
                });
                $studentLine.data('student', student);
                $studentLine.data('klass', klass);
            }
        }

        jQuery('.jo_ds_filterdiv>input').on('input', () => {
            let filterText = <string>jQuery('.jo_ds_filterdiv>input').val();
            
            if(filterText == null || filterText == ""){
                jQuery('.jo_ds_student_line').show();
            } else {
                let filterTextLowerCase = filterText.toLocaleLowerCase();
                jQuery('.jo_ds_student_line').each((index, element) => {
                    let $element = jQuery(element);
                    let klass:ClassData = $element.data('klass');
                    let student: UserData = $element.data('student');
                    let text = klass.name + " " + student.rufname + " " + student.familienname;
                    if(text.toLocaleLowerCase().indexOf(filterTextLowerCase) >= 0){
                        $element.show();
                    } else {
                        $element.hide();
                    }
                });

            }
            
        });

        
        this.$dialogMain = this.$dialog.find('.dialog-main');
        this.$dialog.css('visibility', 'visible');
        
        jQuery('#jo_ds_cancel_button').on('click', () => { window.history.back(); });
        jQuery('#jo_ds_distribute_button').on('click', () => {that.distributeWorkspace();});
        
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.close();
        });
        
        (<HTMLInputElement>jQuery('.jo_ds_filterdiv>input')[0]).focus();

    }

    distributeWorkspace() {

        let student_ids: number[] = [];
        jQuery('.jo_ds_student_line').each((index, element) => {
            let $element = jQuery(element);
            if($element.hasClass('jo_active')){
                let student: UserData = $element.data('student');
                student_ids.push(student.id);
            }
        });

        window.history.back();

        this.main.networkManager.sendDistributeWorkspace(this.workspace, null, student_ids, (error: string) => {
            if (error == null) {
                let networkManager = this.main.networkManager;
                let dt = networkManager.updateFrequencyInSeconds;
                alert(`Der Workspace ${this.workspace.name} wurde an ${student_ids.length} Schüler/innen ausgeteilt. Er wird in maximal ${dt} s bei jedem Schüler ankommen.`);
            } else {
                alert(error);
            }
        });

    }


    close() {
        this.$dialog.css('visibility', 'hidden');
        this.$dialog.empty();
        jQuery('#main').css('visibility', 'visible');
    }


}