import { Enum } from "../../compiler/types/Enum.js";
import { Module } from "../../compiler/parser/Module.js";
import { TokenType } from "../../compiler/lexer/Token.js";

type SpriteLibraryEntry = {
    filename: string,
    name: string,
    index?: number
}

declare var SpriteLibrary: SpriteLibraryEntry[];

export class SpriteLibraryClass extends Enum {

    constructor(module: Module) {
        super("SpriteLibrary", module,

            SpriteLibrary.filter(
                (sle) => {
                    return sle.index == null || sle.index == 0
                }
            ).map((sle: SpriteLibraryEntry) => {
                return {
                    type: TokenType.pushEnumValue,
                    position: null,
                    identifier: sle.name
                };

            })

        );
        this.documentation = "Aufzählung der Sprite-Grafiken"
    }

}