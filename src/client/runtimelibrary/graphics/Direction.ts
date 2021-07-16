import { Enum } from "../../compiler/types/Enum.js";
import { Module } from "../../compiler/parser/Module.js";
import { TokenType } from "../../compiler/lexer/Token.js";

export class DirectionClass extends Enum {

    constructor(module: Module){
        super("Direction", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "top"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "right"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "bottom"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "left"
            }
        ]);

        this.documentation = "Richtung (oben, rechts, unten, links)"
    }

}