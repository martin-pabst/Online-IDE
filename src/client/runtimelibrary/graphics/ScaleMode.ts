import { Enum } from "../../compiler/types/Enum.js";
import { Module } from "../../compiler/parser/Module.js";
import { TokenType } from "../../compiler/lexer/Token.js";

export class ScaleModeClass extends Enum {

    constructor(module: Module){
        super("ScaleMode", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "linear"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "nearest_neighbour"
            }
        ]);

        this.documentation = "Art der Interpolation der Pixelfarben beim Skalieren von grafischen Objekten"
    }

}