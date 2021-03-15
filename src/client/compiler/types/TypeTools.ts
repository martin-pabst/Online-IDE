import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ModuleStore } from "../parser/Module.js";
import { ArrayType } from "./Array.js";
import { Interface, Klass } from "./Class.js";
import { Enum, EnumRuntimeObject } from "./Enum.js";
import { PrimitiveType, Type, Value } from "./Types.js";

type SerializedObject = {
    "!k"?: string, // Class identifier or object index
    "!i": number  // index
}

export class JsonTool {
    // to deserialize:
    indexToObjectMap: { [index: number]: Value };
    valuesToResolve: { v: Value, i: number }[];

    // to serialize:
    objectToIndexMap: Map<RuntimeObject, number>;
    nextIndex: number;

    toJson(value: Value): string {
        this.objectToIndexMap = new Map();
        this.nextIndex = 0;
        let json = JSON.stringify(this.toJsonObj(value));
        this.objectToIndexMap = null; // free memory
        return json;
    }

    toJsonObj(value: Value): any {
        let type = value.type;
        let v = value.value;
        if (v == null) return null;

        if ((type instanceof Klass || type instanceof Interface) && type.identifier != "String") {

            if (type instanceof Enum) {
                let enumObj = <EnumRuntimeObject>v;
                return enumObj.enumValue.ordinal;
            }

            let rto = <RuntimeObject>v;
            return this.objectToJsonObj(rto);
        } else if (type instanceof ArrayType) {
            let arrayValues: Value[] = v;
            return arrayValues.map(value => this.toJsonObj(value));
        } else {
            // primitive Type
            return value.value;
        }
    }

    objectToJsonObj(rto: RuntimeObject): SerializedObject {
        // We solve circular object references by serializing an index when the same object occurs more than once.
        let index = this.objectToIndexMap.get(rto);
        if (index != null) {
            return { "!i": index };
        }

        index = this.nextIndex++;
        this.objectToIndexMap.set(rto, index);
        let klass: Klass = <Klass>rto.class;

        // Don't serialize system classes unless they are explicitely serializable
        if (klass.module.isSystemModule && klass.getMethodBySignature("String toJson()") == null) {
            return null;
        }

        let serializedObject: SerializedObject = { "!k": klass.identifier, "!i": index };
        while (klass != null) {
            let first: boolean = true;
            let serializedAttributes: any;
            for (let attribute of klass.attributes) {
                if (!attribute.isStatic && !attribute.isTransient) {
                    if (first) {
                        first = false;
                        serializedAttributes = {};
                        serializedObject[klass.identifier] = serializedAttributes;
                    }
                    serializedAttributes[attribute.identifier] = this.toJsonObj(rto.attributes[attribute.index]);
                }
            }

            klass = klass.baseClass;
        }

        return serializedObject;
    }

    fromJson(jsonString: string, type: Type, moduleStore: ModuleStore, interpreter: Interpreter): any {
        this.indexToObjectMap = {};
        this.valuesToResolve = [];

        let obj: any = JSON.parse(jsonString);
        let ret = this.fromJsonObj(obj, type, moduleStore, interpreter);

        for (let vtr of this.valuesToResolve) {
            let value = this.indexToObjectMap[vtr.i];
            if (value != null) {
                vtr.v.type = value.type;
                vtr.v.value = value.value;
            }
        }

        this.indexToObjectMap = null; // free memory
        this.valuesToResolve = null;
        return ret.value;
    }

    fromJsonObj(obj: any, type: Type, moduleStore: ModuleStore, interpreter: Interpreter): Value {
        if (obj == null) return { type: type, value: null };

        if ((type instanceof Klass || type instanceof Interface) && type.identifier != "String") {

            if (type instanceof Enum) {
                return {
                    type: type,
                    value: type.indexToInfoMap[obj].object
                }
            }

            let serializedObject = <SerializedObject>obj;
            return this.objectFromJsonObj(serializedObject, type, moduleStore, interpreter);

        } else if (type instanceof ArrayType) {
            let jsonArray: any[] = obj;
            return {
                type: type,
                value: jsonArray.map(v => this.fromJsonObj(v, type.arrayOfType, moduleStore, interpreter))
            }
        } else {
            // primitive Type
            return { type: type, value: obj }
        }

    }

    objectFromJsonObj(serializedObject: SerializedObject, type: Klass | Interface, moduleStore: ModuleStore,
        interpreter: Interpreter): Value {

        let identifier: string = serializedObject["!k"];
        let index = serializedObject["!i"];
        if (identifier != null) {

            let klass1: Klass = <Klass>moduleStore.getType(identifier).type;
            let klass = klass1;

            let rto: RuntimeObject = interpreter.instantiateObjectImmediately(klass);

            while (klass != null) {
                let attributes = rto.attributes;
                let serializedAttributes = serializedObject[klass.identifier];
                if (attributes != null && serializedObject != null) {
                    for (let attribute of klass.attributes) {
                        if (!attribute.isStatic && !attribute.isTransient) {
                            attributes[attribute.index] = this.fromJsonObj(serializedAttributes[attribute.identifier], attribute.type, moduleStore, interpreter);
                        }
                    }
                }

                klass = klass.baseClass;
            }

            let value: Value = { type: klass1, value: rto };
            this.indexToObjectMap[index] = value;
            return value;

        } else {
            let index = serializedObject["!i"];
            let value = this.indexToObjectMap[index];
            if (value == null) {
                value = { type: type, value: null };
                this.valuesToResolve.push({ v: value, i: index });
                return value;
            } else {
                return { type: value.type, value: value.value }; // return copy
            }
        }

    }



}


