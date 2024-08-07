import { Klass, Interface, Visibility } from "./Class.js";
import { Method, Attribute, Type, PrimitiveType, Variable } from "./Types.js";
import { objectType } from "./PrimitiveTypes.js";
import { ArrayType } from "./Array.js";
import { formatAsJavadocComment } from "../../../tools/StringTools.js";

export function getDeclarationAsString(element: Klass | Interface | Method | Attribute | Variable,
    indent: string = "", short: boolean = false): string {

    if (element instanceof Klass) {

        if (element.isTypeVariable) {
            return getTypeVariableDeclaration(element);
        }

        let s = "";

        if (element.documentation != null && element.documentation != "") {
            if(element.documentation.startsWith("/*")){
                s += (indent + element.documentation).replace(/\n/g, "\n" + indent) + "\n";
            } else {
                // s += indent + "/**  \n" + element.documentation + "  \n**/  \n" + indent;
                s += formatAsJavadocComment(element.documentation, indent) + "\n";
            }
        }

        if (element.visibility != null) s += Visibility[element.visibility] + " ";
        if (element.isAbstract) s += "abstract ";
        s += "class " + element.identifier + " ";

        if (element.typeVariables.length > 0) {
            s += getGenericParameterDefinition(element);
        }


        if (element.baseClass != null && element.baseClass.identifier != "Object") {
            s += "extends " + element.baseClass.identifier + " ";
            if (element.baseClass.typeVariables.length > 0) {
                s += getGenericParameterDefinition(element.baseClass);
            }
        }

        if (element.implements != null && element.implements.length > 0) {
            s += "implements ";
            for (let i = 0; i < element.implements.length; i++) {
                s += element.implements[i].identifier;
                if (element.implements[i].typeVariables.length > 0) {
                    s += getGenericParameterDefinition(element.implements[i]);
                }
                if (i < element.implements.length - 1) {
                    s += ", ";
                }
            }
        }

        if (short) return s;

        s += indent + "{\n  ";

        for (let a of element.getAttributes(Visibility.protected)) {
            s += indent + "\n" + getDeclarationAsString(a, "  ") + ";\n";
        }

        if (element.staticClass != null) {
            for (let a of element.staticClass.getAttributes(Visibility.protected)) {
                s += indent + "\n" + getDeclarationAsString(a, "  ") + ";\n";
            }
        }

        for (let m of element.getMethods(Visibility.protected)) {
            s += indent + "\n" + getDeclarationAsString(m, "  ") + ";\n";
        }

        if (element.staticClass != null) {
            for (let m of element.staticClass.getMethods(Visibility.protected)) {
                s += indent + "\n" + getDeclarationAsString(m, "  ") + ";\n";
            }
        }


        s += "\n}";

        return s;

    }

    if (element instanceof Interface) {

        let decl = "";

        if (element.documentation != null && element.documentation != "" && !short) {
            if(element.documentation.startsWith("/*")){
                decl += (indent + element.documentation).replace(/\n/g, "\n" + indent) + "\n";
            } else {
                decl += formatAsJavadocComment(element.documentation, indent) + "\n";
            }
        }

        decl += indent + "interface " + element.identifier;

        if (element.typeVariables.length > 0) {
            decl += getGenericParameterDefinition(element);
        }

        if (element.extends != null && element.extends.length > 0) {
            decl += "extends ";
            for (let i = 0; i < element.extends.length; i++) {
                decl += element.extends[i].identifier;
                if (element.extends[i].typeVariables.length > 0) {
                    decl += getGenericParameterDefinition(element.extends[i]);
                }
                if (i < element.extends.length - 1) {
                    decl += ", ";
                }
            }
        }

        if (!short) {

            decl += "{\n";

            for (let m of element.methods) {
                decl += indent + "\n" + getDeclarationAsString(m, "  ") + ";\n";
            }

            decl += "\n}";
        }

        return decl;

    }

    if (element instanceof Attribute) {
        let s = "";

        if (element.documentation != null && element.documentation != "" && !short) {
            if(element.documentation.startsWith("/*")){
                s += indent + element.documentation.replace(/\n/g, "\n" + indent) + "\n";
            } else {
                s += formatAsJavadocComment(element.documentation, indent) + "\n";
            }
        }

        s += indent;

        if (element.visibility != null) s += Visibility[element.visibility] + " ";

        if (element.isStatic) s += "static ";

        s += getTypeIdentifier(element.type) + " " + element.identifier;

        return s;
    }

    if (element instanceof Method) {

        let s = "";

        if (element.documentation != null && element.documentation != "" && !short) {
            if(element.documentation.startsWith("/*")){
                s += indent + element.documentation.replace(/\n/g, "\n" + indent) + "\n";
            } else {
                s += formatAsJavadocComment(element.documentation, indent) + "\n";
            }
        }

        s += indent;

        if (element.visibility != null) s += Visibility[element.visibility] + " ";

        if (element.isStatic) s += "static ";

        if (element.getReturnType() != null) {
            s += getTypeIdentifier(element.getReturnType()) + " ";
        } else {
            s += element.isConstructor ? "" : "void ";
        }

        s += element.identifier + "(";

        let parameters = element.getParameterList().parameters;
        for (let i = 0; i < parameters.length; i++) {

            let p = parameters[i];
            let type: Type = element.getParameterType(i);

            if (p.isEllipsis) {
                type = (<ArrayType>type).arrayOfType;
            }

            s += getTypeIdentifier(type) + (p.isEllipsis ? "..." : "") + " " + p.identifier;

            if (i < parameters.length - 1) {
                s += ", ";
            }

        }

        s += ")";

        return s;


    }

    return "";
}

function getTypeVariableDeclaration(element: Klass) {
    let s: string = element.identifier;

    if (element.isGenericVariantFrom != objectType) s += " extends " + getTypeIdentifier(element.isGenericVariantFrom);
    if (element.implements.length > 0) {
        let implList = element.implements.filter(impl => element.isGenericVariantFrom.implements.indexOf(impl) < 0)
            .map(impl => getTypeIdentifier(impl)).join(", ");
        if (implList != "") {
            s += " implements " + implList;
        }
    }

    return s;
}

export function getTypeIdentifier(type: Type): string {
    if (type instanceof Klass || type instanceof Interface) {
        if (type.typeVariables.length > 0) {
            let s: string = (type["isTypeVariable"] ? (type.identifier + " extends " + type.isGenericVariantFrom?.identifier) : type.identifier)
                + "<";
            s += type.typeVariables.map(tv => getTypeIdentifier(tv.type)).join(", ");
            return s + ">";
        }
    }

    return type["isTypeVariable"] ? (type.identifier + " extends " + type["isGenericVariantFrom"]?.identifier) : type.identifier;
}

export function getGenericParameterDefinition(element: Klass | Interface): string {

    let s: string = "";

    if (element.typeVariables.length > 0) {
        s = "<";

        let typeList: string[] = [];
        for (let tv of element.typeVariables) {
            let t: string = tv.type.identifier;
            let k: Klass = tv.type;
            if (k.isGenericVariantFrom != null && k.isGenericVariantFrom.identifier != "Object") {
                t += " extends " + k.isGenericVariantFrom.identifier;
            }
            if (k.implements != null) {

                let implList = k.implements;
                if (k.isGenericVariantFrom != null) {
                    implList = implList.filter(impl => k.isGenericVariantFrom.implements.indexOf(impl) < 0);
                }

                for (let im of implList) {
                    t += " & " + im.identifier;
                }
            }
            typeList.push(t);
        }

        s += typeList.join(", ");
        s += "> ";
    }

    return s;
}