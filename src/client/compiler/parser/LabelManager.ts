import { Statement, JumpNode, Program, JumpOnSwitchStatement } from "./Program.js";
import { TokenType, TextPosition } from "../lexer/Token.js";
import { CodeGenerator } from "./CodeGenerator.js";

type nodeToResolve = {
    node: JumpNode,
    labelIndex: number
}

type LabeledNode = {
    node?: Statement,
    labelIndex: number,
    position?: number
}


export class LabelManager {

    maxLabelIndex: number = 0;

    labeledNodes: LabeledNode[] = [];
    
    labelMap: Map<number, LabeledNode> = new Map();
    jumpNodesToResolve: nodeToResolve[] = [];

    switchStatements: JumpOnSwitchStatement[] = [];

    program: Program;

    constructor(program: Program){
        this.program = program;
    }

    correctPositionsAfterInsert(insertPosition: number, insertedLength: number) {
        for(let ln of this.labeledNodes){
            if(ln.position != null && ln.position >= insertPosition){
                ln.position += insertedLength;
            }
        }
    }


    registerSwitchStatement(switchStatement: JumpOnSwitchStatement) {
        this.switchStatements.push(switchStatement);
    }

    insertJumpNode(type: TokenType.jumpIfTrue|TokenType.jumpIfFalse|TokenType.jumpAlways|
        TokenType.jumpIfFalseAndLeaveOnStack|TokenType.jumpIfTrueAndLeaveOnStack,
         position: TextPosition, codeGenerator: CodeGenerator, labelIndex?: number): number {
        
        let statementList = this.program.statements;

        if(position == null){
            if(statementList.length > 0){
                position = statementList[statementList.length - 1].position;
            }
        }

        let node: JumpNode = {
            type: type,
            position: position,
            stepFinished: true
        };

        codeGenerator.pushStatements(node);

        return this.registerJumpNode(node, labelIndex);

    }

    markJumpDestination(offset: number, labelIndex?:number): number {
        
        let position = this.program.statements.length - 1 + offset;
        
        if(labelIndex == null){
            labelIndex = this.maxLabelIndex++;
        }

        let labeledNode = {
            position: position,
            labelIndex: labelIndex
        };

        this.labeledNodes.push(labeledNode);

        this.labelMap.set(labelIndex, labeledNode);

        return labelIndex;

    }

    removeNode(node: Statement){
        for(let i = 0; i < this.labeledNodes.length; i++){
            let n = this.labeledNodes[i];
            if(n.node == node){

                let index = this.program.statements.indexOf(node);
               
                if(index < this.program.statements.length - 1){
                    let newNode = this.program.statements[index + 1];
                    n.node = newNode;
                }

            } else {
                i++;
            }
        }
    }

    private registerJumpDestination(node: Statement, labelIndex?: number): number {

        if(labelIndex == null){
            labelIndex = this.maxLabelIndex++;
        }

        let label: LabeledNode = {
            node: node,
            labelIndex: labelIndex
        }

        this.labeledNodes.push(label);
        this.labelMap.set(labelIndex, label);

        return labelIndex;
    }

    public registerJumpNode(node: JumpNode, labelIndex?: number): number {

        if(labelIndex == null){
            labelIndex = this.maxLabelIndex++;
        }

        let ntr: nodeToResolve = {
            labelIndex: labelIndex,
            node: node
        }

        this.jumpNodesToResolve.push(ntr);

        return labelIndex;

    }

    resolveNodes(){
        for(let ln of this.labeledNodes){

            if(ln.position == null){
                ln.position = this.program.statements.indexOf(ln.node);
            } else {
                while(ln.position > this.program.statements.length - 1){
                    this.program.statements.push({
                        type: TokenType.noOp,
                        position: null
                    });
                }
                ln.node = this.program.statements[ln.position];
            }

        }

        for(let jn of this.jumpNodesToResolve){
            let dest = this.labelMap.get(jn.labelIndex);
            if(dest != null){
                jn.node.destination = dest.position;
            }
        }

        for(let sw of this.switchStatements){
            for(let dl of sw.destinationLabels){
                sw.destinationMap[dl.constant] = this.labelMap.get(dl.label).position;
            }
            sw.destinationLabels = null;
            if(sw.defaultDestination != null){
                sw.defaultDestination = this.labelMap.get(sw.defaultDestination).position;
            }
        }

    }

}

