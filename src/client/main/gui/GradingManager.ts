import jQuery from 'jquery';
import { MainBase } from "../MainBase.js";
import { makeDiv } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { File, Module } from "../../compiler/parser/Module.js";
import { stringToDate, dateToStringWithoutTime } from "../../tools/StringTools.js";
import { Main } from "../Main.js";
import { PushClientManager } from '../../communication/pushclient/PushClientManager.js';

export class GradingManager {

    $gradingTab: JQuery<HTMLElement>;
    $gradingMark: JQuery<HTMLElement>;
    $gradingPoints: JQuery<HTMLElement>;
    $gradingCommentMarkdown: JQuery<HTMLElement>;
    $attendedExam: JQuery<HTMLInputElement>;

    dontFireOnChange: boolean = false;

    constructor(private main: Main, $bottomDiv: JQuery<HTMLElement>, public $tabHeading: JQuery<HTMLElement>) {
        this.$gradingTab = $bottomDiv.find('.jo_tabs>.jo_gradingTab');

        PushClientManager.getInstance().subscribe("onGradeChangedInPruefungAdministration", () => {this.setValues(this.main.currentWorkspace)})
    }

    initGUI() {
        let that = this;

        this.$gradingTab.empty();

        let $markColumn = makeDiv(null, "jo_grading_markcolumn");
        
        this.$gradingMark = jQuery('<input type="text" class="jo_grading_mark"></input>');
        this.$gradingPoints = jQuery('<input type="text" class="jo_grading_points"></input>');
        this.$attendedExam = jQuery('<input type="checkbox" class="jo_grading_attended_exam"></input>');
        
        this.$gradingMark.on('input', () => {that.onChange()})
        this.$gradingPoints.on('input', () => {that.onChange()})
        this.$attendedExam.on('input', () => {that.onChange()})
        
        let $l1 = makeDiv(null, "jo_grading_markdiv");
        let $l2 = makeDiv(null, "jo_grading_markdiv");
        let $l3 = makeDiv(null, "jo_grading_markdiv");
        
        $l1.append(makeDiv(null, null, "Punkte:"), this.$gradingPoints);
        $l2.append(makeDiv(null, null, "Note:", {"margin-top": "3px"}), this.$gradingMark);
        $l3.append(makeDiv(null, null, "Anwesend:", {"margin-top": "3px"}), this.$attendedExam);
        
        $markColumn.append($l1, $l2, $l3);
        
        
        this.$gradingCommentMarkdown = jQuery(`<textarea class="jo_grading_commentmarkdown" placeholder="Bemerkung..."></textarea>`);
        this.$gradingCommentMarkdown.on('input', () => {that.onChange()})

        if(!that.main.user.is_teacher){
            this.$gradingCommentMarkdown.attr('readonly', 'readonly');
            this.$gradingMark.attr('readonly', 'readonly');
            this.$gradingPoints.attr('readonly', 'readonly');
            $l3.css('display', 'none');
        } else {
            this.$gradingCommentMarkdown.removeAttr('readonly');
            this.$gradingMark.removeAttr('readonly');
            this.$gradingPoints.removeAttr('readonly');
            $l3.css('display', 'block');
        }

        this.$gradingTab.append($markColumn, this.$gradingCommentMarkdown);

    }

    setValues(ws: Workspace){

        if(ws == null) return;
        
        let hideGrading: boolean = false;

        if(!this.main.user.is_teacher){
            hideGrading = this.isEmptyOrNull(ws.grade) && 
                this.isEmptyOrNull(ws.points) && this.isEmptyOrNull(ws.comment) && ws.attended_exam != true;
        }  else {
            hideGrading = this.main.workspacesOwnerId == this.main.user.id;
        }

        if(hideGrading){
            this.$gradingTab.removeClass('jo_active');
        }
        this.$tabHeading.css('display', hideGrading ? 'none' : 'block');

        this.dontFireOnChange = true;
        this.$gradingMark.val(ws.grade == null ? "" : ws.grade);
        this.$gradingPoints.val(ws.points == null ? "" : ws.points);
        this.$gradingCommentMarkdown.val(ws.comment == null ? "" : ws.comment);
        this.$attendedExam.prop('checked', ws.attended_exam == true);

        this.dontFireOnChange = false;
    }

    onChange(){
        if(this.dontFireOnChange) return;
        let ws = this.main.currentWorkspace;
        if(ws != null){
            ws.grade = (<string>this.$gradingMark.val())?.trim();
            ws.points = (<string>this.$gradingPoints.val())?.trim();
            ws.comment = (<string>this.$gradingCommentMarkdown.val())?.trim();
            ws.attended_exam = this.$attendedExam.is(":checked");
            ws.saved = false;
        }
    }


    isEmptyOrNull(s: string){
        return s == null || s.trim().length == 0;
    }

}