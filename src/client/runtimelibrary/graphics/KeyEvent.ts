import { Module, ModuleStore } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ColorHelper } from "./ColorHelper.js";

type Key = {name: string, code: number};

export class KeyEvent extends Klass {

    constructor(module: Module, moduleStore: ModuleStore) {

        super("KeyEvent", module, "Nachbildung von java.awt.event.KeyEvent");

        this.setBaseClass(<Klass>moduleStore.getType("Object").type);

        /**
         *  "Enter": 13,
        "ArrowLeft": 37,
        "ArrowRight": 39,
        "ArrowUp": 38,
        "ArrowDown": 40,
        "F1": 112,
        "F2": 113,
        "F3": 114,
        "F4": 115,
        "F5": 116,
        "F6": 117,
        "F7": 118,
        "F8": 119,
        "F9": 120,
        "F10": 121,
        "F11": 122,
        "F12": 123,
        "PageUp": 33,
        "PageDown": 34,
        "Insert": 155
         */

        let keys: Key[] = [{name: "VK_ENTER", code: 13}, {name: "VK_LEFT", code: 37}, {name: "VK_UP", code: 38}, 
        {name: "VK_RIGHT", code: 39}, {name: "VK_DOWN", code: 40}, {name: "VK_PAGE_UP", code: 33}, {name: "VK_PAGE_DOWN", code: 34},
        {name: "VK_INSERT", code: 155}];

        for(let i = 1; i <= 12; i++){
            keys.push({name: "VK" + i, code: 111 + i});
        }
        
        for(let key of keys){
            this.addAttribute(new Attribute(key.name, intPrimitiveType, (value) => {value.value = key.code}, 
            true, Visibility.public, true, "KeyCode für die Taste " + key.name));
        }


        this.setupAttributeIndicesRecursive();
        this.staticClass.setupAttributeIndicesRecursive();

        this.staticClass.classObject = new RuntimeObject(this.staticClass);
    }

}

