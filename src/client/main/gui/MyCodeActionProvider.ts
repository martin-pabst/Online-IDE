import { QuickFix } from "../../compiler/lexer/Lexer.js";
import { MainBase } from "../MainBase.js";

export class MyCodeActionProvider implements monaco.languages.CodeActionProvider {

    constructor(private main: MainBase) {

    }

    provideCodeActions(model: monaco.editor.ITextModel, range: monaco.Range, context: monaco.languages.CodeActionContext, token: monaco.CancellationToken): monaco.languages.CodeActionList | Promise<monaco.languages.CodeActionList> {
        const actions = context.markers.map(error => {
            let quickFix: QuickFix = <any>error.relatedInformation;
            if (quickFix == null) return null;

            let codeAction: monaco.languages.CodeAction = {
                title: quickFix.title,
                diagnostics: [error],
                kind: "quickfix",
                edit: {
                    edits: quickFix.editsProvider(model.uri)
                },
                isPreferred: true
            };
            return codeAction;
        });
        return {
            actions: actions,
            dispose: () => { }
        }

    }

}