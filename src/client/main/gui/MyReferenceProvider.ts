import { Module } from "../../compiler/parser/Module.js";
import { Editor } from "./Editor.js";
import { MainBase } from "../MainBase.js";

export class MyReferenceProvider implements monaco.languages.ReferenceProvider {

    constructor(private main: MainBase) {

    }

    provideReferences(model: monaco.editor.ITextModel, position: monaco.Position, context: monaco.languages.ReferenceContext, token: monaco.CancellationToken):
        monaco.languages.ProviderResult<monaco.languages.Location[]> {

        let module: Module = this.main.getCurrentWorkspace().getModuleByMonacoModel(model);

        if (module == null) return null;

        let element = module.getElementAtPosition(position.lineNumber, position.column);
        if (element == null) {
            return;
        }

        let usagePositions = element.usagePositions;

        //06.06.2020
        let referencePositions: monaco.languages.Location[] = [];

        usagePositions.forEach((upInCurrentModule, module) => {
            if (upInCurrentModule != null) {
                for (let up of upInCurrentModule) {
                    referencePositions.push(
                        {
                            uri: module.uri,
                            range: { startColumn: up.column, startLineNumber: up.line, endLineNumber: up.line, endColumn: up.column + up.length }
                        });
                }
            }

        });

        return referencePositions;

    }


}


