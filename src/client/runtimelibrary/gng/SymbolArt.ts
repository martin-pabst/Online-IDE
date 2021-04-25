import { TokenType } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js";
import { Enum } from "../../compiler/types/Enum.js";

export class GNGSymbolArtClass extends Enum {

    constructor(module: Module) {
        super("SymbolArt", module, ["Kreis", "Rechteck"].map((identifier: string) => {
            return {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: identifier
            }
        }));

        this.documentation = "Aufzählung der Sprite-Grafiken"
    }

}