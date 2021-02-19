/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export function defineMyJava() {
    monaco.languages.register({ id: 'myJava', 
    extensions: ['.learnJava'],
    //  mimetypes: ["text/x-java-source", "text/x-java"]  
    });

    let conf: monaco.languages.LanguageConfiguration = {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' }
            },
            {
                // e.g.  * ...|
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: monaco.languages.IndentAction.None, appendText: '* ' }
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
            },
            {
                // e.g.  *-----*/|
                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
            }
        ],
        // the default separators except `@$`
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
            { open: '<', close: '>' },
        ],
        folding: {
            markers: {
                start: new RegExp("^\\s*//\\s*(?:(?:#?region\\b)|(?:<editor-fold\\b))"),
                end: new RegExp("^\\s*//\\s*(?:(?:#?endregion\\b)|(?:</editor-fold>))")
            }
        },

    };
    let language = {
        defaultToken: '',
        tokenPostfix: '.java',
        keywords: [
            'abstract', 'continue', 'new', 'switch', 'assert', 'default',
            'goto', 'package', 'synchronized', 'private',
            'this', 'implements', 'protected', 'throw',
            'import', 'public', 'throws', 'case', 'instanceof', 'return',
            'transient', 'catch', 'extends', 'try', 'final',
            'static', 'finally', 'strictfp',
            'volatile', 'const', 'native', 'super', 'true', 'false', 'null'
        ],
        print: ['print', 'println'],
        statements: ['for', 'while', 'if', 'then', 'else', 'do', 'break', 'continue'],
        types: ['int', 'boolean', 'char', 'float', 'double', 'long', 'void', 'byte', 'short',
        'class', 'enum', 'interface'],
        operators: [
            '=', '>', '<', '!', '~', '?', ':',
            '==', '<=', '>=', '!=', '&&', '||', '++', '--',
            '+', '-', '*', '/', '&', '|', '^', '%', '<<',
            '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
            '^=', '%=', '<<=', '>>=', '>>>='
        ],
        // we include these common regular expressions
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        digits: /\d+(_+\d+)*/,
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
        // The main tokenizer for our languages
        tokenizer: {
            root: [
                // identifiers and keywords
                // [/[a-zA-Z_$][\w$]*/, {
                [/[a-z_$äöü][\w$äöüßÄÖÜ]*(?=\()/, {
                    cases: {
                        '@keywords': { token: 'keyword.$0' },
                        '@statements': { token: 'statement.$0' },
                        '@types': { token: 'type.$0' },
                        '@print': { token: 'print.$0' },
                        '@default': 'method'
                    }
                }],
                [/[a-z_$äöüß][\w$äöüßÄÖÜ]*/, {
                    cases: {
                        '@keywords': { token: 'keyword.$0' },
                        '@statements': { token: 'statement.$0' },
                        '@types': { token: 'type.$0' },
                        '@default': 'identifier'
                    }
                }],
                [/[A-Z$ÄÖÜ][\w$äöüßÄÖÜ]*/, 'class'],
                // whitespace
                { include: '@whitespace' },
                // delimiters and operators
                [/[{}()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'delimiter',
                        '@default': ''
                    }
                }],
                // @ annotations.
                [/@\s*[a-zA-Z_\$][\w\$]*/, 'annotation'],
                // numbers
                [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
                [/0(@octaldigits)[Ll]?/, 'number.octal'],
                [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
                [/(@digits)[fFdD]/, 'number.float'],
                [/(@digits)[lL]?/, 'number'],
                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],
                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string'],
                // characters
                [/'[^\\']'/, 'string'],
                [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                [/'/, 'string.invalid']
            ],
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*\*(?!\/)/, 'comment.doc', '@javadoc'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                // [/\/\*/, 'comment', '@push' ],    // nested comment not allowed :-(
                // [/\/\*/,    'comment.invalid' ],    // this breaks block comments in the shape of /* //*/
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
            //Identical copy of comment above, except for the addition of .doc
            javadoc: [
                [/[^\/*]+/, 'comment.doc'],
                // [/\/\*/, 'comment.doc', '@push' ],    // nested comment not allowed :-(
                [/\/\*/, 'comment.doc.invalid'],
                [/\*\//, 'comment.doc', '@pop'],
                [/[\/*]/, 'comment.doc']
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
        },
    };

    //@ts-ignore
    monaco.languages.setLanguageConfiguration('myJava', conf);
    //@ts-ignore
    monaco.languages.setMonarchTokensProvider('myJava', language);

    // monaco.languages.registerCompletionItemProvider("myJava", {    // Or any other language...
    //     provideCompletionItems: (model, position) => {
    //         // Retrieve the text until the current cursor's position, anything
    //         // after that doesn't really matter.
    //         var textToMatch = model.getValueInRange({
    //             startLineNumber: 1,
    //             startColumn: 1,
    //             endLineNumber: position.lineNumber,
    //             endColumn: position.column
    //         });

    //         // Return JSON array containing all completion suggestions.
    //         return {
    //             suggestions: [
    //                 // Example: io.write ()
    //                 {
    //                     label: "io.write (string)",
    //                     kind: monaco.languages.CompletionItemKind.Function,
    //                     documentation: "Writes a string to stdout.",
    //                     insertText: "io.write (\"\")",  // Escape JSON as needed.
    //                     range: {
    //                         startLineNumber: position.lineNumber,
    //                         endLineNumber: position.lineNumber,
    //                         startColumn: position.column,
    //                         endColumn: position.column
    //                     }
    //                 },  // Other items.
    //             ]
    //         };
    //     }
    // });


}