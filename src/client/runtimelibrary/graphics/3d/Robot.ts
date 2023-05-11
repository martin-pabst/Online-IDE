import { Module } from "../../../compiler/parser/Module.js";
import { Klass } from "../../../compiler/types/Class.js";
import { booleanPrimitiveType, doublePrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../../compiler/types/Types.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "../FilledShape.js";
import { WorldHelper } from "../World.js";
import { Interpreter } from "../../../interpreter/Interpreter.js";
import { FilledShapeDefaults } from "../FilledShapeDefaults.js";
import { ShapeHelper } from "../Shape.js";
import { Boxes3d } from "./Boxes3d.js";
import { RobotBrick, RobotCubeFactory, RobotMarker } from "./RobotCubeFactory.js";
import * as PIXI from 'pixi.js';
import * as Pixi3d from 'pixi3d/pixi7';

export class RobotClass extends Klass {

    constructor(module: Module) {

        super("Robot", module, "Robot Karol");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let robotWorldType = <Klass>module.typeStore.getType("RobotWorld");

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("Robot", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, 1, 1, 5, 8)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter steht anfangs an der Stelle (1/1)', true));

        this.addMethod(new Method("Robot", new Parameterlist([
            { identifier: "startX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let startX: number = parameters[1].value;
                let startY: number = parameters[2].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, startX, startY, 5, 10)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter wird anfangs an die Stelle (startX/startY) gesetzt.', true));

        this.addMethod(new Method("Robot", new Parameterlist([
            { identifier: "startX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let startX: number = parameters[1].value;
                let startY: number = parameters[2].value;
                let worldX: number = parameters[3].value;
                let worldY: number = parameters[4].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, startX, startY, worldX, worldY)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter wird anfangs an die Stelle (startX/startY) gesetzt. Wenn die RobotWorld noch nicht instanziert ist, wird sie mit der Größe worldX * worldY neu erstellt.', true));

        this.addMethod(new Method("Robot", new Parameterlist([
            { identifier: "startX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "startY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "initialeWelt", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let startX: number = parameters[1].value;
                let startY: number = parameters[2].value;
                let initialeWelt: string = parameters[3].value;

                let rh = new RobotHelper(module.main.getInterpreter(), o, startX, startY, 0, 0, initialeWelt)
                o.intrinsicData["Robot"] = rh;

            }, false, false, 'Instanziert ein neues Robot-Objekt. Der Roboter wird anfangs an die Stelle (startX/startY) gesetzt. Wenn die RobotWorld noch nicht instanziert ist, wird sie auf Grundlage des Strings initialeWelt erstellt.', true));

        this.addMethod(new Method("getWelt", new Parameterlist([
        ]), robotWorldType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                return rh.robotWorldHelper.runtimeObject;

            }, false, false, 'Gibt das RobotWorld-Objekt zurück', false));

        this.addMethod(new Method("rechtsDrehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.direction.turnRight();
                rh.adjustAngle();

            }, false, false, 'Dreht den Roboter um 90° nach rechts.', false));

        this.addMethod(new Method("linksDrehen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.direction.turnLeft();
                rh.adjustAngle();

            }, false, false, 'Dreht den Roboter um 90° nach links.', false));

        this.addMethod(new Method("schritt", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.schritt();

            }, false, false, 'Lässt den Roboter einen Schritt nach vorne gehen.', false));

        this.addMethod(new Method("schritt", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.schritt()) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl Schritte nach vorne gehen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.hinlegen("rot");

            }, false, false, 'Lässt den Roboter einen roten Ziegel vor sich hinlegen.', false));

        this.addMethod(new Method("markeLöschen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeLöschen();

            }, false, false, 'Lässt den Roboter eine Marke, die direkt unter ihm liegt, löschen.', false));

        this.addMethod(new Method("markeSetzen", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeSetzen("gelb");

            }, false, false, 'Lässt den Roboter eine gelbe Marke direkt unter sich setzen.', false));

        this.addMethod(new Method("markeSetzen", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.markeSetzen(farbe);

            }, false, false, 'Lässt den Roboter eine Marke der angegebenen Farbe direkt unter sich setzen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.hinlegen("rot")) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl rote Ziegel vor sich hinlegen.', false));

        this.addMethod(new Method("hinlegen", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.hinlegen(farbe);

            }, false, false, 'Lässt den Roboter einen Ziegel der angegebenen Farbe vor sich hinlegen.', false));

        this.addMethod(new Method("aufheben", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                rh.aufheben();

            }, false, false, 'Lässt den Roboter einen roten Ziegel vor sich aufheben.', false));

        this.addMethod(new Method("aufheben", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                for (let i = 0; i < anzahl; i++) {
                    if (!rh.aufheben()) break;
                }

            }, false, false, 'Lässt den Roboter Anzahl rote Ziegel vor sich aufheben.', false));

        this.addMethod(new Method("warten", new Parameterlist([
            { identifier: "ZeitInMillisekunden", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            (parameters) => {

            }, false, false, "Pausiert das Programm für die angegebene Zeit in ms."));

        this.addMethod(new Method("langsam", new Parameterlist([
        ]), null,
            (parameters) => {
                module.main.getInterpreter().controlButtons.speedControl.setSpeedInStepsPerSecond(5);

            }, false, false, "Setzt die Ausführungsgeschwindigkeit auf 5 Programmschritte/Sekunde."));

        this.addMethod(new Method("schnell", new Parameterlist([
        ]), null,
            (parameters) => {
                module.main.getInterpreter().controlButtons.speedControl.setSpeedInStepsPerSecond("max");
            }, false, false, "Setzt die Ausführungsgeschwindigkeit auf 'maximal'."));

        this.addMethod(new Method("beenden", new Parameterlist([
        ]), null,
            (parameters) => {
                let console = module.main.getBottomDiv()?.console;
                if (console != null) {
                    console.writeConsoleEntry("Das Programm wurde durch einen Roboter angehalten.", null, "#0000ff");
                    console.showTab();
                }
                module.main.getInterpreter().stop();
            }, false, false, "Beendet das Programm."));

        this.addMethod(new Method("istWand", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istWand();

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter direkt vor einer Wand steht."));

        this.addMethod(new Method("nichtIstWand", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istWand();

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter nicht direkt vor einer Wand steht."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(null);

            }, false, false, "Gibt genau dann true zurück, wenn direkt vor dem Roboter mindestens ein Ziegel liegt."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(anzahl);

            }, false, false, "Gibt genau dann true zurück, wenn direkt vor dem Roboter genau Anzahl Ziegel liegen."));

        this.addMethod(new Method("istZiegel", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istZiegel(farbe);

            }, false, false, "Gibt genau dann true zurück, wenn auf dem Ziegelstapel direkt vor dem Roboter mindestens ein Ziegel mit der angegebenen Farbe liegt."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(null);

            }, false, false, "Gibt genau dann true zurück, wenn direkt vor dem Roboter kein Ziegel liegt."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(anzahl);

            }, false, false, "Gibt genau dann true zurück, wenn direkt vor dem Roboter nicht genau Anzahl Ziegel liegen."));

        this.addMethod(new Method("nichtIstZiegel", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istZiegel(farbe);

            }, false, false, "Gibt genau dann true zurück, wenn auf dem Ziegelstapel direkt vor dem Roboter kein Ziegel mit der angegebenen Farbe liegt."));

        this.addMethod(new Method("istMarke", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istMarke(farbe);

            }, false, false, "Gibt genau dann true zurück, wenn unter dem Roboter eine Marke in der angegebenen Farbe liegt."));

        this.addMethod(new Method("istMarke", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.istMarke(null);

            }, false, false, "Gibt genau dann true zurück, wenn unter dem Roboter eine Marke (egal in welcher Farbe) liegt."));

        this.addMethod(new Method("nichtIstMarke", new Parameterlist([
            { identifier: "Farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let farbe: string = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istMarke(farbe);

            }, false, false, "Gibt genau dann true zurück, wenn unter dem Roboter keine Marke in der angegebenen Farbe liegt."));

        this.addMethod(new Method("nichtIstMarke", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return !rh.istMarke(null);

            }, false, false, "Gibt genau dann true zurück, wenn unter dem Roboter keine Marke (egal in welcher Farbe) liegt."));

        let himmelsrichtungen = ["Norden", "Westen", "Süden", "Osten"];

        for (let i = 0; i < 4; i++) {
            let hr: string = himmelsrichtungen[i];

            this.addMethod(new Method("ist" + hr, new Parameterlist([
            ]), booleanPrimitiveType,
                (parameters) => {

                    let o: RuntimeObject = parameters[0].value;
                    let rh = <RobotHelper>o.intrinsicData["Robot"];
                    return rh.direction.index == i;

                }, false, false, "Gibt genau dann true zurück, wenn der Roboter nach " + hr + " blickt."));
        }

        this.addMethod(new Method("istLeer", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.hatSteine == 0;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter keinen Stein mit sich trägt."));

        this.addMethod(new Method("istVoll", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.hatSteine == rh.maxSteine;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter die maximale Anzahl von Steinen mit sich trägt."));

        this.addMethod(new Method("nichtIstLeer", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.hatSteine > 0;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter mindestens einen Stein mit sich trägt."));

        this.addMethod(new Method("hatZiegel", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.hatSteine > 0;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter mindestens einen Stein mit sich trägt."));

        this.addMethod(new Method("hatZiegel", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                return rh.hatSteine >= anzahl;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter mindestens Anzahl Steine mit sich trägt."));

        this.addMethod(new Method("nichtIstVoll", new Parameterlist([
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];
                return rh.hatSteine < rh.maxSteine;

            }, false, false, "Gibt genau dann true zurück, wenn der Roboter weniger als die maximale Anzahl von Steinen mit sich trägt."));

        this.addMethod(new Method("setzeAnzahlSteine", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                return rh.hatSteine = anzahl;

            }, false, false, "Befüllt den Rucksack des Roboters mit genau Anzahl Steinen."));

        this.addMethod(new Method("setzeRucksackgröße", new Parameterlist([
            { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let anzahl: number = parameters[1].value;
                let rh = <RobotHelper>o.intrinsicData["Robot"];

                return rh.maxSteine = anzahl;

            }, false, false, "Gibt dem Roboter einen Rucksack, der maximal Anzahl Steine fasst."));

    }

}

export class RobotWorldClass extends Klass {

    constructor(module: Module) {

        super("RobotWorld", module, "Welt für Robot Karol");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));

        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));

        this.addMethod(new Method("RobotWorld", new Parameterlist([
            { identifier: "worldX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "worldY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let worldX: number = parameters[1].value;
                let worldY: number = parameters[2].value;

                const interpreter = module.main.getInterpreter();

                let rh = new RobotWorldHelper(interpreter, o, worldX, worldY, null);
                o.intrinsicData["RobotWorldHelper"] = rh;

            }, false, false, 'Instanziert eine neue Robot-Welt', true));

        this.addMethod(new Method("RobotWorld", new Parameterlist([
            { identifier: "initialeWelt", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let initialeWelt: string = parameters[1].value;

                const interpreter = module.main.getInterpreter();

                let rh = new RobotWorldHelper(interpreter, o, 0, 0, initialeWelt);
                o.intrinsicData["RobotWorldHelper"] = rh;

            }, false, false, 'Instanziert eine neue Robot-Welt.', true));

            this.addMethod(new Method("setzeMaximalhöhe", new Parameterlist([
                { identifier: "Anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), booleanPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let anzahl: number = parameters[1].value;
                    let rh = <RobotWorldHelper>o.intrinsicData["RobotWorldHelper"];
    
                    return rh.maximumHeight = anzahl;
    
                }, false, false, "Ändert die maximale Höhe der Ziegelstapel."));
    
            this.addMethod(new Method("setzeZiegel", new Parameterlist([
                { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "anzahl", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let x: number = parameters[1].value;
                    let y: number = parameters[2].value;
                    let farbe: string = parameters[3].value;
                    let anzahl: number = parameters[4].value;
                    let rh = <RobotWorldHelper>o.intrinsicData["RobotWorldHelper"];
                    
                    if(x < 1 || x > rh.worldX || y < 1 || y > rh.worldY){
                        rh.interpreter.throwException(`Die Position (${x}/${y}) ist außerhalb der Weltgrenzen.`);
                        return;
                    }

                    for(let i = 0; i < anzahl; i++){
                        rh.addBrick(x-1, y-1, farbe);
                    }
    
                }, false, false, "Setzt Anzahl Ziegel an der angegebenen Position mit der angegebenen Farbe. Die x- und y-Koordinaten beginnen bei 1."));
    
            this.addMethod(new Method("setzeMarke", new Parameterlist([
                { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "farbe", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
            ]), null,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let x: number = parameters[1].value;
                    let y: number = parameters[2].value;
                    let farbe: string = parameters[3].value;
                    let rh = <RobotWorldHelper>o.intrinsicData["RobotWorldHelper"];

                    if(x < 1 || x > rh.worldX || y < 1 || y > rh.worldY){
                        rh.interpreter.throwException(`Die Position (${x}/${y}) ist außerhalb der Weltgrenzen.`);
                        return;
                    }

                    rh.setMarker(x-1, y-1, farbe);
    
                }, false, false, "Setzt einen Marker an der angegebenen Position mit der angegebenen Farbe. Die x- und y-Koordinaten beginnen bei 1."));
    
    
    }

}

export class RobotWorldHelper {

    worldHelper: WorldHelper;

    robotCubeFactory: RobotCubeFactory;
    camera: Pixi3d.Camera;
    displayObject: PIXI.DisplayObject;
    container3D: Pixi3d.Container3D;

    markers: RobotMarker[][] = [];    // x, y
    bricks: RobotBrick[][][] = [];   // x, y, height

    maximumHeight: number = 15;

    robots: RobotHelper[] = [];

    constructor(public interpreter: Interpreter, public runtimeObject: RuntimeObject,
        public worldX: number, public worldY: number, initialeWelt: string) {

        this.fetchWorld(interpreter);

        if (this.worldHelper.robotWorldHelper != null) {
            this.interpreter.throwException("Es wurde bereits ein Robot-World-Objekt instanziert. Davon kann es aber nur ein einziges geben. \nTipp: Jedes Robot-Objekt kann das Robot-World-Objekt mit der getRobotWorld() holen.");
            return;
        }

        this.worldHelper.robotWorldHelper = this;

        this.camera = new Pixi3d.Camera(<PIXI.Renderer>this.worldHelper.app.renderer);

        this.robotCubeFactory = new RobotCubeFactory(this.worldHelper, this.camera);

        this.markers = [];
        this.bricks = [];

        this.container3D = new Pixi3d.Container3D();
        this.displayObject = this.container3D;
        this.worldHelper.stage.addChild(this.displayObject);


        if (initialeWelt != null) {
            this.initFromString(initialeWelt);
        } else {
            this.initWorldArrays(worldX, worldY);
        }

        this.renderOrnamentsAndInitCamera();

    }

    adjustRobotPositions(x: number, y: number){
        for(let robot of this.robots){
            if(robot.x == x && robot.y == y){
                robot.model.y = this.getBrickCount(x, y) + 1.6;
            }
        }
    }

    initWorldArrays(worldX: number, worldY: number) {
        for (let x = 0; x < worldX; x++) {
            let markerColumn = [];
            this.markers.push(markerColumn);
            let brickColumn = [];
            this.bricks.push(brickColumn);
            for (let y = 0; y < worldY; y++) {
                markerColumn.push(null);
                brickColumn.push([]);
            }
        }
    }

    fetchWorld(interpreter: Interpreter) {
        let worldHelper = interpreter.worldHelper;
        if (worldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("World").type);
            worldHelper = new WorldHelper(800, 600, interpreter.moduleStore.getModule("Base Module"), w);
            w.intrinsicData["World"] = worldHelper;
            interpreter.worldHelper = worldHelper;
        }
        this.worldHelper = worldHelper;
    }


    renderOrnamentsAndInitCamera() {
        (<PIXI.Renderer>this.worldHelper.app.renderer).background.color = 0x8080ff;

        let gp = this.robotCubeFactory.getGrassPlane(this.worldX, this.worldY);
        this.container3D.addChild(gp);

        let deep: number = 0;
        let radius: number = 0;
        this.robotCubeFactory.getSidePlanes(this.worldX, this.worldY, "robot#3", radius, deep++)
            .forEach(p => { this.container3D.addChild(p); });

            this.robotCubeFactory.getSidePlanes(this.worldX, this.worldY, "robot#10", radius, deep++)
                .forEach(p => { this.container3D.addChild(p); });

        this.robotCubeFactory.makeClouds(this.container3D, 60, this.worldX/2, this.worldY/2);

        this.robotCubeFactory.makePlane(this.container3D, this.worldX/2, -4, this.worldY/2, 3000, 3000, 
        new Pixi3d.Color(55.0/255, 174.0/255, 77.0/255));

        let northSprite = this.robotCubeFactory.makeSprite3d("robot#11", this.container3D);
        // northSprite.position.set(this.worldX + 6, 1, this.worldY - 1);
        northSprite.position.set(2*this.worldX + 1, -1, 2*this.worldY - 6);
        northSprite.scale.set(257.0/40, 1, 1);
        northSprite.rotationQuaternion.setEulerAngles(0, 90, 0);

        let control = new Pixi3d.CameraOrbitControl(<any>this.worldHelper.app.view, this.camera);
        control.angles.x = 45;
        control.angles.y = -20;
        control.target = { x: this.worldX - 1, y: 0, z: this.worldY - 1 }
        control.distance = Math.max(this.worldX, this.worldY) * 2.3;

    }

    addBrick(x: number, y: number, farbe: string): boolean {
        let oldHeight = this.bricks[x][y].length;
        if (oldHeight < this.maximumHeight) {
            let brick = this.robotCubeFactory.getBrick(farbe);
            this.setToXY(x, y, oldHeight, brick);
            this.bricks[x][y].push(brick);
            this.container3D.addChild(brick);
            this.adjustMarkerHeight(x, y);
            this.adjustRobotPositions(x, y);
            return true;
        } else {
            return false;
        }
    }

    removeBrick(x: number, y: number): boolean {
        if (this.bricks[x][y].length > 0) {
            let brick = this.bricks[x][y].pop();
            brick.destroy();
            this.adjustMarkerHeight(x, y);
            this.adjustRobotPositions(x, y);
        } else {
            return false;
        }

    }

    getBrickCount(x: number, y: number) {
        return this.bricks[x][y].length;
    }

    hasBrickColor(x: number, y: number, farbe: string): boolean {
        for (let brick of this.bricks[x][y]) {
            if (brick.farbe == farbe) return true;
        }
        return false;
    }

    getMarkerColor(x: number, y: number): string {
        let marker = this.markers[x][y];
        if (marker == null) return null;
        return marker.farbe;
    }

    setMarker(x: number, y: number, farbe: string) {
        if (this.markers[x][y] != null) {
            this.markers[x][y].destroy();
        }
        let marker = this.robotCubeFactory.getMarker(farbe);
        this.markers[x][y] = marker;
        this.container3D.addChild(marker);
        this.setToXY(x, y, 0, marker);
        this.adjustMarkerHeight(x, y);
    }

    removeMarker(x: number, y: number): boolean {
        let marker = this.markers[x][y];
        if (marker == null) {
            return false;
        } else {
            this.markers[x][y] = null;
            marker.destroy();
            return true;
        }
    }

    adjustMarkerHeight(x: number, y: number) {
        let marker = this.markers[x][y];
        if (marker != null) {
            let height = this.bricks[x][y].length
            marker.y = height + 0.1;
        }
    }

    clear() {
        for (let x = 0; x < this.bricks.length; x++) {
            for (let y = 0; y < this.bricks[x].length; y++) {
                let brickList = this.bricks[x][y];
                while (brickList.length > 0) {
                    brickList.pop().destroy();
                }
            }
        }

        for (let x = 0; x < this.markers.length; x++) {
            for (let y = 0; y < this.markers[x].length; y++) {
                let marker = this.markers[x][y];
                if (marker != null) {
                    this.markers[x][y] = null;
                    marker.destroy();
                }
            }
        }
    }

    setDimensions(worldX: number, worldY: number) {
        this.clear();

        this.worldX = worldX;
        this.worldY = worldY;

        this.markers = [];
        this.bricks = [];
        for (let x = 0; x < worldX; x++) {
            let markerColumn = [];
            this.markers.push(markerColumn);
            let brickColumn = [];
            this.bricks.push(brickColumn);
            for (let y = 0; y < worldY; y++) {
                markerColumn.push(null);
                brickColumn.push([]);
            }
        }
    }

    getNumberOfBricks(x: number, y: number) {
        return this.bricks[x][y].length;
    }

    /**
     * 
     * @param initString 
     * " ": empty 
     * "_": no brick, yellow marker
     * "Y", "G", "B", "R": switch marker color
     * "y", "g", "b", "r": switch brick color
     * "1", ..., "9": 1, ..., 9 bricks 
     * "1m", ..., "9m": 1, ..., 9 bricks with markers on them
     */
    initFromString(initString: string) {

        let lowerCaseCharToColor = { "r": "rot", "g": "grün", "b": "blau", "y": "gelb" };
        let upperCaseCharToColor = { "R": "rot", "G": "grün", "B": "blau", "Y": "gelb" };
        let digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

        this.clear();
        let rows = initString.split("\n");
        let maxColumns = 0;
        rows.forEach((row) => { let rowLength = this.rowLength(row); if (rowLength > maxColumns) maxColumns = rowLength });
        this.initWorldArrays(maxColumns, rows.length);

        this.worldX = maxColumns;
        this.worldY = rows.length;

        let c1: string;
        let c2: string;
        let brickColor = "rot";
        let markerColor = "gelb";

        for (let y = 0; y < rows.length; y++) {
            let row = rows[y];
            let x = 0;
            let pos = 0;
            while (pos < row.length) {
                c1 = row.charAt(pos);
                c2 = pos < row.length - 1 ? row.charAt(pos + 1) : null;
                pos++;
                if (lowerCaseCharToColor[c1] != null) {
                    brickColor = lowerCaseCharToColor[c1];
                    continue;
                }
                if (upperCaseCharToColor[c1] != null) {
                    markerColor = upperCaseCharToColor[c1];
                    continue;
                }
                let index = digits.indexOf(c1);
                if (index >= 0) {
                    for (let i = 0; i < index + 1; i++) {
                        this.addBrick(x, y, brickColor);
                    }
                    if (c2 == "m") {
                        this.setMarker(x, y, markerColor);
                        pos++;
                    }
                    x++;
                    continue;
                }
                if (c1 == " ") {
                    x++;
                    continue;
                }
                if (c1 == "_") {
                    this.setMarker(x, y, markerColor);
                    x++;
                    continue;
                }
            }
        }


    }

    rowLength(row: string) {
        let l: number = 0;
        let forwardChars = " _1234567890";

        for (let i = 0; i < row.length; i++) {
            if (forwardChars.indexOf(row.charAt(i)) >= 0) {
                l++;
            }
        }
        return l;
    }

    setToXY(x: number, y: number, height: number, mesh: Pixi3d.Mesh3D) {
        mesh.x = 2 * (this.worldX - x - 1);
        mesh.z = 2 * (this.worldY - y - 1);
        mesh.y = height;
    }

    // Wird von WorldHelper aufgerufen
    destroy() {

    }

    gibtFarbe(farbe: string): boolean {
        return this.robotCubeFactory.farben.indexOf(farbe) >= 0;
    }

}


class Direction {
    names: string[] = ["top", "right", "bottom", "left"];
    deltas: { dx: number, dy: number }[] = [{ dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }];
    angles: number[] = [0, 90, 180, 270];

    public index: number = 2; // top

    turnRight() {
        this.index = (this.index - 1 + 4) % 4;
    }

    turnLeft() {
        this.index = (this.index + 1 + 4) % 4;
    }

    getAngle() {
        return this.angles[this.index];
    }

    getDeltas() {
        return this.deltas[this.index];
    }

}

export class RobotHelper {

    robotWorldHelper: RobotWorldHelper;
    model: Pixi3d.Model;
    x: number;
    y: number;

    hatSteine: number = 10000000;
    maxSteine: number = 100000000;

    direction: Direction = new Direction();

    constructor(private interpreter: Interpreter, private runtimeObject: RuntimeObject,
        startX: number, startY: number,
        worldX: number, worldY: number,
        initialeWelt: string = null
    ) {

        this.fetchRobotWorld(interpreter, worldX, worldY, initialeWelt);
        this.robotWorldHelper.robots.push(this);

        this.render();

        this.moveTo(startX - 1, startY - 1);
        this.adjustAngle();

    }

    fetchRobotWorld(interpreter: Interpreter, worldX: number, worldY: number, initialeWelt: string) {
        let worldHelper = interpreter.worldHelper;
        this.robotWorldHelper = worldHelper?.robotWorldHelper;

        if (this.robotWorldHelper == null) {
            let w: RuntimeObject = new RuntimeObject(<Klass>interpreter.moduleStore.getType("RobotWorld").type);
            this.robotWorldHelper = new RobotWorldHelper(interpreter, w, worldX, worldY, initialeWelt);
            w.intrinsicData["RobotWorldHelper"] = this.robotWorldHelper;
        }

    }

    render(): void {

        //@ts-ignore
        let robot = Pixi3d.Model.from(PIXI.Assets.get("steve"));
        robot.scale.set(0.1);
        for (let mesh of robot.meshes) {
            let sm = <Pixi3d.StandardMaterial>mesh.material;
            sm.camera = this.robotWorldHelper.camera;
            sm.exposure = 0.5;
            sm.lightingEnvironment = this.robotWorldHelper.robotCubeFactory.lightingEnvironment;
        }
        this.robotWorldHelper.container3D.addChild(robot);
        this.model = robot;

    };

    crop(n: number, min: number, max: number): number {
        if (n < min) n = min;
        if (n > max) n = max;
        return n;
    }

    moveTo(x: number, y: number) {
        const rw = this.robotWorldHelper;
        x = this.crop(x, 0, rw.worldX - 1);
        y = this.crop(y, 0, rw.worldY - 1);

        this.model.x = 2 * (rw.worldX - x - 1);
        this.model.z = 2 * (rw.worldY - y - 1);
        this.model.y = rw.getNumberOfBricks(x, y) + 1.6;

        this.x = x;
        this.y = y;
    }

    adjustAngle() {
        this.model.transform.rotationQuaternion.setEulerAngles(0, this.direction.getAngle(), 0);
    }

    schritt(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter ist gegen eine Wand geprallt!");
            return false;
        }

        let oldHeight = rw.getNumberOfBricks(this.x, this.y);
        let newHeight = rw.getNumberOfBricks(newX, newY);

        if (newHeight < oldHeight - 1) {
            this.interpreter.throwException("Der Roboter kann maximal einen Ziegel nach unten springen.");
            return false;
        }

        if (newHeight > oldHeight + 1) {
            this.interpreter.throwException("Der Roboter kann maximal einen Ziegel hoch springen.");
            return false;
        }

        this.moveTo(newX, newY);
        return true;
    }

    hinlegen(farbe: string): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter steht direkt vor einer Wand. Da kann er keine Ziegel hinlegen.");
            return false;
        }

        farbe = farbe.toLocaleLowerCase();
        if (!rw.gibtFarbe(farbe)) {
            this.interpreter.throwException("Es gibt nur Ziegel der Farben " + rw.robotCubeFactory.farben.join(", ") + ". Die Farbe " + farbe + " ist nicht darunter.");
            return false;
        }

        if (this.hatSteine == 0) {
            this.interpreter.throwException("Der Roboter hat keine Ziegel mehr bei sich und kann daher keinen mehr hinlegen.");
            return false;
        }

        if(rw.bricks[newX][newY].length >= rw.maximumHeight){
            this.interpreter.throwException("Der Ziegelstapel darf die maximale Höhe " + rw.maximumHeight + " nicht überschreiten.");
            return false;
        }

        rw.addBrick(newX, newY, farbe);
        this.hatSteine--;

        return true;
    }

    aufheben(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            this.interpreter.throwException("Der Roboter steht direkt vor einer Wand. Da kann er keinen Ziegel aufheben.");
            return false;
        }

        if (rw.getNumberOfBricks(newX, newY) < 1) {
            this.interpreter.throwException("Vor dem Roboter liegt kein Ziegel, er kann daher keinen aufheben.");
            return false;
        }

        rw.removeBrick(newX, newY);

        if (this.hatSteine < this.maxSteine) {
            this.hatSteine++;
        } else {
            this.interpreter.throwException("Der Roboter kann nicht mehr Steine aufheben, da er keinen Platz mehr in seinem Rucksack hat.");
            return false;
        }

        return true;
    }

    markeSetzen(farbe: string) {
        const rw = this.robotWorldHelper;
        farbe = farbe.toLocaleLowerCase();

        if (!rw.gibtFarbe(farbe)) {
            this.interpreter.throwException("Es gibt nur Marken der Farben " + rw.robotCubeFactory.farben.join(", ") + ". Die Farbe " + farbe + " ist nicht darunter.");
            return false;
        }

        rw.setMarker(this.x, this.y, farbe);
    }

    markeLöschen() {
        const rw = this.robotWorldHelper;

        rw.removeMarker(this.x, this.y);
    }

    istWand(): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        return (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY)

    }

    istZiegel(param: number | string | null): boolean {
        let deltas = this.direction.getDeltas();
        let newX = this.x + deltas.dx;
        let newY = this.y + deltas.dy;
        const rw = this.robotWorldHelper;

        if (newX < 0 || newX >= rw.worldX || newY < 0 || newY >= rw.worldY) {
            return false;
        }

        if (param == null) return rw.getBrickCount(newX, newY) > 0;

        if (typeof param == "string") {
            return rw.hasBrickColor(newX, newY, param.toLocaleLowerCase());
        }

        return rw.bricks[newX][newY].length == param;

    }

    istMarke(param: string | null): boolean {
        const rw = this.robotWorldHelper;
        let marke = rw.markers[this.x][this.y];
        if (param == null) return marke != null;

        if (typeof param == "string") {
            return marke != null && marke.farbe == param.toLocaleLowerCase();
        }

        return false;
    }


}
