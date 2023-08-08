import { Enum } from "../../compiler/types/Enum.js";
import { Module } from "../../compiler/parser/Module.js";
import { TokenType } from "../../compiler/lexer/Token.js";

export type RepeatType = "backAndForth" | "loop" | "once";

export class RepeatTypeClass extends Enum {

    constructor(module: Module){
        super("RepeatType", module, [
            {
                type: TokenType.pushEnumValue,
                position: null, 
                identifier: "once"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "loop"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "backAndForth"
            },
        ]);

        this.documentation = "Gibt an, auf welche Art eine Sprite-Animation abgespielt werden soll."
    }

}