import { Module } from "../../../compiler/parser/Module.js";
import { Interface } from "../../../compiler/types/Class.js";
import { doublePrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";

export class ChangeListenerClass extends Interface {

    constructor(module: Module) {
        
        super("ChangeListener", module, "Listener-Interface für GUI-Klassen (Button, TextField, Checkbox, Radiobutton)");

        let objectType = module.typeStore.getType("Object");

        this.addMethod(new Method("onChange", new Parameterlist([
            { identifier: "changedObject", type: objectType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "newValue", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType,
            null,  // no implementation!
            true, false, "Wird immer dann aufgerufen, wenn sich das GUI-Objekt verändert hat."));

    }

}
