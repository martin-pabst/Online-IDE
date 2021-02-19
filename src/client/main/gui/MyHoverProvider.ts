import { Editor } from "./Editor.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass, Interface } from "../../compiler/types/Class.js";
import { Method, Attribute, PrimitiveType } from "../../compiler/types/Types.js";
import { getDeclarationAsString, getGenericParameterDefinition } from "../../compiler/types/DeclarationHelper.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";



export class MyHoverProvider {

    private static keywordDescriptions: { [keyword: string]: string } = {
        "print": "Die Anweisung ```print``` gibt eine Zeichenkette aus.",
        "new": "Das Schlüsselwort ```new``` bewirkt die Instanzierung (\"Erschaffung\") eines neuen Objektes einer Klasse.",
        "println": "Die Anweisung ```println``` gibt eine Zeichenkette gefolgt von einem Zeilenumbruch aus.",
        "while": "```\nwhile (Bedingung) {Anweisungen}\n```  \nbewirkt die Wiederholung der Anweisungen solange ```Bedingung == true``` ist.",
        "for": "```\nfor(Startanweisung;Solange-Bedingung;Nach_jeder_Wiederholung){Anweisungen}\n```  \n"
            + "führt zunächst die Startanweisung aus und wiederholt dann die Anweisungen solange ```Bedingung == true``` ist. Am Ende jeder wiederholung wird Nach_jeder_Wiederholung ausgeführt.",
        "if": "```\nif(Bedingung){Anweisungen_1} else {Anweisungen_2}\n```  \nwertet die Bedingung aus und führt Anweisungen_1 nur dann aus, wenn die Bedingung ```true``` ergibt, Anweisungen_2 nur dann, wenn die Bedingung ```false``` ergibt.  \nDer ```else```-Teil kann auch weggelassen werden.",
        "else": "```\nif(Bedingung){Anweisungen_1} else {Anweisungen_2}\n```  \nwertet die Bedingung aus und führt Anweisungen_1 nur dann aus, wenn die Bedingung ```true``` ergibt, Anweisungen_2 nur dann, wenn die Bedingung ```false``` ergibt.",
        "switch": "```\nswitch(Selektor){ case Wert_1: Anweisungen_1; break; case Wert_2: Anweisungen_2; break; default: Default-Anweisungen } \n```  \nwertet den Selektor-Term aus und führt abhängig vom Termwert Anweisungen_1, Anweisungen_2, ... aus. Entspricht der Termwert keinem der Werte Wert_1, Wert_2, ..., so werden die Default-Anweisungen ausgeführt.",
        "%": "```\na % b\n```  \n (sprich: 'a modulo b') berechnet den **Rest** der ganzzahligen Division a/b.",
        "==": "```\na == b\n```  \nergibt genau dann ```true```, wenn ```a``` und ```b``` gleich sind.  \nSind a und b **Objekte**, so ergibt ```a == b``` nur dann ```true```, wenn ```a``` und ```b``` auf das **identische** Objekt zeigen.  \n```==``` nennt man **Vergleichsoperator**.",
        "<=": "```\na <= b\n```  \nergibt genau dann ```true```, wenn der Wert von ```a``` kleiner oder gleich dem Wert von ```b``` ist.",
        ">=": "```\na <= b\n```  \nergibt genau dann ```true```, wenn der Wert von ```a``` größer oder gleich dem Wert von ```b``` ist.",
        "!=": "```\na != b\n```  \nergibt genau dann ```true```, wenn ```a``` und ```b``` **un**gleich sind.  \nSind ```a``` und ```b``` **Objekte**, so ergibt ```a != b``` dann ```true```, wenn ```a``` und ```b``` **nicht** auf das **identische** Objekt zeigen.  \n```!=``` nennt man **Ungleich-Operator**.",
        "+=": "```\na += b\n(Kurzschreibweise für a = a + b)\n```  \nbewirkt, dass der Wert von ```a``` um den Wert von ```b``` **erhöht** wird. Das Ergebnis wird in die Variable ```a``` geschrieben.",
        "-=": "```\na -= b\n(Kurzschreibweise für a = a - b)\n```  \nbewirkt, dass der Wert von ```a``` um den Wert von ```b``` **erniedrigt** wird. Das Ergebnis wird in die Variable ```a``` geschrieben.",
        "*=": "```\na *= b\n(Kurzschreibweise für a = a * b)\n```  \nbewirkt, dass der Wert von ```a``` mit dem Wert von ```b``` **multipliziert** wird. Das Ergebnis wird in die Variable ```a``` geschrieben.",
        "/=": "```\na /= b\n(Kurzschreibweise für a = a / b)\n```  \nbewirkt, dass der Wert von ```a``` durch den Wert von ```b``` **dividiert** wird. Das Ergebnis wird in die Variable ```a``` geschrieben.",
        "++": "```\na++\n(Kurzschreibweise für a = a + 1)\n```  \nbewirkt, dass der Wert von ```a``` um eins erhöht wird.",
        "--": "```\na--\n(Kurzschreibweise für a = a - 1)\n```  \nbewirkt, dass der Wert von ```a``` um eins eniedrigt wird.",
        "=": "```\na = Term\n```  \nberechnet den Wert des Terms und weist ihn der Variablen ```a``` zu.  \n**Vorsicht:**  \nVerwechsle ```=```(**Zuweisungsoperator**) nicht mit ```==```(**Vergleichsoperator**)!",
        "!": "```\n!a\n```  \nergibt genau dann ```true```, wenn ```a``` ```false``` ergibt.  \n```!``` spricht man '**nicht**'.",
        "public": "```\npublic\n```  \nAttribute und Methoden, die als ```public``` deklariert werden, sind überall (auch außerhalb der Klasse) sichtbar.",
        "private": "```\nprivate\n```  \nAttribute und Methoden, die als ```private``` deklariert werden, sind nur innerhalb von Methoden derselben Klasse sichtbar.",
        "protected": "```\nprotected\n```  \nAttribute und Methoden, die als ```protected``` deklariert werden, sind nur innerhalb von Methoden derselben Klasse oder innerhalb von Methoden von Kindklassen sichtbar.",
        "return": "```\nreturn Term\n```  \nbewirkt, dass die Methode verlassen wird und der Wert des Terms an die aufrufende Stelle zurückgegeben wird.",
        "break": "```\nbreak;\n```  \ninnerhalb einer Schleife bewirkt, dass die Schleife sofort verlassen und mit den Anweisungen nach der Schleife fortgefahren wird.  \n"+
        "```break``` innerhalb einer ```switch```-Anweisung bewirkt, dass der Block der ```switch```-Anweisung verlassen wird.",

    }

