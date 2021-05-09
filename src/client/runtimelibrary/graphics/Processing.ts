import { TokenType } from "../../compiler/lexer/Token.js";
import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { charPrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Type, Value, Variable, Attribute } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";

// import * as p5 from "p5";
type p5 = any;

export class ProcessingClass extends Klass {

    constructor(public module: Module) {

        super("PApplet", module, "Processing-Applet")

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        this.documentation = "Wenn Du Deine Klasse von PApplet ableitest (class Test extends PApplet{...}), kannst Du auf diese Weise ein Processing-Applet erstellen (siehe https://processing.org), indem Du ihre Methoden draw(), mousePressed(), usw. überschreibst und mit Inhalt füllst. Du startest das Applet, indem Du ein Objekt Deiner Klasse instanzierst und davon die main-Methode aufrufst: new Test().main();"

        // this.addAttribute(new Attribute("mouseX", intPrimitiveType, (object) => { object.value = Math.round(module.main.getInterpreter().processingHelper.p5o.mouseX) },
        //     false, Visibility.public, true, "aktuelle x-Koordinate des Mauszeigers"));

        // this.addAttribute(new Attribute("mouseY", intPrimitiveType, (object) => { object.value = Math.round(module.main.getInterpreter().processingHelper.p5o.mouseY) },
        //     false, Visibility.public, true, "aktuelle y-Koordinate des Mauszeigers"));

        let intConstants: string[][] = [["mouseX", "aktuelle x-Koordinate des Mauszeigers"], ["mouseY", "aktuelle y-Koordinate des Mauszeigers"],
        ["pMouseX", "x-Koordinate des Mauszeigers im vorhergehenden Frame"], ["pMouseY", "y-Koordinate des Mauszeigers im vorhergehenden Frame"],
        ["LEFT", "links"], ["CENTER", "Mitte"], ["RIGHT", "rechts"], ["TOP", "obenbündig"], ["BASELINE", "bündig auf der Grundlinie"], ["BOTTOM", "untenbündig"],
        ["width", "Breite des Zeichenbereichs"], ["height", "Höhe des Zeichenbereichs"], ["keyCode", "Zahlencode der zuletzt gedrückten Taste"],
        ["mouseButton", "zuletzt gedrückte Maustaste, kann die Werte LEFT, RIGHT und CENTER annehmen"],
        ["CORNER", "Mode zum Zeichnen von Rechtecken"], ["CORNERS", "Mode zum Zeichnen von Rechtecken"], ["RADIUS", "Mode zum Zeichnen von Rechtecken"],

        ["POINTS", "zeichne nachfolgend Einzelpunkte"],
        ["LINES", "zeichne nachfolgend einzelne Linien"],
        ["TRIANGLES", "zeichne nachfolgend einzelne Dreiecke"],
        ["TRIANGLE_STRIP", "zeichne nachfolgend einen Triangle-Strip"],
        ["TRIANGLE_FAN", "zeichne nachfolgend einen Triangle-Fan"],
        ["QUADS", "zeichne nachfolgend Vierecke"],
        ["QUAD_STRIP", "zeichne nachfolgend einen Quad-Strip"],
        ["TESS", "zeichne nachfolgend ein TESS - geht nur bei createCanvas(width, height, WEBGL)"],
        ["CLOSE", "endShape(CLOSE) schließt den Linienzug"],

        ["DEGREES", "angleMode(DEGREES) sorgt dafür, dass nachfolgende Winkelangaben in Grad interpretiert werden."],
        ["RADIANS", "angleMode(RADIANS) sorgt dafür, dass nachfolgende Winkelangaben im Bogenmaß interpretiert werden."],

        ];

        intConstants.forEach(constant => {
            this.addAttribute(new Attribute(constant[0], intPrimitiveType, (object) => { object.value = module.main.getInterpreter().processingHelper.p5o[constant[0]] },
                false, Visibility.public, true, constant[1]));
        });

        let stringConstants: string[][] = [["WEBGL", "WebGL-Renderer zur 3D-Ausgabe"], ["P2D", "Renderer zur zweidimensionalen Ausgabe"],
        ["RGB", "Color-Mode RGB (rot, grün, blau)"], ["HSL", "Color-Mode HSL"], ["HSB", "Color-Mode HSB"]
        ];

        stringConstants.forEach(constant => {
            this.addAttribute(new Attribute(constant[0], stringPrimitiveType, (object) => { object.value = module.main.getInterpreter().processingHelper.p5o[constant[0]] },
                false, Visibility.public, true, constant[1]));
        });

        this.addAttribute(new Attribute("key", charPrimitiveType, (object) => { object.value = module.main.getInterpreter().processingHelper.p5o.key },
            false, Visibility.public, true, "letzte gedrückte Taste"));


        this.addMethod(new Method("PApplet", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = this.getProcessingHelper(o);
                o.intrinsicData["Processing"] = ph;

            }, false, false, "Legt eine neues Processing-Applet an", true));

