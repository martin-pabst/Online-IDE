import { TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { Variable } from "../types/Types.js";
import { Statement } from "./Program.js";
import { Module } from "./Module.js";
import { Klass } from "../types/Class.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Main } from "../../main/Main.js";
import { MainBase } from "../../main/MainBase.js";
import jQuery from "jquery";

type Label = {
    number: number;
}

export class ProgramPrinter {



    private $pcodeTab: JQuery<HTMLElement>;

    constructor(private main: MainBase, private $bottomDiv: JQuery<HTMLElement>){
        this.$pcodeTab = this.$bottomDiv.find('.jo_tabs>.jo_pcodeTab');

    }

    showNode(node: Statement) {

        if(!this.$pcodeTab.hasClass('jo_active')) return;

        let $pCodeTab = this.$bottomDiv.find('.jo_tabs>.jo_pcodeTab');
        $pCodeTab.find('div').removeClass("jo_revealProgramPointer");
        let $div:JQuery<HTMLElement> = node["$div"];
        if($div != null){
            $div.addClass("jo_revealProgramPointer");
            let pos = $div.position().top + this.$pcodeTab.scrollTop();
            pos -= this.$pcodeTab.height()/2;
            this.$pcodeTab.scrollTop(pos);

            // $div[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        }
    }

    initGUI(){
        this.$pcodeTab.on('myshow', () => {
            this.main.printProgram();
        });

    }

    printModuleToBottomDiv(workspace: Workspace, m: Module){

        if(m == null) return;

        if(!this.$pcodeTab.hasClass('jo_active')) return;

        let $pcode = this.$bottomDiv.find('.jo_tabs>.jo_pcodeTab');

        $pcode.html("");
        $pcode.append(this.printModule(m));

        if(workspace != null && workspace.compilerMessage != null){
            $pcode.prepend("<div>" + workspace.compilerMessage + "</div>");
        }
        

        $pcode.find('.jo_label_destination').on("click", (ev) => {
            let dest = jQuery(ev.target).data('destination');
            if(dest == null){
                dest = jQuery(ev.target).parent().data('destination');
            }
            if(dest != null){
                let $dest = this.$pcodeTab.find('.' + dest);
                $dest[0].scrollIntoView();            
            } 
                
        });

    }

    printModule(m: Module): JQuery<HTMLElement>[] {

        if (m == null) {
            return [jQuery("<div></div>")];
        }

        let s: JQuery<HTMLElement>[] = [];

        if (m.mainProgram != null) {
            s.push(jQuery("<h3>Main Program: </h3>"));
            s = s.concat(this.print(m.mainProgram.statements));
        }

        if (m.typeStore != null && m.typeStore.typeList != null) {

            for (let c of m.typeStore.typeList) {
                if (c instanceof Klass) {
                    s.push(jQuery("<h2>Class " + c.identifier + ":</h2>"));

                    if(c.attributeInitializationProgram.statements.length > 0){
                        s.push(jQuery("<h3>Attribute-initialization:</h3>"));
                        s = s.concat(this.print(c.attributeInitializationProgram.statements));
                }

                    for (let m of c.methods) {
                        if (m.program != null) {
                            s.push(jQuery("<h3>Method " + m.signature + ":</h3>"));
                            s = s.concat(this.print(m.program.statements));
                        }
                    }
                    for (let m of c.staticClass.methods) {
                        if (m.program != null) {
                            s.push(jQuery("<h3>Static Method " + m.signature + ":</h3>"));
                            s = s.concat(this.print(m.program.statements));
                        }
                    }
                }
            }

        }

        return s;

    }

    print(statements: Statement[], indent: string = ""): JQuery<HTMLElement>[] {

        let labels: Map<number, Label> = new Map();
        let lastLabelNumber: number = 0;

        for(let statement of statements){
            if(statement.type == TokenType.jumpAlways || statement.type == TokenType.jumpIfFalse || 
                statement.type == TokenType.jumpIfTrue || statement.type == TokenType.jumpIfFalseAndLeaveOnStack || 
                statement.type == TokenType.jumpIfTrueAndLeaveOnStack || statement.type ==TokenType.extendedForLoopCheckCounterAndGetElement ){
                let dest = statement.destination;
                let label = labels.get(dest);
                if(label == null){
                    labels.set(dest, {
                        number: lastLabelNumber++
                    });
                }
            }
            if(statement.type == TokenType.keywordSwitch){
                for(let value in statement.destinationMap){
                    let dest = statement.destinationMap[value];
                    let label = labels.get(dest);
                    if(label == null){
                        labels.set(dest, {
                            number: lastLabelNumber++
                        });
                    }                        
                }
                if(statement.defaultDestination != null){
                    let label = labels.get(statement.defaultDestination);
                    if(label == null){
                        labels.set(statement.defaultDestination, {
                            number: lastLabelNumber++
                        })
                    }
                }
            }
        }

        let s: JQuery<HTMLElement>[] = [];
        let i = 0;

        for (let statement of statements) {
            s.push(this.printNode(statement, indent, i, labels));
            i++;
        }

        return s;
    }

    printNode(node: Statement, indent: string, n: number, labels: Map<number, Label>): JQuery<HTMLElement> {

        let s = indent;

        let label = labels.get(n);
        if(label != null){
            s += "<span style='font-weight: bold' class='label" + label.number + "'>Label&nbsp;<span style='color: green'>" + label.number + ":</span></span><br>";
        }

        if (node.position != null) {
            s += "(l" + this.format3(node.position.line) + ",&nbsp;c" + this.format3(node.position.column) + "): ";
        } else {
            s += "(l&nbsp;xxx,&nbsp;c&nbsp;xxx):";
        }
        // s += "<span style='fontweight: bold; color: darkgreen'>[" + n + "]</span>&nbsp;";
        s += "<span style='fontweight: bold; color: #8080ff'>" + TokenType[node.type] + "</span>&nbsp;";

        let s1: string = "";
        switch (node.type) {
            case TokenType.localVariableDeclaration:
                s1 += "V: " + this.printVariable(node.variable) + "&nbsp;&nbsp;pushToStackTop: " + node.pushOnTopOfStackForInitialization;
                break;
            case TokenType.heapVariableDeclaration:
                s1 += "V: " + this.printVariable(node.variable) + "&nbsp;&nbsp;pushToStackTop: " + node.pushOnTopOfStackForInitialization;
                break;
            case TokenType.pushLocalVariableToStack:
                s1 += "StackPos: " + node.stackposOfVariable;
                break;
            case TokenType.pushFromHeapToStack:
                s1 += "v: " + node.identifier;    
            break;
            case TokenType.pushAttribute:
                s1 += "Attribut: " + node.attributeIdentifier + ", use THIS-Object: " + node.useThisObject
                break;
            case TokenType.assignment:
            case TokenType.plusAssignment:
            case TokenType.minusAssignment:
            case TokenType.multiplicationAssignment:
            case TokenType.divisionAssignment:
                s1 += "Assignmenttype: " + TokenTypeReadable[node.type] + "&nbsp;&nbsp;";
                if(node.type == TokenType.assignment){
                    s1 += ", leaveValueOnStack: " + node.leaveValueOnStack;
                }
                
                break;
            case TokenType.binaryOp:
            case TokenType.unaryOp:
                s1 += "Operator: " + TokenTypeReadable[node.operator];
                break;
            case TokenType.pushConstant:
                s1 += "Value: " + (node.value + "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                break;
            case TokenType.pushStaticClassObject:
                s1 += "Static class: " + node.klass.identifier;
                break;
            case TokenType.castValue:
                s1 += "New Type: " + node.newType.identifier;
                break;
            case TokenType.selectArrayElement:
                break;
            case TokenType.callMethod:
                s1 += node.method.identifier;
                s1 += ", StackframeBegin: " + node.stackframeBegin
                break;
            case TokenType.decreaseStackpointer:
                s1 += "count: " + node.popCount;
                break;
            case TokenType.return:
                s1 += "copyReturnValueToStackframePos0: " + node.copyReturnValueToStackframePos0;
                break;
            case TokenType.extendedForLoopCheckCounterAndGetElement:
            case TokenType.jumpAlways:
            case TokenType.jumpIfFalse:
            case TokenType.jumpIfTrue:
            case TokenType.jumpIfFalseAndLeaveOnStack:
            case TokenType.jumpIfTrueAndLeaveOnStack:
                let number: number = labels.get(node.destination).number;
                s1 += "destination: <span style='font-weight: bold' class='jo_label_destination' data-destination='label" + number + "'>Label<span style='color: green'>&nbsp;" + number + "</span></span>";
                break;
            case TokenType.incrementDecrementBefore:
            case TokenType.incrementDecrementAfter:
                s1 += "amount: " + node.incrementDecrementBy;
                break;
            case TokenType.beginArray:
                s1 += "type: " + node.arrayType.identifier;
                break;
            case TokenType.addToArray:
                s1 += "count: " + node.numberOfElementsToAdd;
                break;
            case TokenType.pushEmptyArray:
                s1 += "type: " + node.arrayType.identifier;
                s1 += ", dimension: " + node.dimension;
                break;
            case TokenType.keywordSwitch:
                s1 += "destinationMap: {";
                for(let key in node.destinationMap){
                    let number: number = labels.get(node.destinationMap[key]).number;
                    s1 += key + ": <span style='font-weight: bold' class='jo_label_destination' data-destination='label" + number + "'>Label<span style='color: green'>&nbsp;" + number + "</span></span>" + ", ";
                }

                if(s1.endsWith(", ")) s1 = s1.substring(0, s1.length - 2);

                s1 += "}";
                if(node.defaultDestination != null){
                    let number = labels.get(node.defaultDestination).number;
                    s1 += ", defaultDestination: <span style='font-weight: bold' class='jo_label_destination' data-destination='label" + number + "'>Label<span style='color: green'>&nbsp;" + number + "</span></span>";
                }
                break;
            case TokenType.pushStaticAttribute:
                if(node.klass != null)
                s1 += "class: " + node.klass.identifier + ", attribute: " + node.attributeIdentifier;
                break;
            case TokenType.newObject: 
                s1 += "class: " + node.class.identifier;
                break;
        }


        if(s1 != "") s += ` [${s1}]`;

        if (node.stepFinished == true) {
            s += "::"
        }

        s = "<div>" + s + "</div>";

        let $div = jQuery(s);

        node["$div"] = $div;

        return $div;
    }

    printVariable(v: Variable): string {
        return v.type.identifier + " " + v.identifier + (v.stackPos == null ? "" :" (sp: " + v.stackPos + ")");
    }

    format3(n: number):string{
        if(n >= 100) return "" + n;
        if(n >= 10) return "&nbsp;" + n;
        return "&nbsp;&nbsp;" + n;
    }

}