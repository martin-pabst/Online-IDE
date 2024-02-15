import { Editor } from "./Editor.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass, getVisibilityUpTo, Interface, Visibility, StaticClass } from "../../compiler/types/Class.js";
import { SymbolTable } from "../../compiler/parser/SymbolTable.js";
import { Main } from "../Main.js";
import { Method } from "../../compiler/types/Types.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { MainBase } from "../MainBase.js";
import { TokenType } from "../../compiler/lexer/Token.js";

export class MyCompletionItemProvider implements monaco.languages.CompletionItemProvider {

    isConsole: boolean;

    public triggerCharacters: string[] = ['.', 'abcdefghijklmnopqrstuvwxyzäöüß_ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ', ' '];

    constructor(private main: MainBase) {
    }

    first: boolean = true;
    provideCompletionItems(model: monaco.editor.ITextModel, position: monaco.Position, context: monaco.languages.CompletionContext, token: monaco.CancellationToken): monaco.languages.ProviderResult<monaco.languages.CompletionList> {

        setTimeout(() => {
            //@ts-ignore
            let sw = this.main.getMonacoEditor()._contentWidgets["editor.widget.suggestWidget"]?.widget;
            if (sw != null && sw._widget != null && this.first) {
                sw._widget.toggleDetails();
                this.first = false;
            }
            // sw.toggleSuggestionDetails();
            // this.main.monaco.trigger('keyboard', 'editor.action.toggleSuggestionDetails', {});
            // this.main.monaco.trigger('keyboard', 'editor.action.triggerSuggest', {});
            // this.main.monaco.trigger(monaco.KeyMod.CtrlCmd + monaco.KeyCode.Space, 'type', {});
        }, 300);

        let consoleModel = this.main.getBottomDiv()?.console?.editor?.getModel();
        this.isConsole = model == consoleModel;

        let isMainWindow = model == this.main.getMonacoEditor().getModel();

        if (!(this.isConsole || isMainWindow)) return;

        let module: Module = this.isConsole ? this.main.getBottomDiv()?.console?.compiler.module :
            this.main.getCurrentWorkspace().getModuleByMonacoModel(model);

        if (module == null) {
            return null;
        }

        if (this.isStringLiteral(module, position)) return null;

        let textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
        let textAfterPosition = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber + 5, endColumn: 1 });

        if (context.triggerCharacter == " ") {
            let newMatch = textUntilPosition.match(/.*(new )$/);
            if (newMatch != null) {
                return this.getCompletionItemsAfterNew(module);
            }
            let classMatch = textUntilPosition.match(/.*(class )[\wöäüÖÄÜß<> ,]*[\wöäüÖÄÜß<> ] $/);
            if (classMatch != null) {

                let classIndex = textUntilPosition.lastIndexOf('class');
                let countLower = 0;
                let countGreater = 0;
                for (let i = classIndex; i < textUntilPosition.length; i++) {
                    let c = textUntilPosition.charAt(i);
                    switch (c) {
                        case '<': countLower++; break;
                        case '>': countGreater++; break;
                    }
                }

                return this.getCompletionItemsAfterClass(module, countLower > countGreater, textAfterPosition);
            }
            return null;
        }

        let ibMatch = textAfterPosition.match(/^([\wöäüÖÄÜß]*\(?)/);
        let identifierAndBracketAfterCursor = "";
        if (ibMatch != null && ibMatch.length > 0) {
            identifierAndBracketAfterCursor = ibMatch[0];
        }

        let leftBracketAlreadyThere = identifierAndBracketAfterCursor.endsWith("(");

        // First guess:  dot followed by part of Identifier?
        let dotMatch = textUntilPosition.match(/.*(\.)([\wöäüÖÄÜß]*)$/);
        if (dotMatch != null) {
            if (this.isConsole) {
                this.main.getBottomDiv()?.console?.compileIfDirty();
            } else {
                this.main.compileIfDirty();
            }
        }

        let symbolTable = this.isConsole ? this.main.getDebugger().lastSymboltable : module.findSymbolTableAtPosition(position.lineNumber, position.column);
        let classContext = symbolTable == null ? null : symbolTable.classContext;


        if (dotMatch != null) {
            return this.getCompletionItemsAfterDot(dotMatch, position, module,
                identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere);
        }

        let varOrClassMatch = textUntilPosition.match(/.*[^\wöäüÖÄÜß]([\wöäüÖÄÜß]*)$/);

        if (varOrClassMatch == null) {
            varOrClassMatch = textUntilPosition.match(/^([\wöäüÖÄÜß]*)$/);
        }

        if (varOrClassMatch != null) {

            return this.getCompletionItemsInsideIdentifier(varOrClassMatch, position, module,
                identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere, symbolTable);

        }


    }

    isStringLiteral(module: Module, position: monaco.Position) {

        let tokenList = module.tokenList;
        if (tokenList == null || tokenList.length == 0) return false;

        let posMin = 0;
        let posMax = tokenList.length - 1;
        let pos: number;

        let watchDog = 1000;

        while (true) {
            let posOld = pos;
            pos = Math.round((posMax + posMin) / 2);

            if (posOld == pos) return false;

            watchDog--;
            if (watchDog == 0) return false;

            let t = tokenList[pos];
            let p = t.position;

            if (p.line < position.lineNumber || p.line == position.lineNumber && p.column + p.length < position.column) {
                posMin = pos;
                continue;
            }

            if (p.line > position.lineNumber || p.line == position.lineNumber && p.column > position.column) {
                posMax = pos;
                continue;
            }

            return t.tt == TokenType.stringConstant;

        }

    }

    getCompletionItemsAfterNew(module: Module): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        let completionItems: monaco.languages.CompletionItem[] = [];

        completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, undefined));

        for (let i = 0; i < completionItems.length; i++) {
            let item = completionItems[i];
            if (item.detail.match('Primitiv')) {
                completionItems.splice(i, 1);
                i--;
                continue;
            }
            if (item["generic"]) {
                item.insertText += "<>($0)";
            } else {
                item.insertText += "($0)";
            }
            item.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            item.command = {
                id: "editor.action.triggerParameterHints",
                title: '123',
                arguments: []
            };

        }

        return Promise.resolve({
            suggestions: completionItems
        });
    }

    getCompletionItemsAfterClass(module: Module, insideGenericParameterDefinition: boolean, textAfterPosition: string): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        let completionItems: monaco.languages.CompletionItem[] = [];

        let startsWithCurlyBrace: boolean = textAfterPosition.trimLeft().startsWith("{");

        completionItems = completionItems.concat([
            {
                label: "extends",
                insertText: "extends $1" + (insideGenericParameterDefinition || startsWithCurlyBrace ? "" : " {\n\t$0\n}"),
                detail: "extends-Operator",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined,
                command: {
                    id: "editor.action.triggerSuggest",
                    title: '123',
                    arguments: []
                }
            },
            {
                label: "implements",
                insertText: "implements $1" + (insideGenericParameterDefinition || startsWithCurlyBrace ? "" : " {\n\t$0\n}"),
                detail: "implements-Operator",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined,
                command: {
                    id: "editor.action.triggerSuggest",
                    title: '123',
                    arguments: []
                }
            },
            {
                label: "{}",
                insertText: "{\n\t$0\n}",
                detail: "Klassenrumpf",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined
            },
        ]);

        // completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, undefined));

        return Promise.resolve({
            suggestions: completionItems
        });
    }

    getCompletionItemsInsideIdentifier(varOrClassMatch: RegExpMatchArray, position: monaco.Position, module: Module, identifierAndBracketAfterCursor: string, classContext: Klass | StaticClass,
        leftBracketAlreadyThere: boolean, symbolTable: SymbolTable): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        let text = varOrClassMatch[1];

        let rangeToReplace: monaco.IRange =
        {
            startLineNumber: position.lineNumber, startColumn: position.column - text.length,
            endLineNumber: position.lineNumber, endColumn: position.column + identifierAndBracketAfterCursor.length
        }



        let completionItems: monaco.languages.CompletionItem[] = [];

        if (symbolTable?.classContext != null && symbolTable?.method == null && symbolTable.classContext instanceof Klass) {
            completionItems = completionItems.concat(this.getOverridableMethodsCompletion(symbolTable.classContext));
        }

        if (symbolTable != null) {
            completionItems = completionItems.concat(symbolTable.getLocalVariableCompletionItems(rangeToReplace).map(ci => {
                ci.sortText = "aaa" + ci.label;
                return ci;
            }));
        }

        completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, rangeToReplace));

        if (classContext != null && symbolTable?.method != null) {
            completionItems = completionItems.concat(
                classContext.getCompletionItems(Visibility.private, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace, symbolTable.method)
                    .map(ci => {
                        ci.sortText = "aa" + ci.label;
                        return ci;
                    })
            );
            completionItems.push(
                {
                    label: "super",
                    filterText: "super",
                    insertText: "super.",
                    detail: "Aufruf einer Methode einer Basisklasse",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined,
                    command: {
                        id: "editor.action.triggerSuggest",
                        title: '123',
                        arguments: []
                    }    
                }
            )
        } else {
            // Use filename to generate completion-item for class ... ?
            let name = module.file?.name;
            if (name != null) {
                if (name.endsWith(".java")) name = name.substr(0, name.indexOf(".java"));
                let m = name.match(/([\wöäüÖÄÜß]*)$/);
                if (module.classDefinitionsAST.length == 0 && m != null && m.length > 0 && m[0] == name && name.length > 0) {
                    name = name.charAt(0).toUpperCase() + name.substring(1);
                    completionItems.push({
                        label: "class " + name,
                        filterText: "class",
                        insertText: "class ${1:" + name + "} {\n\t$0\n}\n",
                        detail: "Definition der Klasse " + name,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    },
                    )
                }
            }
        }

        completionItems = completionItems.concat(this.getKeywordCompletion(symbolTable));


        // console.log("Complete variable/Class/Keyword " + text);

        return Promise.resolve({
            suggestions: completionItems
        });
    }

    getCompletionItemsAfterDot(dotMatch: RegExpMatchArray, position: monaco.Position, module: Module,
        identifierAndBracketAfterCursor: string, classContext: Klass | StaticClass,
        leftBracketAlreadyThere: boolean): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        let textAfterDot = dotMatch[2];
        let dotColumn = position.column - textAfterDot.length - 1;
        let tStatic = module.getTypeAtPosition(position.lineNumber, dotColumn);
        let rangeToReplace: monaco.IRange =
        {
            startLineNumber: position.lineNumber, startColumn: position.column - textAfterDot.length,
            endLineNumber: position.lineNumber, endColumn: position.column + identifierAndBracketAfterCursor.length
        }

        if (tStatic == null) return null;

        let { type, isStatic } = tStatic;


        // console.log("Complete element.praefix; praefix: " + textAfterDot + ", Type: " + (type == null ? null : type.identifier));


        if (type instanceof Klass) {

            let visibilityUpTo = getVisibilityUpTo(type, classContext);

            if (isStatic) {
                return Promise.resolve({
                    suggestions: type.staticClass.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere,
                        identifierAndBracketAfterCursor, rangeToReplace)
                });
            } else {
                return Promise.resolve({
                    suggestions: type.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere,
                        identifierAndBracketAfterCursor, rangeToReplace, null)
                });
            }
        }

        if (type instanceof Interface) {
            return Promise.resolve({
                suggestions: type.getCompletionItems(leftBracketAlreadyThere,
                    identifierAndBracketAfterCursor, rangeToReplace)
            });
        }

        if (type instanceof ArrayType) {
            return Promise.resolve({
                suggestions: [
                    {
                        label: "length",
                        filterText: "length",
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: "length",
                        range: rangeToReplace,
                        documentation: {
                            value: "Anzahl der Elemente des Arrays"
                        }
                    }
                ]
            });
        }

        return null;
    }

    getKeywordCompletion(symbolTable: SymbolTable): monaco.languages.CompletionItem[] {
        let keywordCompletionItems: monaco.languages.CompletionItem[] = [];
        if (!this.isConsole && (symbolTable?.classContext == null || symbolTable?.method != null))
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "while(Bedingung){Anweisungen}",
                    detail: "while-Wiederholung",
                    filterText: 'while',
                    // insertText: "while(${1:Bedingung}){\n\t$0\n}",
                    insertText: "while($1){\n\t$0\n}",
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "for(){}",
                    // insertText: "for(${1:Startanweisung};${2:Solange-Bedingung};${3:Nach_jeder_Wiederholung}){\n\t${0:Anweisungen}\n}",
                    insertText: "for( $1 ; $2 ; $3 ){\n\t$0\n}",
                    detail: "for-Wiederholung",
                    filterText: 'for',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },    
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "for(int i = 0; i < 10; i++){}",
                    // insertText: "for(${1:Startanweisung};${2:Solange-Bedingung};${3:Nach_jeder_Wiederholung}){\n\t${0:Anweisungen}\n}",
                    insertText: "for(int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++){\n\t$0\n}",
                    detail: "Zähl-Wiederholung",
                    filterText: 'for',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },    
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "switch(){case...}",
                    // insertText: "switch(${1:Selektor}){\n\tcase ${2:Wert_1}: {\n\t\t ${3:Anweisungen}\n\t\t}\n\tcase ${4:Wert_2}: {\n\t\t ${0:Anweisungen}\n\t\t}\n}",
                    insertText: "switch($1){\n\tcase $2:\n\t\t $3\n\t\tbreak;\n\tcase $4:\n\t\t $5\n\t\tbreak;\n\tdefault:\n\t\t $0\n}",
                    detail: "switch-Anweisung",
                    filterText: 'switch',
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "if(){}",
                    // insertText: "if(${1:Bedingung}){\n\t${0:Anweisungen}\n}",
                    insertText: "if($1){\n\t$0\n}",
                    detail: "Bedingung",
                    filterText: 'if',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "if(){} else {}",
                    insertText: "if($1){\n\t$2\n}\nelse {\n\t$0\n}",
                    detail: "Zweiseitige Bedingung",
                    filterText: 'if',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "else {}",
                    insertText: "else {\n\t$0\n}",
                    detail: "else-Zweig",
                    filterText: 'else',
                    sortText: 'aelse',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
            ]);

        if (symbolTable?.classContext == null || symbolTable?.method != null) {

            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "instanceof",
                    insertText: "instanceof $0",
                    detail: "instanceof-Operator",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "print",
                    insertText: "print($1);$0",
                    detail: "Ausgabe (ggf. mit Farbe \nals zweitem Parameter)",
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "println",
                    insertText: "println($1);$0",
                    detail: "Ausgabe mit Zeilenumbruch (ggf. mit \nFarbe als zweitem Parameter)",
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },

            ]);
        }

        if(!this.isConsole){
            if ((symbolTable == null || symbolTable.classContext == null)) {
                keywordCompletionItems = keywordCompletionItems.concat([
                    {
                        label: "class",
                        filterText: "class",
                        insertText: "class ${1:Bezeichner} {\n\t$0\n}\n",
                        detail: "Klassendefinition",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    },
                    {
                        label: "public class",
                        filterText: "public class",
                        insertText: "public class ${1:Bezeichner} {\n\t$0\n}\n",
                        detail: "Öffentliche Klassendefinition",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    }
    
                ]);
            } else if (symbolTable?.classContext != null && symbolTable?.method == null) {
                keywordCompletionItems = keywordCompletionItems.concat([
                    {
                        label: "public",
                        filterText: "public",
                        insertText: "public ",
                        detail: "Schlüsselwort public",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    },
                    {
                        label: "public void method(){}",
                        filterText: "public",
                        insertText: "public ${1:void} ${2:Bezeichner}(${3:Parameter}) {\n\t$0\n}\n",
                        detail: "Methodendefinition",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined,
                        sortText: "aaMethod"
                    },
                    {
                        label: "public " + symbolTable.classContext.identifier  + "(){}  // Konstruktor",
                        filterText: "public",
                        insertText: "public " + symbolTable.classContext.identifier  + "(${1:Parameter}) {\n\t$0\n}\n",
                        detail: "Konstruktor",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined,
                        sortText: "aaConstructor"
                    },
                    {
                        label: "protected",
                        filterText: "protected",
                        insertText: "protected ",
                        detail: "Schlüsselwort protected",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    },
                    {
                        label: "static",
                        filterText: "static",
                        insertText: "static ",
                        detail: "Schlüsselwort static",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    },
                    {
                        label: "private",
                        filterText: "private",
                        insertText: "private ",
                        detail: "Schlüsselwort private",
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    }
                ]);
            }
        }

        if (symbolTable != null && symbolTable.method != null) {
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "return",
                    filterText: "return",
                    insertText: "return",
                    detail: "Schlüsselwort return",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            ]);
        }

        return keywordCompletionItems;

    }

    getOverridableMethodsCompletion(classContext: Klass) {

        let keywordCompletionItems: monaco.languages.CompletionItem[] = [];

        let methods: Method[] = [];
        let c = classContext.baseClass;
        while (c != null) {
            methods = methods.concat(c.methods.filter((m) => {
                if (m.isAbstract || (m.program == null && m.invoke == null) || m.identifier.startsWith('onMouse') || m.identifier.startsWith('onKey')
                || m.identifier.startsWith('onChange')) {
                    return true;
                }
                return false;
            }));
            c = c.baseClass;
        }

        for (let i of classContext.implements) {
            methods = methods.concat(i.getMethods());
        }

        for (let m of methods) {

            let alreadyImplemented = false;
            for (let m1 of classContext.methods) {
                if (m1.signature == m.signature) {
                    alreadyImplemented = true;
                    break;
                }
            }

            if (alreadyImplemented) continue;

            let label: string = (m.isAbstract ? "implement " : "override ") + m.getCompletionLabel();
            let filterText = m.identifier;
            let insertText = Visibility[m.visibility] + " " + (m.getReturnType() == null ? "void" : m.getReturnType().identifier) + " ";
            insertText += m.identifier + "(";
            for (let i = 0; i < m.getParameterList().parameters.length; i++) {
                let p = m.getParameterList().parameters[i];
                insertText += m.getParameterType(i).identifier + " " + p.identifier;
                if (i < m.getParameterCount() - 1) {
                    insertText += ", ";
                }
            }
            insertText += ") {\n\t$0\n}";

            keywordCompletionItems.push(
                {
                    label: label,
                    detail: (m.isAbstract ? "Implementiere " : "Überschreibe ") + "die Methode " + label + " der Basisklasse.",
                    filterText: filterText,
                    insertText: insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            );

        }

        return keywordCompletionItems;

    }

}