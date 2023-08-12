import jQuery from 'jquery';
import { MainBase } from "../MainBase.js";
import { makeDiv } from "../../tools/HtmlTools.js";
import { Workspace } from "../../workspace/Workspace.js";
import { File, Module } from "../../compiler/parser/Module.js";
import { stringToDate, dateToStringWithoutTime } from "../../tools/StringTools.js";
import { Main } from "../Main.js";

export class GradingManager {

    $gradingTab: JQuery<HTMLElement>;
    $gradingMark: JQuery<HTMLElement>;
    $gradingPoints: JQuery<HTMLElement>;
    $gradingCommentMarkdown: JQuery<HTMLElement>;

    dontFireOnChange: boolean = false;

    constructor(private main: Main, public $bottomDiv: JQuery<HTMLElement>) {
        this.$gradingTab = $bottomDiv.find('.jo_tabs>.jo_gradingTab');
    }

    initGUI() {
        let that = this;

        this.$gradingTab.empty();

        let $markColumn = makeDiv(null, "jo_grading_markcolumn");
        
        this.$gradingMark = jQuery('<input type="text" class="jo_grading_mark"></input>');
        this.$gradingPoints = jQuery('<input type="text" class="jo_grading_points"></input>');
        
        this.$gradingMark.on('input', () => {that.onChange()})
        this.$gradingPoints.on('input', () => {that.onChange()})
        
        let $l1 = makeDiv(null, "jo_grading_markdiv");
        let $l2 = makeDiv(null, "jo_grading_markdiv");
        
        $l1.append(makeDiv(null, null, "Punkte:"), this.$gradingPoints);
        $l2.append(makeDiv(null, null, "Note:", {"margin-top": "8px"}), this.$gradingMark);
        
        $markColumn.append($l1, $l2);
        
        
        this.$gradingCommentMarkdown = jQuery(`<textarea class="jo_grading_commentmarkdown" placeholder="Bemerkung..."></textarea>`);
        this.$gradingCommentMarkdown.on('input', () => {that.onChange()})

        if(!that.main.user.is_teacher){
            this.$gradingCommentMarkdown.attr('readonly', 'readonly');
            this.$gradingMark.attr('readonly', 'readonly');
            this.$gradingPoints.attr('readonly', 'readonly');
        } else {
            this.$gradingCommentMarkdown.removeAttr('readonly');
            this.$gradingMark.removeAttr('readonly');
            this.$gradingPoints.removeAttr('readonly');
        }

        this.$gradingTab.append($markColumn, this.$gradingCommentMarkdown);

    }

    setValues(ws: Workspace){
        this.dontFireOnChange = true;
        this.$gradingMark.val(ws.grade == null ? "" : ws.grade);
        this.$gradingPoints.val(ws.points == null ? "" : ws.points);
        this.$gradingCommentMarkdown.val(ws.comment == null ? "" : ws.comment);
        this.dontFireOnChange = false;
    }

    onChange(){
        if(this.dontFireOnChange) return;
        let ws = this.main.currentWorkspace;
        if(ws != null){
            ws.grade = <string>this.$gradingMark.val();
            ws.points = <string>this.$gradingPoints.val();
            ws.comment = <string>this.$gradingCommentMarkdown.val();
            ws.saved = false;
        }
    }


}