import { Enum } from "../../compiler/types/Enum.js";
import { Module } from "../../compiler/parser/Module.js";
import { TokenType } from "../../compiler/lexer/Token.js";
import { EnumValueNode } from "../../compiler/parser/AST.js";
import {SpriteLibrary} from  "./SpriteLibrary.js";

type SpriteLibraryEntry = {
    filename: string,
    name: string,
    index?: number
}

// declare var SpriteLibrary: SpriteLibraryEntry[];

export class SpriteLibraryClass extends Enum {

    constructor(module: Module) {
        super("SpriteLibrary", module, SpriteLibraryClass.getSystemNodes());
        this.documentation = "Aufzählung der Sprite-Grafiken"
    }

    includeUserSpritesheet(identifiers: string[]){
        let nodes = SpriteLibraryClass.getSystemNodes();
        for(let id of identifiers){
            nodes.push({
                type: TokenType.pushEnumValue,
                position: null,
                identifier: id
            })
        }
        this.setEnumValues(nodes);
    }


    static getSystemNodes(): EnumValueNode[] {
        return SpriteLibrary.filter(
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
    }

}