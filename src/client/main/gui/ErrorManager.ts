import { Workspace } from "../../workspace/Workspace.js";
import { Error } from "../../compiler/lexer/Lexer.js";
import { Module } from "../../compiler/parser/Module.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";

export class ErrorManager {

    oldDecorations: string[] = [];
    oldErrorDecorations: string[] = [];
    $errorDiv: JQuery<HTMLElement>;

    $bracket_warning: JQuery<HTMLElement>;

    minimapColor: {[key: string]:string } = {};

    lightBulbOnClickFunctionList: {class: string, onClickFunction: () => void, title: string}[] = [];

    constructor(private main: MainBase, private $bottomDiv: JQuery<HTMLElement>, private $mainDiv: JQuery<HTMLElement>) {
        this.minimapColor["error"] = "#bc1616";
        this.minimapColor["warning"] = "#cca700";
        this.minimapColor["info"] = "#75beff";

        this.$bracket_warning = $mainDiv.find(".jo_parenthesis_warning");

        this.$bracket_warning.attr('title', 'Klammeralarm!');
        this.$bracket_warning.children().attr('title', 'Klammeralarm!');

        let that = this;
        $mainDiv.find(".jo_pw_undo").on("click", () => {
            let editor = that.main.getMonacoEditor();
            editor.trigger(".", "undo", {});
        }).attr('title', 'Undo');
    }

    showParenthesisWarning(error: string){
        if(error != null){
            this.$bracket_warning.css("visibility", "visible");
            this.$bracket_warning.find(".jo_pw_heading").text(error);
        } else {
            this.$bracket_warning.css("visibility", "hidden");
        }
    }

    showErrors(workspace: Workspace): Map<Module, number> {

        this.lightBulbOnClickFunctionList = [];

        let errorCountMap: Map<Module, number> = new Map();

        this.$errorDiv = this.$bottomDiv.find('.jo_tabs>.jo_errorsTab');
        this.$errorDiv.empty();

        let hasErrors = false;

        let ms = workspace.moduleStore;
        let editor: monaco.editor.IStandaloneCodeEditor = this.main.getMonacoEditor();

        for (let m of ms.getModules(false)) {
            let markers: monaco.editor.IMarkerData[] = [];
            let decorations: monaco.editor.IModelDeltaDecoration[] = [];
            let $errorList: JQuery<HTMLElement>[] = [];

            let errors = m.getSortedAndFilteredErrors();
            errorCountMap.set(m, m.getErrorCount());

            for (let error of errors) {

                let linesDecorationsClassName: string;
                let borderLeftClass: string;
                let minimapColor: string = this.minimapColor[error.level];

                switch (error.level) {
                    case "error": linesDecorationsClassName = 'jo_revealErrorLine'; borderLeftClass = "jo_borderLeftError"; break;
                    case "warning": linesDecorationsClassName = 'jo_revealWarningLine'; borderLeftClass = "jo_borderLeftWarning"; break;
                    case "info": linesDecorationsClassName = 'jo_revealInfoLine'; borderLeftClass = "jo_borderLeftInfo"; break;
                }

                if (error.quickFix != null) {
                    let quickFix = error.quickFix;
                    let lightBulbClass = "lb_" + Math.trunc(Math.random() * 1000000);
                    linesDecorationsClassName = 'jo_yellowLightBulb ' + borderLeftClass + " " + lightBulbClass;

                    this.lightBulbOnClickFunctionList.push({class: '.' + lightBulbClass, 
                    onClickFunction: () => {

                        let edits = quickFix.editsProvider(m.model.uri);
                        editor.executeEdits("", edits.map((edit) => {
                            let r = edit.edit.range;
                            return {
                                range: new monaco.Range(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn),
                                text: edit.edit.text,
                                forceMoveMarkers: true
                            }
                        }
                        ));

                    },
                    title: quickFix.title
                })


                }

                this.processError(error, m, $errorList);

                let severity: monaco.MarkerSeverity;
                switch (error.level) {
                    case "error": severity = monaco.MarkerSeverity.Error; break;
                    case "warning": severity = monaco.MarkerSeverity.Warning; break;
                    case "info": severity = monaco.MarkerSeverity.Info; break;
                }

                markers.push({
                    startLineNumber: error.position.line,
                    startColumn: error.position.column,
                    endLineNumber: error.position.line,
                    endColumn: error.position.column + error.position.length,
                    message: error.text,
                    severity: severity,
                    //@ts-ignore
                    relatedInformation: error.quickFix
                });

                decorations.push({
                    range: {
                        startLineNumber: error.position.line,
                        startColumn: error.position.column,
                        endLineNumber: error.position.line,
                        endColumn: error.position.column + error.position.length
                    },
                    options: {
                        linesDecorationsClassName: linesDecorationsClassName,
                        minimap: {
                            position: monaco.editor.MinimapPosition.Inline,
                            color: minimapColor
                        }
                    }

                });


            }

            monaco.editor.setModelMarkers(m.model, 'test', markers);
            m.oldErrorDecorations = m.model.deltaDecorations(m.oldErrorDecorations, decorations);

            // decorations used when user clicks on error in error-list:
            this.oldDecorations = this.main.getMonacoEditor().deltaDecorations(this.oldDecorations, []);


            if ($errorList.length > 0 && this.$errorDiv.length > 0) {
                hasErrors = true;
                let $file = jQuery('<div class="jo_error-filename">' + m.file.name + '&nbsp;</div>');
                this.$errorDiv.append($file);
                for (let $error of $errorList) {
                    this.$errorDiv.append($error);
                }
            }

        }

        if (!hasErrors && this.$errorDiv.length > 0) {
            this.$errorDiv.append(jQuery('<div class="jo_noErrorMessage">Keine Fehler gefunden :-)</div>'));
        }

        this.registerLightbulbOnClickFunctions();

        return errorCountMap;

    }