    constructor(private editor: Editor) {

    }

    provideHover(model: monaco.editor.ITextModel, position: monaco.Position, token: monaco.CancellationToken):
        monaco.languages.ProviderResult<monaco.languages.Hover> {

        let selection: monaco.Selection = this.editor.editor.getSelection();
        
        // if cursor is inside current selection then don't show hover, because editor.onDidChangeCursorPosition evaluates selected Text 
        // (see class Editor).
        if(selection != null){
            if(selection.startLineNumber != selection.endLineNumber || selection.startColumn != selection.endColumn){
                if(
                    (selection.startLineNumber < position.lineNumber || selection.startLineNumber == position.lineNumber && selection.startColumn <= position.column) && 
                    (selection.endLineNumber > position.lineNumber || selection.endLineNumber == position.lineNumber && selection.endColumn >= position.column) 
                ){
                    return;
                }
            }
        }

        let module: Module = this.editor.main.getCurrentWorkspace()?.getModuleByMonacoModel(model);

        if (module == null) {
            return null;
        }

        for(let errorList of module.errors){
            for(let error of errorList){
                if(error.position.line == position.lineNumber && 
                    error.position.column <= position.column && 
                    error.position.column + error.position.length >= position.column){
                        return null; // Show error-tooltip and don't show hover-tooltip
                    }
            }
        }

        let element = module.getElementAtPosition(position.lineNumber, position.column);

        let declarationAsString = "";

        if (element != null) {
            if (element instanceof Klass || element instanceof Method || element instanceof Interface
                || element instanceof Attribute) {
                declarationAsString = getDeclarationAsString(element);
            } else if (element instanceof PrimitiveType) {
                declarationAsString = "```\n" + element.identifier + "\n```  \nprimitiver Datentyp: " + element.description + "";
                return {
                    range: null,
                    contents: [{ value: declarationAsString }],
                }
            } else {
                // Variable
                let typeIdentifier: string = element?.type?.identifier;
                if(element?.type instanceof Klass || element?.type instanceof Interface){
                    typeIdentifier += " " + getGenericParameterDefinition(element.type);
                }

                if (typeIdentifier == null) {
                    typeIdentifier = "";
                } else {
                    typeIdentifier += " ";
                }

                declarationAsString = typeIdentifier + element?.identifier;
            }
        } else {
            let word = this.getWordUnderCursor(model, position);
            let desc = MyHoverProvider.keywordDescriptions[word];
            if (desc != null) {
                return {
                    range: null,
                    contents: [{ value: desc }],
                }
            }
        }

        let state = this.editor.main.getInterpreter().state;

        let value: string = null;

        if (state == InterpreterState.paused) {
            let evaluator = this.editor.main.getCurrentWorkspace().evaluator;

            let identifier: string = this.widenDeclaration(model, position, element?.identifier);

            if(identifier == null){
                return null;
            }

            let result = evaluator.evaluate(identifier);
            if (result.error == null && result.value != null) {
                value = result.value.type.debugOutput(result.value);
                declarationAsString = identifier;
            }

        }

        let contents = [];

        if (value == null && declarationAsString.length == 0) {
            return null;
        }

        if (value != null) {
            if (value.length + declarationAsString.length > 40) {
                contents.push({ value: '```\n' + declarationAsString + ' ==\n```' });
                contents.push({ value: '```\n' + value.replace(/&nbsp;/g, " ") + '\n```' });
            } else {
                contents.push({ value: '```\n' + declarationAsString + " == " + value.replace(/&nbsp;/g, " ") + '\n```' });
            }
        } else {
            contents.push({ value: '```\n' + declarationAsString + '\n```' });
        }

        let range = null;

        return {
            range: range,
            contents: contents,
        }

    }

