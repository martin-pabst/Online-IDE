import { Main } from "../Main.js";
import { Module, MethodCallPosition } from "../../compiler/parser/Module.js";
import { Method } from "../../compiler/types/Types.js";
import { sign } from "crypto";
import { TextPosition } from "../../compiler/lexer/Token.js";
import { MainBase } from "../MainBase.js";
import { getTypeIdentifier } from "../../compiler/types/DeclarationHelper.js";
import { ArrayType } from "../../compiler/types/Array.js";




export class MySignatureHelpProvider implements monaco.languages.SignatureHelpProvider {

    signatureHelpTriggerCharacters?: readonly string[] = ['(', ',', ';', '<', '>', '=']; // semicolon, <, >, = for for-loop, if, while, ...
    signatureHelpRetriggerCharacters?: readonly string[] = [];

    constructor(private main: MainBase) {
    }

    provideSignatureHelp(model: monaco.editor.ITextModel, position: monaco.Position,
        token: monaco.CancellationToken,
        context: monaco.languages.SignatureHelpContext):
        monaco.languages.ProviderResult<monaco.languages.SignatureHelpResult> {

        let isConsole = (model == this.main.getBottomDiv()?.console?.editor?.getModel());

        if (!isConsole && model != this.main.getMonacoEditor().getModel()) {
            return;
        }

        let that = this;

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                if (isConsole) {
                    this.main.getBottomDiv()?.console?.compileIfDirty();
                } else {
                    this.main.compileIfDirty();
                }

                resolve(that.provideSignatureHelpLater(model, position, token, context));

            }, 300);


        });

    }

    provideSignatureHelpLater(model: monaco.editor.ITextModel, position: monaco.Position,
        token: monaco.CancellationToken,
        context: monaco.languages.SignatureHelpContext):
        monaco.languages.ProviderResult<monaco.languages.SignatureHelpResult> {

        let isConsole = (model != this.main.getMonacoEditor().getModel());

        let module: Module = isConsole ? this.main.getBottomDiv()?.console?.compiler.module :
            this.main.getCurrentWorkspace().getModuleByMonacoModel(model);

        if (module == null) {
            return null;
        }

        // let textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
        // let textAfterPosition = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber + 5, endColumn: 1 });

        let methodCallPositions = module.methodCallPositions[position.lineNumber];

        if (methodCallPositions == null) return null;

        let methodCallPosition: MethodCallPosition = null;
        let rightMostPosition: number = -1;

        for (let i = methodCallPositions.length - 1; i >= 0; i--) {
            let mcp = methodCallPositions[i];
            if (mcp.identifierPosition.column + mcp.identifierPosition.length < position.column
                && mcp.identifierPosition.column > rightMostPosition) {
                if (mcp.rightBracketPosition == null ||
                    (position.lineNumber <= mcp.rightBracketPosition.line && position.column <= mcp.rightBracketPosition.column)
                    || (position.lineNumber < mcp.rightBracketPosition.line)) {
                    methodCallPosition = mcp;
                    rightMostPosition = mcp.identifierPosition.column;
                }
            }
        }

        if (methodCallPosition == null) return null;

        return this.getSignatureHelp(methodCallPosition, position);



    }

    getSignatureHelp(methodCallPosition: MethodCallPosition,
        position: monaco.Position): monaco.languages.ProviderResult<monaco.languages.SignatureHelpResult> {

        let parameterIndex: number = 0;

        for (let cp of methodCallPosition.commaPositions) {
            if (cp.line < position.lineNumber || (cp.line == position.lineNumber && cp.column < position.column)) {
                parameterIndex++;
            }
        }

        let signatureInformationList: monaco.languages.SignatureInformation[] = [];

        if ((typeof methodCallPosition.possibleMethods) == "string") {
            signatureInformationList = signatureInformationList.concat(this.makeIntrinsicSignatureInformation(<string>methodCallPosition.possibleMethods, parameterIndex));
        } else {
            for (let method of methodCallPosition.possibleMethods) {
                let m = <Method>method;
                if (m.getParameterCount() > parameterIndex) {

                    signatureInformationList = signatureInformationList.concat(this.makeSignatureInformation(m));

                }
            }
        }

        return Promise.resolve({
            value: {
                activeParameter: parameterIndex,
                activeSignature: 0,
                signatures: signatureInformationList
            },
            dispose: () => { }
        });
    }

    makeIntrinsicSignatureInformation(method: string, parameterIndex: number): monaco.languages.SignatureInformation[] {

        switch (method) {
            case "while":
                return [
                    {
                        label: "while(Bedingung){ Anweisungen }",
                        documentation: "Wiederholung mit Anfangsbedingung (while-loop)",
                        parameters: [
                            { label: "Bedingung", documentation: "Die Bedingung wird vor jeder Wiederholung ausgewertet. Ist sie erfüllt ist (d.h. hat sie den Wert true), so werden die Anweisungen in {} erneut ausgeführt, ansonsten wird mit der nächsten Anweisung nach { } fortgefahren." },
                        ]
                    }];
            case "if":
                return [
                    {
                        label: "if(Bedingung){ Anweisungen1 } else { Anweisungen2 }",
                        documentation: "Bedingung (else... ist optional)",
                        parameters: [
                            { label: "Bedingung", documentation: "Ist die Bedingung erfüllt (d.h. hat sie den Wert true), so werden die Anweisungen1 ausgeführt. Trifft die Bedingung nicht zu (d.h. hat sie den Wert false), so werden die Anweisungen2 ausgeführt." },
                        ]
                    }];
            case "switch":
                return [
                    {
                        label: "switch(Selektor){case Wert_1: Anweisungen1; break; case Wert_2 Anweisungen2; break; default: Defaultanweisungen; break;}",
                        documentation: "Bedingung (else... ist optional)",
                        parameters: [
                            { label: "Selektor", documentation: "Der Wert des Selektor-Terms wird ausgewertet. Hat er den Wert Wert_1, so werden die Anweisungen1 ausgeführt. Hat er den Wert Wert_2, so werden die Anweisungen2 ausgeführt usw. Hat er keinen der bei case... aufgeführten Werte, so werden die Defaultanweisungen ausgeführt." },
                        ]
                    }];
            case "for":
                return [
                    {
                        label: "for(Startanweisung; Bedingung; Anweisung am Ende jeder Wiederholung){ Anweisungen }",
                        documentation: "Wiederholung mit for (for-loop)",
                        parameters: [
                            { label: "Startanweisung", documentation: "Diese Anweisung wird vor der ersten Wiederholung einmal ausgeführt." },
                            { label: "Bedingung", documentation: "Die Bedingung wird vor jeder Wiederholung ausgewertet. Ist sie erfüllt ist (d.h. hat sie den Wert true), so werden die Anweisungen in {} erneut ausgeführt, ansonsten wird mit der nächsten Anweisung nach { } fortgefahren." },
                            { label: "Anweisung am Ende jeder Wiederholung", documentation: "Diese Anweisung wird stets am Ende jeder Wiederholung ausgeführt." },
                        ]
                    }];
            case "print":
                let methods: monaco.languages.SignatureInformation[] =
                    [
                        {
                            label: "print(text: String, color: String)",
                            documentation: "Gibt Text farbig in der Ausgabe aus",
                            parameters: [
                                { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" },
                                { label: "color: String", documentation: "Farbe (englischer Name oder #ffffff oder rgb(255,255,255)) oder statisches Attribut der Klasse Color, z.B. Color.red" }
                            ]
                        },
                        {
                            label: "print(text: String, color: int)",
                            documentation: "Gibt Text farbig in der Ausgabe aus",
                            parameters: [
                                { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" },
                                { label: "color: String", documentation: "Farbe als int-Wert kodiert, z.B. 0xff00ff" },
                            ]
                        },
                        {
                            label: "print(text: String)",
                            documentation: "Gibt Text farbig in der Ausgabe aus",
                            parameters: [
                                { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" }
                            ]
                        }
                    ];
                return methods;
            case "println":

                return [
                    {
                        label: "println(text: String, color: String)",
                        documentation: "Gibt Text farbig in der Ausgabe aus. Der nächste Text landet eine Zeile tiefer.",
                        parameters: [
                            { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" },
                            { label: "color: String", documentation: "Farbe (englischer Name oder #ffffff oder rgb(255,255,255) oder statisches Attribut der Klasse Color, z.B. Color.red)" }
                        ]
                    },
                    {
                        label: "println(text: String, color: int)",
                        documentation: "Gibt Text farbig in der Ausgabe aus. Der nächste Text landet eine Zeile tiefer.",
                        parameters: [
                            { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" },
                            { label: "color: int", documentation: "Farbe als int-kodierter Wert, z.B. 0xffffff" }
                        ]
                    },
                    {
                        label: "println(text: String)",
                        documentation: "Gibt Text farbig in der Ausgabe aus. Der nächste Text landet eine Zeile tiefer.",
                        parameters: [
                            { label: "text: String", documentation: "text: Text, der ausgegeben werden soll" }
                        ]
                    },
                ];
        }

    }


    makeSignatureInformation(method: Method): monaco.languages.SignatureInformation[] {

        let label: string = "";

        if (method.getReturnType() != null && !method.isConstructor) {
            label += getTypeIdentifier(method.getReturnType()) + " ";
        }

        label += method.identifier + "(";

        let parameterInformationList: monaco.languages.ParameterInformation[] = [];

        let pl = method.getParameterList().parameters;

        for (let i = 0; i < pl.length; i++) {

            let p = pl[i];
            let posFrom = label.length;
            let type = p.type;
            if (p.isEllipsis) {
                type = (<ArrayType>type).arrayOfType;
            }

            let pLabel = getTypeIdentifier(type) + (p.isEllipsis ? "..." : "") + " " + p.identifier;
            label += pLabel;
            let posTo = label.length;

            if (i < pl.length - 1) {
                label += ", ";
            }

            let pi: monaco.languages.ParameterInformation = {
                label: [posFrom, posTo],
                documentation: "" //Test: Parameter documentation"
            };

            parameterInformationList.push(pi);

        }



        label += ")";

        return [{
            label: label,
            parameters: parameterInformationList,
            documentation: method.documentation == null ? "" : method.documentation
        }]

    }

}
