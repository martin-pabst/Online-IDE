import { ObjectDiagramVariant } from "./ObjectDiagramVariant.js";
import { Klass, Interface, Visibility } from "../../../../compiler/types/Class.js";
import { Variable, Value } from "../../../../compiler/types/Types.js";
import { ObjectClass } from "../../../../compiler/types/ObjectClass.js";
import { RuntimeObject } from "../../../../interpreter/RuntimeObject.js";

type Reference = {
    sourceValue: RuntimeObject,
    destValue: RuntimeObject,
    attributeIdentifier: string
}

export class ListDiagram extends ObjectDiagramVariant {

    rootIdentifier: string;

    $selectElement: JQuery<HTMLSelectElement>;

    getSettingsElement(): JQuery<HTMLElement> {

        let moduleStore = this.main.getCurrentWorkspace().moduleStore;

        let $element = jQuery('<span>Start der Liste:&nbsp;</span>');
        this.$selectElement = jQuery('<select></select>');
        $element.append(this.$selectElement);

        for (let module of moduleStore.getModules(false)) {
            let childSymbolTables = module.mainSymbolTable?.childSymbolTables;
            if (childSymbolTables == null || childSymbolTables.length == 0) continue;
            let variableMap = childSymbolTables[0].variableMap;
            if (variableMap == null || childSymbolTables[0].classContext != null) continue;
            variableMap.forEach((variable, identifier) => {
                let type = variable.type;
                if (type != null && type instanceof Klass && type.module != null && !type.module.isSystemModule) {
                    let selected: string = identifier == this.rootIdentifier ? " selected" : "";
                    this.$selectElement.append('<option value="' + identifier + selected + '">' + identifier +
                        ' (Modul "' + module.file.name + '")</option>');
                }
            });
        }

        return $element;

    }

    getName(): string { return "Liste" }

    updateDiagram(): void {

        let heap = this.main.getInterpreter().heap;
        let rootValue = heap[this.rootIdentifier]?.value;
        if (rootValue == null) {
            this.objectDiagram.error("Konnte die Variable " + this.rootIdentifier + " nicht finden.");
            return;
        }

        if (rootValue.type == null || !(rootValue.type instanceof Klass)) {
            this.objectDiagram.error("Die Variable " + this.rootIdentifier + " zeigt auf kein Objekt.");
        }

        let klass: Klass = <Klass>rootValue.type;
        let rto: RuntimeObject = rootValue.value;

        // if rootValue is self of self referncing type then this array holds values:
        let rootValueSelfReferenceType = this.analyzeSelfReference(klass);

        // ... else find referenced class which is of self referencing type;
        let attributesWithSelfReference: string[] = [];
        let selfReferenceType: Klass | Interface;

        if (rootValueSelfReferenceType == null) {

            let k = klass;
            while (k != null && !(k instanceof ObjectClass)) {

                for (let a of k.attributes) {
                    let value = rto.attributeValues[k.identifier][a.identifier];
                    if (!(value.type instanceof Klass)) continue;
                    if (selfReferenceType != null && selfReferenceType == a.type) {
                        attributesWithSelfReference.push(a.identifier);
                    } else {
                        let sr = this.analyzeSelfReference(value.type);
                        if (sr != null) {
                            selfReferenceType = sr;
                        }
                    }
                }

                k = k.baseClass;
            }

        }

        if (rootValueSelfReferenceType == null && selfReferenceType == null) {
            this.objectDiagram.error("Konnte kein sich selbst referenzierendes Objekt finden.");
        } else {
            this.drawDiagram(rootValue, rootValueSelfReferenceType, attributesWithSelfReference, selfReferenceType);
        }

    }



    drawDiagram(rootValue: Value, rootValueSelfReferenceType: Klass | Interface,
        attributesWithSelfReference: string[], selfReferenceType: Klass | Interface) {

        


    }


    analyzeSelfReference(klass: Klass): Klass | Interface {

        let tImplements: Interface[] = [];
        let tExtends: Klass[];

        let k = klass;
        while (k != null && !(k instanceof ObjectClass)) {
            if (k.implements.length > 0)
                tImplements = tImplements.concat(k.implements);

            if (k.baseClass != null && !(k.baseClass instanceof ObjectClass)) {
                tExtends.push(k.baseClass);
            }
            k = k.baseClass;
        }

        k = klass;
        while (k != null && !(k instanceof ObjectClass)) {

            for (let a of k.attributes) {
                let type = a.type;
                if (tImplements.indexOf(<Interface>type) >= 0 || tExtends.indexOf(<Klass>type) >= 0) {
                    return <Klass | Interface>type;
                }
            }

            k = k.baseClass;
        }

        return null;

    }

    clear(): void {

    }





}