    getWordUnderCursor(model: monaco.editor.ITextModel, position: monaco.Position)
         : string {
        
        let pos = model.getValueLengthInRange({
            startColumn: 0,
            startLineNumber: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        let text = model.getValue();

        let word = "";

        let end = pos;
        while (end < text.length && this.isInsideIdentifierOrArrayDescriptor(text.charAt(end))) {
            end++;
        }

        let begin = pos;
        while (begin > 0 && this.isInsideIdentifierOrArrayDescriptor(text.charAt(begin - 1))) {
            begin--;
        }

        if (end - begin > 1) {
            word = text.substring(begin, end);
        } else {
            end = pos;
            while (end < text.length && this.isInsideOperator(text.charAt(end))) {
                end++;
            }
    
            begin = pos;
            while (begin > 0 && this.isInsideOperator(text.charAt(begin - 1))) {
                begin--;
            }
    
            if (end - begin > 0) {
                word = text.substring(begin, end);
            }
        }

        return word;

    }

    widenDeclaration(model: monaco.editor.ITextModel, position: monaco.Position,
        identifier: string): string {

        let pos = model.getValueLengthInRange({
            startColumn: 0,
            startLineNumber: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        let text = model.getValue();

        let end = pos;
        while (end < text.length && this.isInsideIdentifierOrArrayDescriptor(text.charAt(end))) {
            end++;
        }

        let begin = pos;
        while (begin > 0 && this.isInsideIdentifierChain(text.charAt(begin - 1))) {
            begin--;
        }

        let lenght: number = identifier?.length == null ? 1 : identifier.length;

        if (end - begin > length) {
            return text.substring(begin, end);
        }

        return identifier;
    }

    isInsideIdentifierChain(t: string) {

        return t.toLocaleLowerCase().match(/[a-z0-9äöüß_\[\]\.]/i);

    }

    isInsideOperator(t: string) {

        return t.toLocaleLowerCase().match(/[!%<>=\+\-\*\/]/i);

    }

    isInsideIdentifierOrArrayDescriptor(t: string) {

        return t.toLocaleLowerCase().match(/[a-z0-9äöüß\[\]]/i);

    }


}