    registerLightbulbOnClickFunctions() {

        let that = this;
        setTimeout(() => {
            for(let locf of that.lightBulbOnClickFunctionList){
                    jQuery(locf.class).off('click', locf.onClickFunction);
                    jQuery(locf.class).on('click', locf.onClickFunction).attr('title', locf.title);
            }            
        }, 800);


    }

    processError(error: Error, m: Module, $errorDivs: JQuery<HTMLElement>[]) {

        let $div = jQuery('<div class="jo_error-line"></div>');
        let $lineColumn = jQuery('<span class="jo_error-position">[Z&nbsp;<span class="jo_linecolumn">' + error.position.line + '</span>' +
            ' Sp&nbsp;<span class="jo_linecolumn">' + error.position.column + '</span>]</span>:&nbsp;');
        let category = "";
        switch (error.level) {
            case "error": break;
            case "warning": category = '<span class="jo_warning_category">Warnung: </span>'; break;
            case "info": category = '<span class="jo_info_category">Info: </span>'; break;
        }
        let $message = jQuery('<div class="jo_error-text">' + category + error.text + "</div>");

        $div.append($lineColumn).append($message);

        let that = this;
        $div.on("mousedown", (ev) => {
            this.$errorDiv.find('.jo_error-line').removeClass('jo_active');
            $div.addClass('jo_active');
            that.showError(m, error);
        });

        $errorDivs.push($div);
    }

    showError(m: Module, error: Error) {

        if (this.main instanceof Main) {
            if (m != this.main.projectExplorer.getCurrentlyEditedModule()) {
                this.main.editor.dontDetectLastChange();
                this.main.projectExplorer.setModuleActive(m);
            }
        }
        let position = error.position;
        let range = {
            startColumn: position.column, startLineNumber: position.line,
            endColumn: position.column + position.length, endLineNumber: position.line
        };

        this.main.getMonacoEditor().revealRangeInCenter(range);

        let className: string = "";
        switch (error.level) {
            case "error": className = "jo_revealError"; break;
            case "warning": className = "jo_revealWarning"; break;
            case "info": className = "jo_revealInfo"; break;
        }


        this.oldDecorations = this.main.getMonacoEditor().deltaDecorations(this.oldDecorations, [
            {
                range: range,
                options: { className: className }

            }
        ]);


    }

}