        this.addMethod(new Method("main", new Parameterlist([
            { identifier: "name", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];

                // ph.main legt das aktuelle Programm (a) des Interpreters auf den programStack
                // und setzt als currentProgram ein neues (b). Nach Ende dieser Methode erhöht
                // der Interpreter currentProgramPosition im Glauben, (a) sei aktiv. Daher ist
                // die gespeicherte ProgramPosition von (a) um eins zu niedrig (und wird daher gleich noch
                // vor ph.main(); erhöht) und die bei (b) wird irrtümlich nach Rückkehr von dieser Methode 
                // um eins erhöht. Sie wird daher nach Ausführung von ph.main() um eins erniedrigt, damit
                // der Effekt kompensiert wird. 
                let interpreter = module.main.getInterpreter();
                interpreter.currentProgramPosition++;
                ph.main();
                interpreter.currentProgramPosition--;

            }, false, false, 'Startet das Processing-Applet.', false));

        this.addMethod(new Method("main", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];

                let interpreter = module.main.getInterpreter();
                interpreter.currentProgramPosition++;
                ph.main();
                interpreter.currentProgramPosition--;

            }, false, false, 'Startet das Processing-Applet.', false));

        this.addMethod(new Method("loop", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];

                ph.loop();

            }, false, false, 'Startet nach noLoop() die Renderer-Loop wieder neu, so dass draw() wieder periodisch aufgerufen wird.', false));

        this.addMethod(new Method("noLoop", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];

                ph.noLoop();

            }, false, false, 'Stoppt die Render-Loop, so dass draw() nicht mehr aufgerufen wird. Kann mit loop() wieder gestartet werden.', false));

        this.addMethod(new Method("size", new Parameterlist([
            { identifier: "width", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];
                let width: number = parameters[1].value;
                let height: number = parameters[2].value;

                ph.createCanvas(width, height)

            }, false, false, 'Definiert die Abmessungen des Processing-Ausgabebereichs in Pixeln.', false));

        this.addMethod(new Method("createCanvas", new Parameterlist([
            { identifier: "width", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];
                let width: number = parameters[1].value;
                let height: number = parameters[2].value;

                ph.createCanvas(width, height)

            }, false, false, 'Definiert die Abmessungen des Processing-Ausgabebereichs in Pixeln.', false));

        this.addMethod(new Method("createCanvas", new Parameterlist([
            { identifier: "width", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "renderer", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let ph: ProcessingHelper = o.intrinsicData["Processing"];
                let width: number = parameters[1].value;
                let height: number = parameters[2].value;
                let renderer: string = parameters[3].value;

                ph.renderer = renderer;
                ph.createCanvas(width, height);

            }, false, false, 'Definiert die Abmessungen des Processing-Ausgabebereichs in Pixeln.', false));

        this.addMethod(new Method("draw", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die draw-Methode wird 60-mal pro Sekunde aufgerufen ("Render-Loop"). Die Render-Loop kann mit der Methode noLoop() gestoppt und mit loop() wieder gestartet werden. redraw() ruft (im gestoppten Zustand) draw genau ein Mal auf.', false));

        this.addMethod(new Method("settings", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die settings-Methode wird aufgerufen, nachdem das Processing-Applet durch Aufruf der Methode main gestartet wurde. Im Unterschied zur Original Java-Version von Processing hat die Methode settings hier keine andere Bewandtnis als die - unmittelbar darauf aufgerufene - Methode setup. In beiden Methoden kann man bspw. mit createCanvas(width, height) das Koordinatensystem einrichten und Figuren zeichnen.', false));

        this.addMethod(new Method("setup", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die setup-Methode wird beim Programmstart nach der settings-Methode aufgerufen. Im Unterschied zur Original Java-Version von Processing hat die Methode setup hier keine andere Bewandtnis als die - unmittelbar davor aufgerufene - Methode settings. In beiden Methoden kann man bspw. mit createCanvas(width, height) das Koordinatensystem einrichten und Figuren zeichnen.', false));

        this.addMethod(new Method("mousePressed", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mousePressed-Methode wird immer dann aufgerufen, wenn gerade eine Maustaste heruntergedrückt wurde. Die aktuellen Koordinaten des Mauszeigers liegen in den Attributen mouseX und mouseY vor, die gerade heruntergedrückte Maustaste kann dem Attribut mouseButton entnommen werden.', false));

        this.addMethod(new Method("mouseReleased", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseReleased-Methode wird immer dann aufgerufen, wenn gerade eine Maustaste losgelassen wurde. Die aktuellen Koordinaten des Mauszeigers liegen in den Attributen mouseX und mouseY vor, die gerade losgelassene Maustaste kann dem Attribut mouseButton entnommen werden.', false));

        this.addMethod(new Method("mouseClicked", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseClicked-Methode wird immer dann aufgerufen, wenn eine Maustaste auf dem Zeichenbereich gedrückt und anschließend losgelassen wurde. Die aktuellen Koordinaten des Mauszeigers liegen in den Attributen mouseX und mouseY vor, die gerade losgelassene Maustaste kann dem Attribut mouseButton entnommen werden.', false));

        this.addMethod(new Method("mouseDragged", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseDragged-Methode wird immer dann aufgerufen, wenn eine Maustaste gerade heruntergedrückt ist und die Position des Mauszeigers sich verändert hat. Die aktuellen Koordinaten des Mauszeigers liegen in den Attributen mouseX und mouseY vor, die zuletzt gedrückte Maustaste kann dem Attribut mouseButton entnommen werden.', false));

        this.addMethod(new Method("mouseMoved", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseMoved-Methode wird immer dann aufgerufen, wenn die Position des Mauszeigers sich verändert hat. Die aktuellen Koordinaten des Mauszeigers liegen in den Attributen mouseX und mouseY vor, die zuletzt gedrückte Maustaste kann dem Attribut mouseButton entnommen werden.', false));

        this.addMethod(new Method("mouseEntered", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseEntered-Methode wird immer dann aufgerufen, wenn der Mauszeiger von außen neu in den Zeichenbereich hineinfährt.', false));

        this.addMethod(new Method("mouseExited", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die mouseExited-Methode wird immer dann aufgerufen, wenn der Mauszeiger den Zeichnbereich gerade verlassen hat.', false));

        this.addMethod(new Method("keyPressed", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die keyPressed-Methode wird immer dann aufgerufen, wenn eine Taste gerade heruntergedrückt wurde. Informationen zur Taste können den Attributen key (String) und keyCode (int) entnommen werden.', false));

        this.addMethod(new Method("keyReleased", new Parameterlist([
        ]), voidPrimitiveType,
            null, false, false, 'Die keyReleased-Methode wird immer dann aufgerufen, wenn eine Taste gerade losgelassen wurde. Informationen zur Taste können den Attributen key (String) und keyCode (int) entnommen werden.', false));



        // this.addMethod(new Method("rect", new Parameterlist([
        //     { identifier: "left", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        //     { identifier: "top", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        //     { identifier: "width", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        //     { identifier: "height", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        // ]), voidPrimitiveType,
        //     (parameters) => {

        //         let o: RuntimeObject = parameters[0].value;
        //         let ph: ProcessingHelper = o.intrinsicData["Processing"];
        //         let left: number = parameters[1].value;
        //         let top: number = parameters[2].value;
        //         let width: number = parameters[3].value;
        //         let height: number = parameters[4].value;

        //         ph.addStatement((p5o) => p5o.rect(left, top, width, height));


        //     }, false, false, 'Zeichnet ein Rechteck. (left, top) ist die linke obere Ecke, width die Breite und height die Höhe des Rechtecks.', false));


        /**
         * Setzen von Farben
         */
        this.addProcessingMethod('clear', [], [],
            'Löscht die Zeichenfläche.');

        this.addProcessingMethod('background', ['rgb'], floatPrimitiveType,
            'Übermalt die komplette Zeichenfläche mit der übergebenen Farbe.');

        this.addProcessingMethod('background', ['colorAsString'], stringPrimitiveType,
            "Übermalt die komplette Zeichenfläche mit der übergebenen Farbe. Übergeben wird eine Zeichenkette der Form 'rgb(0,0,255)' oder 'rgb(0%, 0%, 100%)' oder 'rgba(0, 0, 255, 1)' oder 'rgba(0%, 0%, 100%, 1)' und all diese Kombinationen statt rgb auch mit hsl und hsb.", stringPrimitiveType);

        this.addProcessingMethod('background', ['v1', 'v2', 'v3'], floatPrimitiveType,
            'Übermalt die komplette Zeichenfläche mit der übergebenen Farbe. v1, v2 und v3 sind - abhängig vom aktuellen color mode - rot, grün und blauwert oder Farbe, Sättigung und Helligkeit');

        this.addProcessingMethod('fill', ['rgb'], intPrimitiveType,
            'Setzt die Füllfarbe.');

        this.addProcessingMethod('fill', ['rgb'], stringPrimitiveType,
            'Setzt die Füllfarbe.');

        this.addProcessingMethod('fill', ['rgb', 'alpha'], [intPrimitiveType, floatPrimitiveType],
            'Setzt die Füllfarbe.');

        this.addProcessingMethod('fill', ['gray'], floatPrimitiveType,
            'Setzt die Füllfarbe.');

        this.addProcessingMethod('fill', ['v1', 'v2', 'v3'], floatPrimitiveType,
            'Setzt die Füllfarbe. v1, v2 und v3 sind - abhängig vom aktuellen color mode - rot, grün und blauwert oder Farbe, Sättigung und Helligkeit');

        this.addProcessingMethod('fill', ['v1', 'v2', 'v3', 'alpha'], floatPrimitiveType,
            'Setzt die Füllfarbe. v1, v2 und v3 sind - abhängig vom aktuellen color mode - rot, grün und blauwert oder Farbe, Sättigung und Helligkeit');

        this.addProcessingMethod('noFill', [], [],
            'Die nachfolgend gezeichneten Figuren werden nicht gefüllt.');

        this.addProcessingMethod('stroke', ['rgb'], intPrimitiveType,
            'Setzt die Linienfarbe.');

        this.addProcessingMethod('stroke', ['rgb'], stringPrimitiveType,
            'Setzt die Linienfarbe.');

        this.addProcessingMethod('stroke', ['rgb', 'alpha'], [intPrimitiveType, floatPrimitiveType],
            'Setzt die Linienfarbe.');

        this.addProcessingMethod('stroke', ['gray'], floatPrimitiveType,
            'Setzt die Linienfarbe.');

        this.addProcessingMethod('stroke', ['v1', 'v2', 'v3'], floatPrimitiveType,
            'Setzt die Linienfarbe. v1, v2 und v3 sind - abhängig vom aktuellen color mode - rot, grün und blauwert oder Farbe, Sättigung und Helligkeit');

        this.addProcessingMethod('stroke', ['v1', 'v2', 'v3', 'alpha'], floatPrimitiveType,
            'Setzt die Linienfarbe. v1, v2 und v3 sind - abhängig vom aktuellen color mode - rot, grün und blauwert oder Farbe, Sättigung und Helligkeit');

        this.addProcessingMethod('strokeWeight', ['weight'], floatPrimitiveType,
            'Setzt die Linienbreite.');

        this.addProcessingMethod('noStroke', [], [],
            'Die nachfolgend gezeichneten Figuren werden ohne Rand gezeichnet.');

        this.addProcessingMethod('color', ['gray'], floatPrimitiveType,
            'Gibt den Grauton als String-kodierte Farbe zurück.', stringPrimitiveType);

        this.addProcessingMethod('color', ['colorAsString'], stringPrimitiveType,
            "Gibt die Farbe zurück. Übergeben kann eine Zeichenkette der Form 'rgb(0,0,255)' oder 'rgb(0%, 0%, 100%)' oder 'rgba(0, 0, 255, 1)' oder 'rgba(0%, 0%, 100%, 1)' und all diese Kombinationen statt rgb auch mit hsl und hsb.", stringPrimitiveType);

        this.addProcessingMethod('color', ['gray', 'alpha'], floatPrimitiveType,
            'Gibt den Grauton als String-kodierte Farbe zurück.', stringPrimitiveType);

        this.addProcessingMethod('color', ['v1', 'v2', 'v3'], floatPrimitiveType,
            'Gibt die aus v1, v2, v3 gebildete Farbe String-kodiert zurück.', stringPrimitiveType);

        this.addProcessingMethod('color', ['v1', 'v2', 'v3', 'alpha'], floatPrimitiveType,
            'Gibt die aus v1, v2, v3 und alpha gebildete Farbe String-kodiert zurück.', stringPrimitiveType);

        this.addProcessingMethod('lerpColor', ['colorA', 'colorB', 't'], [stringPrimitiveType, stringPrimitiveType, floatPrimitiveType],
            'Gibt eine Zwischenfarbe zwischen colorA und colorB zurück. t == 0 bedeutet: colorA, t == 1 bedeutet: colorB, t == 0.5 bedeutet: genau zwischen beiden, usw.', stringPrimitiveType);

        this.addProcessingMethod('colorMode', ['mode'], stringPrimitiveType,
            'Setzt den Modus, in dem nachfolgende Aufrufe von color(...) interpretiert werden. Möglich sind die Werte RGB, HSL und HSB.');

        this.addProcessingMethod('colorMode', ['mode', 'max'], [stringPrimitiveType, floatPrimitiveType],
            'Setzt den Modus, in dem nachfolgende Aufrufe von color(...) interpretiert werden. Möglich sind die Werte RGB, HSL und HSB für Mode. Max ist der Maximalwert jeder Farbkomponente.');

        this.addProcessingMethod('colorMode', ['mode', 'max1', 'max2', 'max3'], [stringPrimitiveType, floatPrimitiveType, floatPrimitiveType, floatPrimitiveType],
            'Setzt den Modus, in dem nachfolgende Aufrufe von color(...) interpretiert werden. Möglich sind die Werte RGB, HSL und HSB für Mode. Max ist der Maximalwert jeder Farbkomponente.');

        this.addProcessingMethod('colorMode', ['mode', 'max1', 'max2', 'max3', 'maxAlpha'], [stringPrimitiveType, floatPrimitiveType, floatPrimitiveType, floatPrimitiveType, floatPrimitiveType],
            'Setzt den Modus, in dem nachfolgende Aufrufe von color(...) interpretiert werden. Möglich sind die Werte RGB, HSL und HSB für Mode. Max ist der Maximalwert jeder Farbkomponente.');



        /**
         * Zeichnen geometrischer Figuren
         */
        this.addProcessingMethod('rectMode', ['mode'], stringPrimitiveType,
            'Setzt den Modus, in dem nachfolgende Aufrufe von rect(...) interpretiert werden. Möglich sind die Werte CORNER, CORNERS, RADIUS und CENTER.');

        this.addProcessingMethod('rect', ['left', 'top', 'width', 'height'], floatPrimitiveType,
            'Zeichnet ein Rechteck. (left, top) ist die linke obere Ecke, width die Breite und height die Höhe des Rechtecks.');

        this.addProcessingMethod('rect', ['left', 'top', 'width', 'height', 'radius'], floatPrimitiveType,
            'Zeichnet ein Rechteck mit abgerundeten Ecken. (left, top) ist die linke obere Ecke, width die Breite und height die Höhe des Rechtecks.');

        this.addProcessingMethod('rect', ['left', 'top', 'width', 'height', 'radius1', 'radius2', 'radius3', 'radius4'], floatPrimitiveType,
            'Zeichnet ein Rechteck mit abgerundeten Ecken. (left, top) ist die linke obere Ecke, width die Breite und height die Höhe des Rechtecks.');

        this.addProcessingMethod('square', ['left', 'top', 'width'], floatPrimitiveType,
            'Zeichnet ein Quadrat. (left, top) ist die linke obere Ecke, width Seitenlänge des Quadrats.');

        this.addProcessingMethod('square', ['left', 'top', 'width', 'radius'], floatPrimitiveType,
            'Zeichnet ein Quadrat mit abgerundeten Ecken. (left, top) ist die linke obere Ecke, width Seitenlänge des Quadrats. Radius ist der Eckenradius.');

        this.addProcessingMethod('square', ['left', 'top', 'width', 'radius1', 'radius2', 'radius3', 'radius4'], floatPrimitiveType,
            'Zeichnet ein Quadrat mit abgerundeten Ecken. (left, top) ist die linke obere Ecke, width Seitenlänge des Quadrats. Radius ist der Eckenradius.');

        this.addProcessingMethod('rect', ['left', 'top', 'width', 'height', 'radius'], floatPrimitiveType,
            'Zeichnet ein Rechteck. (left, top) ist die linke obere Ecke, width die Breite und height die Höhe des Rechtecks. Radius ist der Eckenradius');

        this.addProcessingMethod('ellipse', ['left', 'top', 'width', 'height'], floatPrimitiveType,
            'Zeichnet eine Ellipse. (left, top) ist die linke obere Ecke der Boundingbox der Ellipse, width ihre Breite und height ihre Höhe. Das lässt sich aber mit ellipseMode(...) ändern!');

        this.addProcessingMethod('circle', ['x', 'y', 'extent'], floatPrimitiveType,
            'Zeichnet einen Kreis. (x, y) ist der Mittelpunkt des Kreises, extent der doppelte Radius.');

        this.addProcessingMethod('ellipseMode', ['mode'], stringPrimitiveType,
            'Setzt den Modus, in dem nachfolgende Aufrufe von ellipse(...) interpretiert werden. Möglich sind die Werte CORNER, CORNERS, RADIUS und CENTER.');


        this.addProcessingMethod('line', ['x1', 'y1', 'x2', 'y2'], floatPrimitiveType,
            'Zeichnet eine Strecke von (x1, y1) nach (x2, y2).');

        this.addProcessingMethod('line', ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'], floatPrimitiveType,
            'Zeichnet eine Strecke von (x1, y1, z1) nach (x2, y2, z2).');

        this.addProcessingMethod('triangle', ['x1', 'y1', 'x2', 'y2', 'x3', 'y3'], floatPrimitiveType,
            'Zeichnet eine Dreieck mit den Eckpunkten (x1, y1), (x2, y2) und (x3, y3).');

        this.addProcessingMethod('quad', ['x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'x4', 'y4'], floatPrimitiveType,
            'Zeichnet eine Viereck mit den Eckpunkten (x1, y1), (x2, y2), (x3, y3) und (x4, y4).');

        this.addProcessingMethod('bezier', ['x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'x4', 'y4'], floatPrimitiveType,
            'Zeichnet eine kubische Bezierkurve mit den Ankerpunkten (x1, y1), (x4, y4) und den Kontrollpunkten (x2, y2), (x3, y3).');

        this.addProcessingMethod('curve', ['x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'x4', 'y4'], floatPrimitiveType,
            'Zeichnet eine Catmull-Rom-Kurve vom Punkt (x2, y2) nach (x3, y3) so, als würde sie von (x1, x2) kommen und es am Ende zu (x4, y4) weitergehen.');

        this.addProcessingMethod('curvePoint', ['a', 'b', 'c', 'd', 't'], floatPrimitiveType,
            'Will man die Zwischenpunkte einer Curve erhalten (Beginn b, Ende c, als würde sie von a kommen und nach d gehen), so verwendet man sowohl für die x- als auch für die y-Koordinate diese Funktion. t gibt an, welchen Punkt der Kurve man haben möchte. t hat Werte zwischen 0 (Startpunkt) und 1 (Endpunkt).', floatPrimitiveType);

        this.addProcessingMethod('curveTangent', ['a', 'b', 'c', 'd', 't'], floatPrimitiveType,
            'Will man die Zwischentangenten einer Curve erhalten (Beginn b, Ende c, als würde sie von a kommen und nach d gehen), so verwendet man sowohl für die x- als auch für die y-Koordinate diese Funktion. t gibt an, welchen Punkt der Kurve man haben möchte. t hat Werte zwischen 0 (Startpunkt) und 1 (Endpunkt).', floatPrimitiveType);

        this.addProcessingMethod('bezierPoint', ['x1', 'x2', 'x3', 'x4', 't'], floatPrimitiveType,
            'Will man die Zwischenpunkte einer Bezierkurve erhalten (Ankerkoordinaten x1, x4 und Stützkoordinaten x2, x3), so nutzt man - einzeln sowohl für die x- also auch für die y-Koordinate - diese Funktion. t gibt an, welchen Punkt der Kurve man haben möchte. t hat Werte zwischen 0 (Startpunkt) und 1 (Endpunkt).', floatPrimitiveType);

        this.addProcessingMethod('bezierTangent', ['x1', 'x2', 'x3', 'x4', 't'], floatPrimitiveType,
            'Will man die Zwischentangenten einer Bezierkurve erhalten (Ankerkoordinaten x1, x4 und Stützkoordinaten x2, x3), so nutzt man - einzeln sowohl für die x- also auch für die y-Koordinate - diese Funktion. t gibt an, welchen Punkt der Kurve man haben möchte. t hat Werte zwischen 0 (Startpunkt) und 1 (Endpunkt).', floatPrimitiveType);


        this.addProcessingMethod('beginShape', [], [],
            'Beginnt mit dem Zeichnen eines Polygons. Die einzelnen Punkte werden mit der Methode vertex(x, y) gesetzt.');

        this.addProcessingMethod('endShape', [], [],
            'Endet das Zeichnen eines Polygons.');

        this.addProcessingMethod('beginShape', ['kind'], stringPrimitiveType,
            'Beginnt mit dem Zeichnen eines Polygons. Die einzelnen Punkte werden mit der Methode vertex(x, y) gesetzt. Mögliche Werte für kind sind: POINTS, LINES, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN, QUADS, QUAD_STRIP');

        this.addProcessingMethod('endShape', ['kind'], stringPrimitiveType,
            'endShape(CLOSE) schließt den Linienzug.');

        this.addProcessingMethod('vertex', ['x', 'y'], floatPrimitiveType,
            'Setzt zwischen beginShape() und endShape() einen Punkt.');

        this.addProcessingMethod('point', ['x', 'y'], floatPrimitiveType,
            'Zeichnet einen Punkt.');

        this.addProcessingMethod('set', ['x', 'y', 'color'], [floatPrimitiveType, floatPrimitiveType, stringPrimitiveType],
            'Setzt die Farbe des Pixels bei (x, y).');

        this.addProcessingMethod('vertex', ['x', 'y', 'z'], floatPrimitiveType,
            'Setzt zwischen beginShape() und endShape() einen Punkt.');

        this.addProcessingMethod('point', ['x', 'y', 'z'], floatPrimitiveType,
            'Zeichnet einen Punkt.');

        this.addProcessingMethod('curveVertex', ['x', 'y'], floatPrimitiveType,
            'Setzt zwischen beginShape() und endShape() einen Punkt. Processing zeichnet damit eine Kurve nach dem Catmull-Rom-Algorithmus.');

        this.addProcessingMethod('curvevertex', ['x', 'y', 'z'], floatPrimitiveType,
            'Setzt zwischen beginShape() und endShape() einen Punkt. Processing zeichnet damit eine Kurve nach dem Catmull-Rom-Algorithmus.');

        this.addProcessingMethod('box', ['size'], floatPrimitiveType,
            'Zeichnet einen 3D-Würfel mit der Seitenlänge size.');

        this.addProcessingMethod('box', ['sizeX', 'sizeY', 'sizeZ'], floatPrimitiveType,
            'Zeichnet einen 3D-Würfel mit den angegebenen Seitenlängen.');

        /**
         * Transformationen
         */
        this.addProcessingMethod('resetMatrix', [], [],
            'Setzt alle erfolgten Transformationen zurück.');

        this.addProcessingMethod('push', [], [],
            'Sichert den aktuellen Zeichenzustand, d.h. die Farben und Transformationen, auf einen Stack.');

        this.addProcessingMethod('pop', [], [],
            'Holt den obersten Zeichenzustand, d.h. die Farben und Transformationen, vom Stack.');

        this.addProcessingMethod('scale', ['factor'], floatPrimitiveType,
            'Streckt die nachfolgend gezeichneten Figuren.');

        this.addProcessingMethod('scale', ['factorX', 'factorY'], floatPrimitiveType,
            'Streckt die nachfolgend gezeichneten Figuren.');

        this.addProcessingMethod('scale', ['factorX', 'factorY', 'factorZ'], floatPrimitiveType,
            'Streckt die nachfolgend gezeichneten Figuren.');

        this.addProcessingMethod('translate', ['x', 'y'], floatPrimitiveType,
            'Verschiebt die nachfolgend gezeichneten Figuren.');

        this.addProcessingMethod('translate', ['x', 'y', 'z'], floatPrimitiveType,
            'Verschiebt die nachfolgend gezeichneten Figuren.');

        this.addProcessingMethod('rotate', ['angle'], floatPrimitiveType,
            'Rotiert die nachfolgend gezeichneten Figuren. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('rotateX', ['angle'], floatPrimitiveType,
            'Rotiert die nachfolgend gezeichneten Figuren um die X-Achse. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('rotateY', ['angle'], floatPrimitiveType,
            'Rotiert die nachfolgend gezeichneten Figuren um die Y-Achse. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('shearX', ['angle'], floatPrimitiveType,
            'Schert die nachfolgend gezeichneten Figuren in Richtung derX-Achse. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('shearY', ['angle'], floatPrimitiveType,
            'Schert die nachfolgend gezeichneten Figuren in Richtung der Y-Achse. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('rotateZ', ['angle'], floatPrimitiveType,
            'Rotiert die nachfolgend gezeichneten Figuren um die Z-Achse. Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie angle interpretiert wird. Default ist RADIANS.');

        this.addProcessingMethod('angleMode', ['mode'], stringPrimitiveType,
            'Mit angleMode(RADIANS) bzw. angleMode(DEGREES) kann beeinflusst werden, wie winkel bei Rotationen interpretiert werden. Default ist RADIANS.');

        /**
         * Text
         */
        this.addProcessingMethod('textSize', ['size'], floatPrimitiveType,
            'Setzt die Schriftgröße in Pixel.');

        // this.addProcessingMethod('loadFont', ['fontname'], stringPrimitiveType,
        //     'Lädt eine Schriftart. Diese Methode muss in der Methode preload aufgerufen werden.');

        this.addProcessingMethod('textAlign', ['alignX'], intPrimitiveType,
            'Setzt die Ausrichtung des nächsten ausgegebenen Textes in x-Richtung. Mögliche Werte sind CENTER, LEFT, RIGHT');

        this.addProcessingMethod('textAlign', ['alignX', 'alignY'], intPrimitiveType,
            'Setzt die Ausrichtung des nächsten ausgegebenen Textes. Mögliche Werte für alignX sind CENTER, LEFT, RIGHT, mögliche Werte für alignY sind TOP, CENTER, BASELINE, BOTTOM');

        this.addProcessingMethod('text', ['text', 'x', 'y'], [stringPrimitiveType, floatPrimitiveType, floatPrimitiveType],
            'Gibt Text aus.');

        this.addProcessingMethod('text', ['text', 'x', 'y', 'x2', 'y2'], [stringPrimitiveType, floatPrimitiveType, floatPrimitiveType, floatPrimitiveType, floatPrimitiveType],
            'Gibt Text aus. x2 und y2 sind die Breite und Höhe des Textausgabebereichs. Hat der Text horizontal nicht Platz, so wird er entsprechend umgebrochen.');

        /**
         * Mathematische Funktionen
         */
        this.addProcessingMethod('random', ['low', 'high'], floatPrimitiveType,
            'Gibt eine Zufallszahl zwischen low und high zurück.', floatPrimitiveType);

        this.addProcessingMethod('random', ['high'], floatPrimitiveType,
            'Gibt eine Zufallszahl zwischen 0 und high zurück.', floatPrimitiveType);

        this.addProcessingMethod('sqrt', ['n'], floatPrimitiveType,
            'Gibt die Quadratwurzel von n zurück.', floatPrimitiveType);

        this.addProcessingMethod('pow', ['basis', 'exponent'], floatPrimitiveType,
            'Gibt die den Wert der Potenz ("basis hoch exponent") zurück.', floatPrimitiveType);

        this.addProcessingMethod('max', ['a', 'b'], floatPrimitiveType,
            'Gibt den größeren der beiden Werte zurück.', floatPrimitiveType);

        this.addProcessingMethod('min', ['a', 'b'], floatPrimitiveType,
            'Gibt den kleineren der beiden Werte zurück.', floatPrimitiveType);

        this.addProcessingMethod('abs', ['n'], floatPrimitiveType,
            'Gibt den Betrag des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('sin', ['n'], floatPrimitiveType,
            'Gibt den Sinus des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('cos', ['n'], floatPrimitiveType,
            'Gibt den Cosinus des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('tan', ['n'], floatPrimitiveType,
            'Gibt den Tangens des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('asin', ['n'], floatPrimitiveType,
            'Gibt den Arcussinus des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('acos', ['n'], floatPrimitiveType,
            'Gibt den Arcussosinus des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('radians', ['angle'], floatPrimitiveType,
            'Wandelt einen Winkel vom Gradmaß ins Bogenmaß um.', floatPrimitiveType);

        this.addProcessingMethod('degrees', ['angle'], floatPrimitiveType,
            'Wandelt einen Winkel vom Bogenmaß ins Gradmaß um.', floatPrimitiveType);

        this.addProcessingMethod('atan', ['n'], floatPrimitiveType,
            'Gibt den Arcussangens des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('atan2', ['x', 'y'], floatPrimitiveType,
            'Gibt den Arcussangens des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('sqrt', ['x', 'y'], floatPrimitiveType,
            'Gibt die Quadratwurzel des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('sq', ['x', 'y'], floatPrimitiveType,
            'Gibt das Quadrat des Wertes zurück.', floatPrimitiveType);

        this.addProcessingMethod('abs', ['n'], intPrimitiveType,
            'Gibt den Betrag des Wertes zurück.', intPrimitiveType);

        this.addProcessingMethod('round', ['n'], floatPrimitiveType,
            'Rundet den Wert auf eine ganze Zahl.', intPrimitiveType);

        this.addProcessingMethod('ceil', ['n'], floatPrimitiveType,
            'Rundet den Wert auf eine ganze Zahl (Aufrunden!).', intPrimitiveType);

        this.addProcessingMethod('floor', ['n'], floatPrimitiveType,
            'Rundet den Wert auf eine ganze Zahl (Abfrunden!).', intPrimitiveType);

        this.addProcessingMethod('dist', ['x1', 'y1', 'x2', 'y2'], floatPrimitiveType,
            'Berechnet den Abstand der Punkte (x1, y1) und (x2, y2).', floatPrimitiveType);

        this.addProcessingMethod('lerp', ['a', 'b', 't'], floatPrimitiveType,
            'Berechnet den a + (b - a)*t. Wählt man t zwischen 0 und 1, so kann man damit die Zwischenwerte zwischen a und b errechnen.', floatPrimitiveType);

        this.addProcessingMethod('constrain', ['value', 'min', 'max'], floatPrimitiveType,
            'Beschränkt value auf den Bereich [min, max], genauer: Ist value < min, so wird min zurückgegeben. Ist value > max, so wird max zurückgegeben. Ansonsten wird value zurückgegeben.', floatPrimitiveType);

        /**
         * Sonstiges
         */

        this.addProcessingMethod('year', [], [],
            'Aktuelle Jahreszahl', intPrimitiveType);

        this.addProcessingMethod('month', [], [],
            'Monat: 1 == Januar, 12 == Dezember', intPrimitiveType);

        this.addProcessingMethod('day', [], [],
            'Tag (innerhalb des Monats) des aktuellen Datums', intPrimitiveType);

        this.addProcessingMethod('hour', [], [],
            'Stundenzahl der aktuellen Uhrzeit', intPrimitiveType);

        this.addProcessingMethod('hour', [], [],
            'Stundenzahl der aktuellen Uhrzeit', intPrimitiveType);

        this.addProcessingMethod('minute', [], [],
            'Minutenzahl der aktuellen Uhrzeit', intPrimitiveType);

        this.addProcessingMethod('second', [], [],
            'Sekundenzahl der aktuellen Uhrzeit', intPrimitiveType);

        this.addProcessingMethod('frameRate', ['n'], intPrimitiveType,
            'Setzt die Framerate (Anzahl der Aufrufe von draw() pro Sekunde)');

        this.addProcessingMethod('textWidth', ['text'], stringPrimitiveType,
            'Gibt die Breite des Texts zurück.', floatPrimitiveType);

        this.addProcessingMethod('textAscent', ['text'], stringPrimitiveType,
            'Gibt den Ascent Textes zurück ( = Höhe des größten Zeichens über der Grundlinie).', floatPrimitiveType);

        this.addProcessingMethod('textDescent', ['text'], stringPrimitiveType,
            'Gibt den Descent Textes zurück ( = Tiefe des tiefsten Zeichens unter der Grundlinie).', floatPrimitiveType);

        this.addProcessingMethod('textLeading', ['leading'], floatPrimitiveType,
            'Setzt den Abstand zweier aufeinanderfolgender Textzeilen.');

        this.addProcessingMethod('cursor', ['type'], stringPrimitiveType,
            'Ändert das Aussehen des Mauscursors. Type ist einer der Werte "arrow", "cross", "text", "move", "hand", "wait", "progress".');

        this.addProcessingMethod('noCursor', ['type'], stringPrimitiveType,
            'Hat zur Folge, dass der Mauscursor über dem Zeichenbereich unsichtbar ist.');

        this.addProcessingMethod('copy', ['sx', 'sy', 'sw', 'sh', 'dx', 'dy', 'dw', 'dh'], floatPrimitiveType,
            'Kopiert den rechteckigen Bereich mit der linken oberen Ecke (sx, sy) sowie der Breite sw und der Höhe sh in den Bereich mit der linken oberen Ecke (dx, dy), der Breite dw und der Höhe dh.');

        this.addProcessingMethod('millis', [], [],
            'Gibt die Millisekunden zurück, die vergangen sind, seit setup() aufgerufen wurde.');

        this.addProcessingMethod('redraw', [], [],
            'Führt draw() genau ein Mal aus. Macht ggf. Sinn, wenn die Render-Loop zuvor mit noLoop() gestoppt wurde.');


        this.setupAttributeIndicesRecursive();

    }

    addProcessingMethod(identifier: string, parameterNames: string[], parameterTypes: Type[] | Type, comment: string, returnType?: Type) {

        let parameters: Variable[] = [];
        if (Array.isArray(parameterTypes)) {
            for (let i = 0; i < parameterNames.length; i++) {
                parameters.push({ identifier: parameterNames[i], type: parameterTypes[i], declaration: null, usagePositions: null, isFinal: true });
            }
        } else {
            parameters = parameterNames.map((name) => { return { identifier: name, type: parameterTypes, declaration: null, usagePositions: null, isFinal: true } })
        }

        if (returnType == null) {
            this.addMethod(new Method(identifier, new Parameterlist(parameters), null,
                (parameters) => {
                    let o: RuntimeObject = parameters[0].value;
                    let ph: ProcessingHelper = o.intrinsicData["Processing"];
                    let pList = parameters.slice(1).map(p => p.value);

                    ph.p5o[identifier](...pList);

                }, false, false, comment, false));
        } else {
            this.addMethod(new Method(identifier, new Parameterlist(parameters), returnType,
                (parameters) => {
                    let o: RuntimeObject = parameters[0].value;
                    let ph: ProcessingHelper = o.intrinsicData["Processing"];
                    let pList = parameters.slice(1).map(p => p.value);

                    return ph.p5o[identifier](...pList);

                }, false, false, comment, false));

        }


    }

    getProcessingHelper(processingObject: RuntimeObject, breite: number = 800, höhe: number = 600): ProcessingHelper {

        let interpreter = this.module?.main?.getInterpreter();


        if (interpreter.processingHelper != null) {

            interpreter.throwException("Es kann nur ein einziges Processing-Applet instanziert werden.");
            return;
        }

        if (interpreter.worldHelper != null) {

            interpreter.throwException("Processing kann nicht gleichzeitig mit der herkömmlichen Grafikausgabe genutzt werden.");
            return;
        }

        return new ProcessingHelper(this.module, interpreter, processingObject);


    }


}


export class ProcessingHelper {

    $containerOuter: JQuery<HTMLElement>;
    $containerInner: JQuery<HTMLElement>;

    $div: JQuery<HTMLElement>;

    width: number = 800;
    height: number = 600;

    p5o: p5;

    renderer: string;
    loopStopped: boolean = false;

    onSizeChanged: () => void;


    constructor(private module: Module, private interpreter: Interpreter, public runtimeObject: RuntimeObject) {

        this.interpreter.processingHelper = this;

        this.$containerOuter = jQuery('<div></div>');
        let $graphicsDiv = this.module.main.getInterpreter().printManager.getGraphicsDiv();

        this.onSizeChanged = () => {
            let $jo_tabs = $graphicsDiv.parents(".jo_tabs");
            let maxWidth: number = $jo_tabs.width();
            let maxHeight: number = $jo_tabs.height();
            // let maxWidth: number = $graphicsDiv.parent().width();
            // let maxHeight: number = $graphicsDiv.parent().height();

            if (this.height / this.width > maxHeight / maxWidth) {
                $graphicsDiv.css({
                    'width': this.width / this.height * maxHeight + "px",
                    'height': maxHeight + "px",
                })
            } else {
                $graphicsDiv.css({
                    'height': this.height / this.width * maxWidth + "px",
                    'width': maxWidth + "px",
                })
            }
        };

        $graphicsDiv.off('sizeChanged');
        $graphicsDiv.on('sizeChanged', this.onSizeChanged);

        this.onSizeChanged();

        this.$containerInner = jQuery('<div></div>');
        this.$containerOuter.append(this.$containerInner);

        $graphicsDiv.append(this.$containerOuter);
        $graphicsDiv.show();

        $graphicsDiv[0].oncontextmenu = function (e) {
            e.preventDefault();
        };

        this.module.main.getRightDiv()?.adjustWidthToWorld();

    }

    createCanvas(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.onSizeChanged();
        this.p5o.createCanvas(this.width, this.height, this.renderer);
        this.$div.find('canvas').css({
            'width': '',
            'height': ''

        });
    }

    main() {
        this.interpreter.timerExtern = true;
        this.setupProcessing(this.$containerInner);
    }

    setupProcessing($div: JQuery<HTMLElement>) {

        let that = this;
        let drawMethodPending: boolean = true;
        this.$div = $div;

        let sketch = (p5: p5) => {

            p5.setup = function () {
                that.renderer = p5.P2D;

                let afterFinishingBoth = () => {
                    // p5.createCanvas(that.width, that.height, that.renderer);
                    drawMethodPending = false
                    // $div.find('canvas').css({
                    //     'width': '',
                    //     'height': ''
                    // })            
                }

                let i = 2;

                that.runMethod('setup', () => {
                    if (--i == 0) afterFinishingBoth();
                });

                that.runMethod('settings', () => {
                    if (--i == 0) afterFinishingBoth();
                });


            };

            p5.preload = function () {
                that.runMethod('preload');
            };

            p5.draw = function () {
                if (that.interpreter.state == InterpreterState.running && !that.loopStopped) {
                    if (!drawMethodPending) {
                        drawMethodPending = true;
                        that.runMethod("draw", () => {
                            drawMethodPending = false;
                        });
                    }
                }
                that.tick();
                // p5.background(50);
                // p5.rect(p5.width / 2, p5.height / 2, 50, 50);

            };

            p5.mousePressed = function () {
                that.runMethod('mousePressed');
            };

            p5.mouseReleased = function () {
                that.runMethod('mouseReleased');
            };

            p5.mouseClicked = function () {
                that.runMethod('mouseClicked');
            };

            p5.mouseDragged = function () {
                that.runMethod('mouseDragged');
            };

            p5.mouseEntered = function () {
                that.runMethod('mouseEntered');
            };

            p5.mouseExited = function () {
                that.runMethod('mouseExited');
            };

            p5.mouseMoved = function () {
                that.runMethod('mouseMoved');
            };

            p5.keyPressed = function () {
                that.runMethod('keyPressed');
            };

            p5.keyReleased = function () {
                that.runMethod('keyReleased');
            };


        }

        //@ts-ignore
        this.p5o = new p5(sketch, $div[0]);
        $div.find('canvas').css({
            'width': '',
            'height': ''
        })

    }


    tick() {

        if (this.interpreter.state == InterpreterState.running) {
            this.interpreter.timerFunction(33.33, true, 0.5);
            this.interpreter.timerStopped = false;
            this.interpreter.timerFunction(33.33, false, 0.08);
        }

    }

    loop() {
        this.loopStopped = false;
    }

    noLoop() {
        this.loopStopped = true;
    }

    runMethod(methodIdentifier: string, callback: () => void = null) {

        let klass: Klass = <Klass>this.runtimeObject.class;
        let method = klass.getMethodBySignature(methodIdentifier + "()");

        let program = method?.program;

        if (program == null) {
            if (callback != null) callback();
            return;
        }

        let stackElements: Value[] = [
            {
                type: klass,
                value: this.runtimeObject
            },
        ];

        this.interpreter.runTimer(method, stackElements, (interpreter) => {
            if (callback != null) callback();
        }, methodIdentifier == "draw");
    }


    destroyWorld() {
        if (this.p5o != null) this.p5o.remove();
        this.$containerOuter.remove();
        this.module.main.getInterpreter().printManager.getGraphicsDiv().hide();
        this.interpreter.timerExtern = false;
        this.interpreter.processingHelper = null;
    }

}