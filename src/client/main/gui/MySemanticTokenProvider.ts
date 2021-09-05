import { TextPosition } from "../../compiler/lexer/Token.js";
import { SymbolTable } from "../../compiler/parser/SymbolTable.js";
import { Interface, Klass } from "../../compiler/types/Class.js";
import { Attribute, Method, PrimitiveType, Type } from "../../compiler/types/Types.js";
import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";

export class MySemanticTokenProvider implements monaco.languages.DocumentSemanticTokensProvider {
    
    tokenTypes = [
        'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
        'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
        'member', 'macro', 'variable', 'parameter', 'property', 'label'
    ];
    tokenModifiers = ['declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
        'modification', 'async'];
    legend: monaco.languages.SemanticTokensLegend;

    constructor(private main: MainBase){
        this.legend = {
            tokenTypes: this.tokenTypes,
            tokenModifiers: this.tokenModifiers
        }
    }

    onDidChange?: monaco.IEvent<void>;

    getLegend(): monaco.languages.SemanticTokensLegend {
        return this.legend;
    }

    provideDocumentSemanticTokens(model: monaco.editor.ITextModel, lastResultId: string, 
        token: monaco.CancellationToken): monaco.languages.ProviderResult<monaco.languages.SemanticTokens | monaco.languages.SemanticTokensEdits> {

            console.log(model.getValue());

            let module = this.main.getCurrentlyEditedModule();
            if(module.model.id != model.id) return {
                data: new Uint32Array(),
                resultId: null
            };
            let lastPos = {
                line: 0,
                column: 0
            }

            let data: number[] = [];

            for(let line = 1; line < model.getLineCount(); line++){
                let identifierPositions = module.identifierPositions[line];
                if(identifierPositions != null){
                    for(let ip of identifierPositions){

                        let element = ip.element;

                        if (element instanceof Klass || element instanceof Method || element instanceof Interface
                            || element instanceof Attribute) {

                                if(element instanceof Attribute){
                                    this.registerToken(ip.position, element.identifier, lastPos, data, 
                                        this.tokenTypes.indexOf("property"), 0);
                                }


                        } else if (element instanceof PrimitiveType) {
                        } else if(!(element instanceof Type)){
                            // Variable
                            let typeIdentifier: string = element?.type?.identifier;

                        }

                    }
                }
            }

            console.log(data);

            return {
                data: new Uint32Array(data),
                resultId: null
            };

        }

    registerToken(position: TextPosition, identifier: string, 
        lastPos: { line: number; column: number; }, data: number[], tokenTypeIndex: number, tokenModifierIndex: number) {
            data.push(
                position.line - 1 - lastPos.line,
                position.line - 1 == lastPos.line ? position.column - 1 - lastPos.column : position.column - 1,
                identifier.length,
                tokenTypeIndex,
                tokenModifierIndex
            );
            lastPos.line = position.line - 1;
            lastPos.column = position.column - 1;
    }

    releaseDocumentSemanticTokens(resultId: string): void {
        
    }




}