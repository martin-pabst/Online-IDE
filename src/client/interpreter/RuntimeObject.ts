import { Klass, StaticClass, Visibility } from "../compiler/types/Class.js";
import { PrimitiveType, Value } from "../compiler/types/Types.js";



export class RuntimeObject {

    class: Klass | StaticClass;

    intrinsicData: {[classIdentifier: string]: any} = {};  // for intrinsic (= builtin) classes to store data

    // Attributes of class and base-classes
    // Map class-identifier to Map <attribute-identifier, attribute-value>
    // attributeValues: Map<string, Map<string, Value>> = new Map();
    attributes: Value[];

    constructor(klass: Klass | StaticClass ) {

        this.class = klass;

        // while (klass != null) {
        //     let map: Map<string, Value> = new Map();
        //     this.attributeValues.set(klass.identifier, map);
        //     for (let attribute of klass.attributes) {
        //         let value: Value = {
        //             type: attribute.type,
        //             value: null
        //         };

        //         if (attribute.type instanceof PrimitiveType) {
        //             value.value = attribute.type.initialValue;
        //         }
        //         map.set(attribute.identifier, value);
        //     }
        //     klass = klass.baseClass;
        // }

    }

    getValue(attributeIndex: number):Value{

        let av: Value = this.attributes[attributeIndex];
        if(av?.updateValue != null){
            av.updateValue(av);
        }
        return av;

    }

    initializeAttributeValues(){

        this.attributes = Array(this.class.numberOfAttributesIncludingBaseClass).fill(null);

        let klass = this.class;
        while(klass != null){

            for(let att of klass.attributes){
                
                let value:any = null;
                if(att.type instanceof PrimitiveType){
                    value = att.type.initialValue;
                }

                let v: Value = {
                    type: att.type,
                    value: value
                };

                if(att.updateValue != null){
                    v.updateValue = att.updateValue;
                    v.object = this;
                } 
                
                this.attributes[att.index] = v;

            }

            klass = klass.baseClass;
        }

    }

}


export function deepCopy(obj: any): any {

    var copy: any;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");

}

