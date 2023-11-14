import { FileData, WorkspaceSettings } from "../../communication/Data.js";
import { AccordionElement } from "../../main/gui/Accordion.js";
import { MainBase } from "../../main/MainBase.js";
import { ArrayListClass } from "../../runtimelibrary/collections/ArrayList.js";
import { CollectionClass } from "../../runtimelibrary/collections/Collection.js";
import { IterableClass } from "../../runtimelibrary/collections/Iterable.js";
import { IteratorClass } from "../../runtimelibrary/collections/Iterator.js";
import { ListClass } from "../../runtimelibrary/collections/List.js";
import { ListIteratorImplClass } from "../../runtimelibrary/collections/ListIteratorImpl.js";
import { StackClass } from "../../runtimelibrary/collections/Stack.js";
import { VectorClass } from "../../runtimelibrary/collections/Vector.js";
import { SetClass } from "../../runtimelibrary/collections/Set.js";
import { SetIteratorImplClass } from "../../runtimelibrary/collections/SetIteratorImpl.js";
import { HashSetClass } from "../../runtimelibrary/collections/HashSet.js";
import { LinkedHashSetClass } from "../../runtimelibrary/collections/LinkedHashSet.js";
import { QueueClass } from "../../runtimelibrary/collections/Queue.js";
import { DequeClass } from "../../runtimelibrary/collections/Deque.js";
import { LinkedListClass } from "../../runtimelibrary/collections/LinkedList.js";
import { ConsoleClass } from "../../runtimelibrary/Console.js";
import { Actor as ActorClass } from "../../runtimelibrary/graphics/Actor.js";
import { AlignmentClass } from "../../runtimelibrary/graphics/Alignment.js";
import { BitmapClass } from "../../runtimelibrary/graphics/Bitmap.js";
import { CircleClass as CircleClass } from "../../runtimelibrary/graphics/Circle.js";
import { SectorClass } from "../../runtimelibrary/graphics/Sector.js";
import { ArcClass } from "../../runtimelibrary/graphics/Arc.js";
import { ColorClass } from "../../runtimelibrary/graphics/Color.js";
import { EllipseClass } from "../../runtimelibrary/graphics/Ellipse.js";
import { FilledShapeClass } from "../../runtimelibrary/graphics/FilledShape.js";
import { CollisionPairClass, GroupClass } from "../../runtimelibrary/graphics/Group.js";
import { KeyClass } from "../../runtimelibrary/graphics/Key.js";
import { PolygonClass } from "../../runtimelibrary/graphics/Polygon.js";
import { RectangleClass } from "../../runtimelibrary/graphics/Rectangle.js";
import { RepeatTypeClass } from "../../runtimelibrary/graphics/RepeatType.js";
import { RoundedRectangleClass } from "../../runtimelibrary/graphics/RoundedRectangle.js";
import { ScaleModeClass } from "../../runtimelibrary/graphics/ScaleMode.js";
import { ShapeClass } from "../../runtimelibrary/graphics/Shape.js";
import { SoundKlass as SoundClass } from "../../runtimelibrary/graphics/Sound.js";
import { SpriteClass, TileClass } from "../../runtimelibrary/graphics/Sprite.js";
import { SpriteLibraryClass } from "../../runtimelibrary/graphics/SpriteLibraryEnum.js";
import { TextClass } from "../../runtimelibrary/graphics/Text.js";
import { WorldClass } from "../../runtimelibrary/graphics/World.js";
import { InputClass } from "../../runtimelibrary/Input.js";
import { GamepadClass } from "../../runtimelibrary/Gamepad.js";
import { MathClass } from "../../runtimelibrary/Math.js";
import { MathToolsClass } from "../../runtimelibrary/MathToolsClass.js";
import { PrintStreamClass, SystemClass } from "../../runtimelibrary/System.js";
import { KeyListener, SystemToolsClass } from "../../runtimelibrary/SystemTools.js";
import { Runnable, TimerClass } from "../../runtimelibrary/Timer.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Error, ErrorLevel } from "../lexer/Lexer.js";
import { TextPosition, Token, TokenType, TextPositionWithoutLength } from "../lexer/Token.js";
import { Interface, Klass, Visibility } from "../types/Class.js";
import { booleanPrimitiveType, BooleanType, CharacterType, charPrimitiveType, doublePrimitiveType, DoubleType, floatPrimitiveType, FloatType, IntegerType, intPrimitiveType, objectType, stringPrimitiveType, voidPrimitiveType, varType, longPrimitiveType, LongType, shortPrimitiveType } from "../types/PrimitiveTypes.js";
import { Attribute, Method, PrimitiveType, Type, Variable } from "../types/Types.js";
import { ASTNode, MethodDeclarationNode, TypeNode } from "./AST.js";
import { Breakpoint, Program, Statement } from "./Program.js";
import { SymbolTable } from "./SymbolTable.js";
import { MapClass } from "../../runtimelibrary/collections/Map.js";
import { HashMapClass } from "../../runtimelibrary/collections/HashMap.js";
import { TriangleClass } from "../../runtimelibrary/graphics/Triangle.js";
import { Main } from "../../main/Main.js";
import { LocalDateTimeClass, DayOfWeekEnum, MonthEnum } from "../../runtimelibrary/graphics/LocalDateTime.js";
import { LineClass } from "../../runtimelibrary/graphics/Line.js";
import { Vector2Class } from "../../runtimelibrary/Vector2.js";
import { MouseAdapterClass, MouseListenerInterface } from "../../runtimelibrary/graphics/MouseListener.js";
import { WebSocketClass } from "../../runtimelibrary/network/WebSocket.js";
import { WebSocketClientClass } from "../../runtimelibrary/network/WebSocketClient.js";
import { ProcessingClass } from "../../runtimelibrary/graphics/Processing.js";
import { TurtleClass } from "../../runtimelibrary/graphics/Turtle.js";
import { GNGZeichenfensterClass } from "../../runtimelibrary/gng/GNGZeichenfenster.js";
import { GNGRechteckClass } from "../../runtimelibrary/gng/GNGRechteck.js";
import { GNGBaseFigurClass } from "../../runtimelibrary/gng/GNGBaseFigur.js";
import { GNGAktionsempfaengerInterface } from "../../runtimelibrary/gng/GNGAktionsempfaenger.js";
import { GNGDreieckClass } from "../../runtimelibrary/gng/GNGDreieck.js";
import { GNGKreisClass } from "../../runtimelibrary/gng/GNGKreis.js";
import { GNGTurtleClass } from "../../runtimelibrary/gng/GNGTurtle.js";
import { GNGTextClass } from "../../runtimelibrary/gng/GNGText.js";
import { GNGEreignisbehandlung } from "../../runtimelibrary/gng/GNGEreignisbehandlung.js";
import { GNGFigurClass } from "../../runtimelibrary/gng/GNGFigur.js";
import { RandomClass } from "../../runtimelibrary/Random.js";
import { DirectionClass } from "../../runtimelibrary/graphics/Direction.js";
import { Patcher } from "./Patcher.js";
import { KeyEvent as KeyEventClass } from "../../runtimelibrary/graphics/KeyEvent.js";
import { Formatter } from "../../main/gui/Formatter.js";
import { RobotClass, RobotWorldClass } from "../../runtimelibrary/graphics/3d/Robot.js";
import { ResultSetClass } from "../../runtimelibrary/database/ResultSet.js";
import { DatabaseStatementClass } from "../../runtimelibrary/database/DatabaseStatement.js";
import { ConnectionClass } from "../../runtimelibrary/database/Connection.js";
import { DatabaseManagerClass } from "../../runtimelibrary/database/DatabaseManager.js";
import { DatabasePreparedStatementClass } from "../../runtimelibrary/database/DatabasePreparedStatement.js";
import jQuery from 'jquery';
import { JavaKaraWorldClass, KaraClass } from "../../runtimelibrary/graphics/JavaKara.js";
import { PositionClass } from "../../runtimelibrary/graphics/Position.js";
import { HamsterClass, JavaHamsterWorldClass } from "../../runtimelibrary/graphics/JavaHamster.js";
import { TextFieldClass } from "../../runtimelibrary/graphics/gui/Textfield.js";
import { CheckBoxClass } from "../../runtimelibrary/graphics/gui/Checkbox.js";
import { RadioButtonClass } from "../../runtimelibrary/graphics/gui/Radiobutton.js";
import { ButtonClass } from "../../runtimelibrary/graphics/gui/Button.js";
import { FileTypeManager } from "../../main/gui/FileTypeManager.js";
import { FilesClass } from "../../runtimelibrary/Files.js";
import { HttpHeaderType } from "../../runtimelibrary/network/HttpHeader.js";
import { HttpRequestClass } from "../../runtimelibrary/network/HttpRequest.js";
import { HttpResponseClass } from "../../runtimelibrary/network/HttpResponse.js";
import { HttpClientClass } from "../../runtimelibrary/network/HttpClient.js";
import { URLEncoderClass } from "../../runtimelibrary/network/URLEncoder.js";
import { JsonElementClass } from "../../runtimelibrary/network/JsonElement.js";
import { JsonParserClass } from "../../runtimelibrary/network/JsonParser.js";
import { ChangeListenerClass } from "../../runtimelibrary/graphics/gui/ChangeListener.js";
import { GuiComponentClass } from "../../runtimelibrary/graphics/gui/GuiComponent.js";
import { GuiTextComponentClass } from "../../runtimelibrary/graphics/gui/GuiTextComponent.js";
import { CollectionsClass } from "../../runtimelibrary/collections/Collections.js";
import { DecimalFormatClass } from "../../runtimelibrary/DecimalFormatClass.js";
import { BigIntegerClass } from "../../runtimelibrary/BigInteger.js";

export type ExportedWorkspace = {
    name: string;
    modules: ExportedModule[];
    settings: WorkspaceSettings;
}

export type ExportedModule = {
    name: string;
    text: string;

    is_copy_of_id?: number,
    repository_file_version?: number,
    identical_to_repository_version: boolean,

}

export type File = {
    name: string,
    id?: number,
    text: string,

    text_before_revision: string,
    submitted_date: string,
    student_edited_after_revision: boolean,

    is_copy_of_id?: number,
    repository_file_version?: number,
    identical_to_repository_version: boolean,

    dirty: boolean,
    saved: boolean,
    version: number,
    panelElement?: AccordionElement
}

export type IdentifierPosition = {
    position: TextPosition,
    element: Type | Method | Attribute | Variable;
}

export type MethodCallPosition = {
    identifierPosition: TextPosition,
    possibleMethods: Method[] | string, // string for print, println, ...
    commaPositions: TextPosition[],
    rightBracketPosition: TextPosition
}

export class Module {
    file: File;
    static maxUriNumber: number = 0;
    uri: monaco.Uri;
    model: monaco.editor.ITextModel;
    oldErrorDecorations: string[] = [];
    lastSavedVersionId: number;
    editorState: monaco.editor.ICodeEditorViewState;

    isSystemModule: boolean = false;

    breakpoints: Breakpoint[] = [];
    breakpointDecorators: string[] = [];
    decoratorIdToBreakpointMap: { [id: string]: Breakpoint } = {};

    errors: Error[][] = [[], [], [], []]; // 1st pass, 2nd pass, 3rd pass

    colorInformation: monaco.languages.IColorInformation[] = [];

    // 1st pass: Lexer
    tokenList: Token[];

    // 2nd pass: ASTParser
    mainProgramAst: ASTNode[];
    classDefinitionsAST: ASTNode[];
    typeNodes: TypeNode[];

    // 3rd pass: TypeResolver fill in resolvedType in typeNodes and populate typeStore
    typeStore: TypeStore;

    // 4th pass: generate code and symbol tables

    /*
    The mainProgramAST holds statements to:
    1. call static constructor of each used class
    2. execute main Program
    */

    mainProgram?: Program;
    mainProgramEnd: TextPosition;
    mainSymbolTable: SymbolTable;

    identifierPositions: { [line: number]: IdentifierPosition[] } = {};
    methodCallPositions: { [line: number]: MethodCallPosition[] } = {};

    dependsOnModules: Map<Module, boolean>;
    isStartable: boolean;
    dependsOnModulesWithErrors: boolean;

    static uriMap: { [name: string]: number } = {};
    bracketError: string;

    constructor(file: File, public main: MainBase) {
        if (file == null || this.main == null) return; // used by AdhocCompiler and ApiDoc

        this.file = file;
        // this.uri = monaco.Uri.from({ path: '/file' + (Module.maxUriNumber++) + '.learnJava', scheme: 'file' });
        let path = file.name;

        // a few lines later there's
        // monaco.Uri.from({ path: path, scheme: 'inmemory' });
        // this method throws an exception if path contains '//'
        path = path.replaceAll('//', '_');   

        let uriCounter = Module.uriMap[path];
        if (uriCounter == null) {
            uriCounter = 0;
        } else {
            uriCounter++;
        }
        Module.uriMap[path] = uriCounter;

        if (uriCounter > 0) path += " (" + uriCounter + ")";
        this.uri = monaco.Uri.from({ path: path, scheme: 'inmemory' });
        let fileType = FileTypeManager.filenameToFileType(file.name);
        this.model = monaco.editor.createModel(file.text, fileType.language, this.uri);
        this.model.updateOptions({ tabSize: 3, bracketColorizationOptions: {enabled: true} });
        let formatter = new Formatter();

        if(main.isEmbedded() && file.text != null && file.text.length > 3 && fileType.language == "myJava"){
            let edits = <monaco.languages.TextEdit[]>formatter.format(this.model);
            this.model.applyEdits(edits);
        }

        this.lastSavedVersionId = this.model.getAlternativeVersionId();

        let that = this;

        this.model.onDidChangeContent(() => {
            let versionId = that.model.getAlternativeVersionId();

            if (versionId != that.lastSavedVersionId) {
                that.file.dirty = true;
                that.file.saved = false;
                that.file.identical_to_repository_version = false;
                that.lastSavedVersionId = versionId;
            }

            if(!that.main.isEmbedded()){
                let main1: Main = <Main>main;
                if(main1.workspacesOwnerId != main1.user.id){
                    if(that.file.text_before_revision == null || that.file.student_edited_after_revision){
                        that.file.student_edited_after_revision = false;
                        that.file.text_before_revision = that.file.text;
                        that.file.saved = false;
                        main1.networkManager.sendUpdates(null, false);
                        main1.bottomDiv.homeworkManager.showHomeWorkRevisionButton();
                        main1.projectExplorer.renderHomeworkButton(that.file);
                    }
                } else {
                    that.file.student_edited_after_revision = true;
                }
            }
        });

    }

    setupMonacoModel(){
        
    }

    toExportedModule(): ExportedModule {
        return {
            name: this.file.name,
            text: this.getProgramTextFromMonacoModel(),
            identical_to_repository_version: this.file.identical_to_repository_version,
            is_copy_of_id: this.file.is_copy_of_id,
            repository_file_version: this.file.repository_file_version
        }
    }

    getMethodDeclarationAtPosition(position: { lineNumber: number; column: number; }): MethodDeclarationNode {

        if(this.classDefinitionsAST == null) return null;
        
        for(let cd of this.classDefinitionsAST){
            if(cd.type == TokenType.keywordClass || cd.type == TokenType.keywordEnum){
                for(let methodAST of cd.methods){
                    if(methodAST.position != null && methodAST.scopeTo != null){
                        if(methodAST.position.line <= position.lineNumber && methodAST.scopeTo.line >= position.lineNumber){
                            return methodAST;
                        }
                    }
                }
            }
        }
        
        return null;
    
    }


    static restoreFromData(f: FileData, main: MainBase): Module {

        let patched = Patcher.patch(f.text);

        let f1: File = {
            name: f.name,
            text: patched.patchedText,
            text_before_revision: f.text_before_revision,
            submitted_date: f.submitted_date,
            student_edited_after_revision: false,
            dirty: true,
            saved: !patched.modified,
            version: f.version,
            id: f.id,
            is_copy_of_id: f.is_copy_of_id,
            repository_file_version: f.repository_file_version,
            identical_to_repository_version: f.identical_to_repository_version
        }

        let m: Module = new Module(f1, main);

        return m;

    }

    getFileData(workspace: Workspace): FileData {
        let file = this.file;
        let fd: FileData = {
            id: file.id,
            name: file.name,
            text: file.text,
            text_before_revision: file.text_before_revision,
            submitted_date: file.submitted_date,
            student_edited_after_revision: file.student_edited_after_revision,
            version: file.version,
            is_copy_of_id: file.is_copy_of_id,
            repository_file_version: file.repository_file_version,
            identical_to_repository_version: file.identical_to_repository_version,
            workspace_id: workspace.id,
            forceUpdate: false,
        }

        return fd;
    }

    pushMethodCallPosition(identifierPosition: TextPosition, commaPositions: TextPosition[],
        possibleMethods: Method[] | string, rightBracketPosition: TextPosition) {

        let lines: number[] = [];
        lines.push(identifierPosition.line);
        for (let cp of commaPositions) {
            if (lines.indexOf[cp.line] < 0) {
                lines.push(cp.line);
            }
        }

        let mcp: MethodCallPosition = {
            identifierPosition: identifierPosition,
            commaPositions: commaPositions,
            possibleMethods: possibleMethods,
            rightBracketPosition: rightBracketPosition
        };

        for (let line of lines) {
            let mcpList = this.methodCallPositions[line];
            if (mcpList == null) {
                this.methodCallPositions[line] = [];
                mcpList = this.methodCallPositions[line];
            }
            mcpList.push(mcp);
        }

    }


    toggleBreakpoint(lineNumber: number, rerender: boolean) {
        this.getBreakpointPositionsFromEditor();
        if (this.getBreakpoint(lineNumber, true) == null) {
            this.setBreakpoint(lineNumber, 1);
        }
        if (rerender) {
            this.renderBreakpointDecorators();
        }
    }

    getBreakpoint(line: number, remove: boolean = false): Breakpoint {

        for (let i = 0; i < this.breakpoints.length; i++) {
            let b = this.breakpoints[i];
            if (b.line == line) {
                this.breakpoints.splice(i, 1);
                if (b.statement != null) {
                    b.statement.breakpoint = undefined;
                }
                return b;
            }
        }

        return null;

    }

    setBreakpoint(line: number, column: number): Breakpoint {

        let breakpoint: Breakpoint = {
            line: line,
            column: column,
            statement: null
        }

        this.attachToStatement(breakpoint);
        this.breakpoints.push(breakpoint);

        return breakpoint;

    }

    attachToStatement(breakpoint: Breakpoint, programList?: Program[]) {

        if (breakpoint.statement != null) {
            breakpoint.statement.breakpoint = undefined;
        }

        if (programList == null) programList = this.getPrograms();

        let nearestStatement: Statement = null;
        let nearestDistance: number = 100000;

        for (let program of programList) {
            for (let statement of program.statements) {

                let line = statement?.position?.line;
                if (line != null && line >= breakpoint.line) {
                    if (line - breakpoint.line < nearestDistance) {
                        nearestStatement = statement;
                        nearestDistance = line - breakpoint.line;
                    }

                    break;
                }

            }

        }

        breakpoint.statement = nearestStatement;
        if (nearestStatement != null) {
            nearestStatement.breakpoint = breakpoint;
            // let pp = new ProgramPrinter();
            // console.log("Attached Breakpoint line " + breakpoint.line + ", column " + 
            //     breakpoint.column + " to statement " + pp.print([nearestStatement]));
        }

    }



    getPrograms(): Program[] {
        let programList: Program[] = [];

        if (this.mainProgram != null) {
            programList.push(this.mainProgram);
        }

        if (this.typeStore != null) {

            for (let type of this.typeStore.typeList) {
                if (type instanceof Klass) {
                    if (type.attributeInitializationProgram != null) {
                        programList.push(type.attributeInitializationProgram);
                    }
                    for (let method of type.methods) {
                        if (method.program != null) {
                            programList.push(method.program);
                        }
                    }
                    if (type.staticClass.attributeInitializationProgram != null) {
                        programList.push(type.staticClass.attributeInitializationProgram);
                    }
                    for (let method of type.staticClass.methods) {
                        if (method.program != null) {
                            programList.push(method.program);
                        }
                    }
                }
            }

        }

        return programList;

    }

    renderBreakpointDecorators() {

        this.getBreakpointPositionsFromEditor();

        let decorations: monaco.editor.IModelDeltaDecoration[] = [];

        for (let breakpoint of this.breakpoints) {
            decorations.push({
                range: { startLineNumber: breakpoint.line, endLineNumber: breakpoint.line, startColumn: 1, endColumn: 1 },
                options: {
                    isWholeLine: true, className: "jo_decorate_breakpoint",
                    overviewRuler: {
                        color: "#580000",
                        position: monaco.editor.OverviewRulerLane.Left
                    },
                    minimap: {
                        color: "#580000",
                        position: monaco.editor.MinimapPosition.Inline
                    },
                    marginClassName: "jo_margin_breakpoint",
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                },
                //@ts-ignore
                breakpoint: breakpoint
            });
        }

        this.breakpointDecorators = this.main.getMonacoEditor().deltaDecorations(this.breakpointDecorators, decorations);

        this.decoratorIdToBreakpointMap = {};
        for (let i = 0; i < this.breakpointDecorators.length; i++) {
            this.decoratorIdToBreakpointMap[this.breakpointDecorators[i]] = this.breakpoints[i];
        }

    }

    getBreakpointPositionsFromEditor() {
        let monacoEditorModel = this.main.getMonacoEditor().getModel();
        if(monacoEditorModel == null) return;
        for (let decoration of monacoEditorModel.getAllDecorations()) {
            if (decoration.options.marginClassName == "margin_breakpoint") {
                let breakpoint = this.decoratorIdToBreakpointMap[decoration.id];
                if (breakpoint != null) {
                    breakpoint.line = decoration.range.startLineNumber;
                }
            }
        }
    }

    findSymbolTableAtPosition(line: number, column: number) {
        if (this.mainSymbolTable == null) {
            return null;
        }

        if (line > this.mainSymbolTable.positionTo.line ||
            line == this.mainSymbolTable.positionTo.line && column > this.mainSymbolTable.positionTo.column
        ) {
            line = this.mainSymbolTable.positionTo.line;
            column = this.mainSymbolTable.positionTo.column - 1;
        }

        return this.mainSymbolTable.findTableAtPosition(line, column);
    }

    getErrorCount(): number {

        let ec = 0;
        for (let el of this.errors) {
            el.forEach(error => ec += error.level == "error" ? 1 : 0);
            // ec += el.length;
        }

        return ec;
    }

    hasMainProgram() {

        if (this.mainProgram == null) return false;
        if (this.mainProgram.statements == null) return false;
        return this.mainProgram.statements.length > 2 || this.mainProgram.statements.length == 2 && this.mainProgram.statements[0].type == TokenType.callMainMethod;

    }

    getProgramTextFromMonacoModel(): string {
        return this.model.getValue(monaco.editor.EndOfLinePreference.LF, false);
    }


    addIdentifierPosition(position: TextPosition, element: Type | Method | Attribute | Variable) {
        let positionList: IdentifierPosition[] = this.identifierPositions[position.line];
        if (positionList == null) {
            positionList = [];
            this.identifierPositions[position.line] = positionList;
        }
        positionList.push({
            position: position,
            element: element
        });
    }


    getTypeAtPosition(line: number, column: number): { type: Type, isStatic: boolean } {

        let positionsOnLine = this.identifierPositions[line];
        if (positionsOnLine == null) return null;

        let foundPosition: IdentifierPosition = null;
        for (let p of positionsOnLine) {
            if (column >= p.position.column && column <= p.position.column + p.position.length) {
                foundPosition = p;
                let element = foundPosition.element;
                if (element instanceof Method) {
                    return { type: element, isStatic: false };
                }
                // Attribute, Variable
                let type: Type = (element instanceof Type) ? element : element.type;
                //@ts-ignore
                if (foundPosition.position.length > 0 && element.type != null) {
                    //@ts-ignore
                    return { type: <Type>type, isStatic: false };
                }

                return { type: type, isStatic: foundPosition.position.length > 0 };

            }
        }

        return null;
    }

    getElementAtPosition(line: number, column: number): Klass | Interface | Method | Attribute | Variable {

        let positionsOnLine = this.identifierPositions[line];
        if (positionsOnLine == null) return null;

        let bestFoundPosition: IdentifierPosition = null;
        for (let p of positionsOnLine) {
            if (column >= p.position.column && column <= p.position.column + p.position.length) {

                if (p.position.length > 0) {
                    if (bestFoundPosition == null) {
                        bestFoundPosition = p;
                    } else {
                        if(p.element instanceof Method && bestFoundPosition.element instanceof Klass){
                            bestFoundPosition = p;
                        }
                    }
                }
            }
        }

        return bestFoundPosition == null ? null : <any>bestFoundPosition.element;
    }

    copy(): Module {
        let m = new Module(this.file, this.main);
        m.model = this.model;
        m.mainProgram = this.mainProgram;
        this.mainProgram = null;
        m.mainSymbolTable = this.mainSymbolTable;
        this.mainSymbolTable = null;
        m.typeStore = this.typeStore;
        // this.typeStore = null;
        m.isStartable = this.isStartable;
        m.dependsOnModulesWithErrors = this.dependsOnModulesWithErrors;

        m.breakpoints = this.breakpoints;
        this.breakpoints = [];
        let programs = m.getPrograms();

        programs.forEach((p) => p.module = m);

        for (let b of m.breakpoints) {
            this.breakpoints.push({
                line: b.line,
                column: b.column,
                statement: null
            });

            m.attachToStatement(b, programs);

        }

        this.file.dirty = true;

        return m;
    }

    clear() {

        this.identifierPositions = {};

        if (this.file != null && this.file.dirty) {
            // Lexer
            this.tokenList = null;
            this.errors[0] = [];

            // AST Parser
            this.errors[1] = [];


        }

        // type resolver
        this.errors[2] = [];
        this.typeNodes = [];
        this.typeStore = new TypeStore();

        // Code generator
        this.errors[3] = [];
        this.mainSymbolTable = new SymbolTable(null, { line: 1, column: 1, length: 1 }, { line: 100000, column: 1, length: 0 });
        this.mainProgram = null;

        this.methodCallPositions = {};
        this.dependsOnModules = new Map();

    }

    hasErrors() {

        for (let el of this.errors) {
            if(el.find(error => error.level == "error")){
                return true;
            }
            // if (el.length > 0) {
            //     return true;
            // }
        }

        return false;

    }

    getSortedAndFilteredErrors(): Error[] {

        let list: Error[] = [];

        for (let el of this.errors) {
            list = list.concat(el);
        }

        list.sort((a, b) => {
            if (a.position.line > b.position.line) {
                return 1;
            }
            if (b.position.line > a.position.line) {
                return -1;
            }
            if (a.position.column >= b.position.column) {
                return 1;
            }
            return -1;
        });

        for (let i = 0; i < list.length - 1; i++) {
            let e1 = list[i];
            let e2 = list[i + 1];
            if (e1.position.line == e2.position.line && e1.position.column + 10 > e2.position.column) {
                if(this.errorLevelCompare(e1.level, e2.level) == 1){
                    list.splice(i + 1, 1);
                } else {
                    list.splice(i, 1);
                }
                i--;
            }
        }

        return list;
    }

    errorLevelCompare(level1: ErrorLevel, level2: ErrorLevel): number {
        if(level1 == "error") return 1;
        if(level2 == "error") return 2;
        if(level1 == "warning") return 1;
        if(level2 == "warning") return 2;
        return 1;
    }

    renderStartButton() {
        let $buttonDiv = this.file?.panelElement?.$htmlFirstLine?.find('.jo_additionalButtonStart');
        if ($buttonDiv == null) return;

        $buttonDiv.find('.jo_startButton').remove();

        if (this.isStartable) {
            let $startButtonDiv = jQuery('<div class="jo_startButton img_start-dark jo_button jo_active" title="Hauptprogramm in der Datei starten"></div>');
            $buttonDiv.append($startButtonDiv);
            let that = this;
            $startButtonDiv.on('mousedown', (e) => e.stopPropagation());
            $startButtonDiv.on('click', (e) => {
                e.stopPropagation();

                that.main.setModuleActive(that);

                that.main.getInterpreter().start();
            });

        } 
    }


}

export class BaseModule extends Module {
    constructor(main: MainBase) {

        super({ name: "Base Module", text: "", text_before_revision: null, submitted_date: null, student_edited_after_revision: false,
         dirty: false, saved: true, version: 1 , identical_to_repository_version: true}, main);

        this.isSystemModule = true;
        this.mainProgram = null;

        this.clear();


        this.typeStore.addType(voidPrimitiveType);
        this.typeStore.addType(intPrimitiveType); 
        this.typeStore.addType(longPrimitiveType); 
        this.typeStore.addType(shortPrimitiveType); 
        this.typeStore.addType(floatPrimitiveType);
        this.typeStore.addType(doublePrimitiveType);
        this.typeStore.addType(charPrimitiveType);
        this.typeStore.addType(booleanPrimitiveType);
        this.typeStore.addType(stringPrimitiveType);
        this.typeStore.addType(objectType);
        this.typeStore.addType(varType);

        this.typeStore.addType(IntegerType);
        this.typeStore.addType(LongType);
        this.typeStore.addType(FloatType);
        this.typeStore.addType(DoubleType);
        this.typeStore.addType(CharacterType);
        this.typeStore.addType(BooleanType);


        this.typeStore.addType(new PositionClass(this));
        this.typeStore.addType(new BigIntegerClass(this));

        // Collections Framework
        this.typeStore.addType(new IteratorClass(this));
        this.typeStore.addType(new IterableClass(this));
        this.typeStore.addType(new CollectionClass(this));
        this.typeStore.addType(new ListClass(this));
        this.typeStore.addType(new ArrayListClass(this));
        this.typeStore.addType(new VectorClass(this));
        this.typeStore.addType(new QueueClass(this));
        this.typeStore.addType(new DequeClass(this));
        this.typeStore.addType(new LinkedListClass(this));
        this.typeStore.addType(new StackClass(this));
        this.typeStore.addType(new ListIteratorImplClass(this));
        this.typeStore.addType(new SetClass(this));
        this.typeStore.addType(new HashSetClass(this));
        this.typeStore.addType(new LinkedHashSetClass(this));
        this.typeStore.addType(new SetIteratorImplClass(this));
        this.typeStore.addType(new MapClass(this));
        this.typeStore.addType(new HashMapClass(this));
        this.typeStore.addType(new CollectionsClass(this));


        this.typeStore.addType(new ConsoleClass(this));
        this.typeStore.addType(new MathClass(this));
        this.typeStore.addType(new FilesClass(this));
        this.typeStore.addType(new RandomClass(this));
        this.typeStore.addType(new DecimalFormatClass(this));
        this.typeStore.addType(new Vector2Class(this));
        this.typeStore.addType(new MathToolsClass(this));
        this.typeStore.addType(new KeyClass(this));
        this.typeStore.addType(new SoundClass(this));
        this.typeStore.addType(new InputClass(this));
        this.typeStore.addType(new Runnable(this));
        this.typeStore.addType(new TimerClass(this));
        this.typeStore.addType(new ColorClass(this));
        this.typeStore.addType(new ActorClass(this));
        this.typeStore.addType(new DirectionClass(this));
        let shapeClass = new ShapeClass(this);
        this.typeStore.addType(shapeClass);
        this.typeStore.addType(new FilledShapeClass(this));
        this.typeStore.addType(new RectangleClass(this));
        this.typeStore.addType(new RoundedRectangleClass(this));
        this.typeStore.addType(new CircleClass(this));
        this.typeStore.addType(new SectorClass(this));
        this.typeStore.addType(new ArcClass(this));
        this.typeStore.addType(new EllipseClass(this));
        this.typeStore.addType(new BitmapClass(this));
        this.typeStore.addType(new AlignmentClass(this));
        this.typeStore.addType(new TextClass(this));
        this.typeStore.addType(new ScaleModeClass(this));
        this.typeStore.addType(new SpriteLibraryClass(this));
        this.typeStore.addType(new RepeatTypeClass(this));
        this.typeStore.addType(new TileClass(this));
        let spriteClass = new SpriteClass(this);
        this.typeStore.addType(spriteClass);

        shapeClass.setSpriteType(spriteClass);

        this.typeStore.addType(new CollisionPairClass(this));
        this.typeStore.addType(new GroupClass(this));
        this.typeStore.addType(new PolygonClass(this));
        this.typeStore.addType(new LineClass(this));
        this.typeStore.addType(new TriangleClass(this));
        this.typeStore.addType(new TurtleClass(this));

        this.typeStore.addType(new JsonElementClass(this));
        this.typeStore.addType(new JsonParserClass(this));

        this.typeStore.addType(new HttpHeaderType(this));
        this.typeStore.addType(new HttpRequestClass(this));
        this.typeStore.addType(new HttpResponseClass(this));
        this.typeStore.addType(new HttpClientClass(this));
        this.typeStore.addType(new URLEncoderClass(this));
       
        
        this.typeStore.addType(new ChangeListenerClass(this));
        this.typeStore.addType(new GuiComponentClass(this));
        this.typeStore.addType(new GuiTextComponentClass(this));
        
        this.typeStore.addType(new TextFieldClass(this));
        this.typeStore.addType(new CheckBoxClass(this));
        this.typeStore.addType(new RadioButtonClass(this));
        this.typeStore.addType(new ButtonClass(this));

        this.typeStore.addType(new JavaKaraWorldClass(this));
        this.typeStore.addType(new KaraClass(this));
        this.typeStore.addType(new JavaHamsterWorldClass(this));
        this.typeStore.addType(new HamsterClass(this));

        this.typeStore.addType(new MouseListenerInterface(this));
        this.typeStore.addType(new MouseAdapterClass(this));
        this.typeStore.addType(new GamepadClass(this));
        this.typeStore.addType(new WorldClass(this));
        this.typeStore.addType(new ProcessingClass(this));

        (<ActorClass>this.typeStore.getType("Actor")).registerWorldType();


        this.typeStore.addType(new PrintStreamClass(this));
        this.typeStore.addType(new KeyListener(this));
        this.typeStore.addType(new SystemClass(this));
        this.typeStore.addType(new SystemToolsClass(this));
        this.typeStore.addType(new DayOfWeekEnum(this));
        this.typeStore.addType(new MonthEnum(this));
        this.typeStore.addType(new LocalDateTimeClass(this));
    
        this.typeStore.addType(new WebSocketClientClass(this));
        this.typeStore.addType(new WebSocketClass(this));

        this.typeStore.addType(new RobotWorldClass(this));
        this.typeStore.addType(new RobotClass(this));

        this.typeStore.addType(new ResultSetClass(this));
        this.typeStore.addType(new DatabaseStatementClass(this));
        this.typeStore.addType(new DatabasePreparedStatementClass(this));
        this.typeStore.addType(new ConnectionClass(this));
        this.typeStore.addType(new DatabaseManagerClass(this));

    

        stringPrimitiveType.module = this;
        // stringPrimitiveType.baseClass = <any>(this.typeStore.getType("Object"));
        // stringPrimitiveType.baseClass = objectType;
        // IntegerType.baseClass = objectType;
        // DoubleType.baseClass = objectType;
        // FloatType.baseClass = objectType;
        // CharacterType.baseClass = objectType;
        // BooleanType.baseClass = objectType;

    }

    clearUsagePositions() {
        for (let type of this.typeStore.typeList) {
            type.clearUsagePositions();
        }

    }


}

export class GNGModule extends Module {
    constructor(main: MainBase, moduleStore: ModuleStore) {

        super({ name: "Graphics and Games - Module", text: "", text_before_revision: null, submitted_date: null, 
        student_edited_after_revision: false, dirty: false, saved: true, version: 1 , identical_to_repository_version: true}, main);

        this.isSystemModule = true;
        this.mainProgram = null;

        this.clear();

        this.typeStore.addType(new GNGAktionsempfaengerInterface(this));
        this.typeStore.addType(new GNGBaseFigurClass(this, moduleStore));
        this.typeStore.addType(new GNGZeichenfensterClass(this, moduleStore));
        this.typeStore.addType(new GNGEreignisbehandlung(this, moduleStore));
        this.typeStore.addType(new GNGRechteckClass(this, moduleStore));
        this.typeStore.addType(new GNGDreieckClass(this, moduleStore));
        this.typeStore.addType(new GNGKreisClass(this, moduleStore));
        this.typeStore.addType(new GNGTextClass(this, moduleStore));
        this.typeStore.addType(new GNGTurtleClass(this, moduleStore));
        this.typeStore.addType(new GNGFigurClass(this, moduleStore));
        this.typeStore.addType(new KeyEventClass(this, moduleStore));

    }

    clearUsagePositions() {
        for (let type of this.typeStore.typeList) {
            type.clearUsagePositions();
        }

    }


}


export class ModuleStore {

    private modules: Module[] = [];
    private moduleMap: {[name: string]: Module} = {};
    private baseModule: BaseModule;

    dirty: boolean = false;

    constructor(private main: MainBase, withBaseModule: boolean, private additionalLibraries: string[] = []) {
        if (withBaseModule) {
            this.baseModule = new BaseModule(main);
            this.putModule(this.baseModule);
        }
        
        // additionalLibraries = ["gng"];

        for(let lib of additionalLibraries){
            this.addLibraryModule(lib);
        }
    }

    rename(oldName: string, newName: string) {
        let module = this.moduleMap[oldName];
        if(module == null) return;
        this.moduleMap[oldName] = undefined;
        this.moduleMap[newName] = module;
    }

    addLibraryModule(identifier: string){
        switch(identifier){
            case "gng": this.putModule(new GNGModule(this.main, this));
            break;
        }
    }

    setAdditionalLibraries(additionalLibraries: string[]){

        this.modules = this.modules.filter( m => (!m.isSystemModule) || m instanceof BaseModule);
        this.moduleMap = {};

        for(let m of this.modules){
            this.moduleMap[m.file.name] =  m;
        }

        if(additionalLibraries != null){
            for(let lib of additionalLibraries){
                this.addLibraryModule(lib);
            }
        }

    }

    findModuleById(module_id: number): Module {
        for(let module of this.modules){
            if(module.file.id == module_id) return module;
        }
        return null;
    }

    public getBaseModule() {
        return this.baseModule;
    }

    public clearUsagePositions() {
        this.baseModule.clearUsagePositions();
    }

    copy(): ModuleStore {
        let ms: ModuleStore = new ModuleStore(this.main, true);
        for (let m of this.modules) {
            if (!m.isSystemModule) {
                ms.putModule(m.copy());
            }
        }
        return ms;
    }

    findModuleByFile(file: File) {
        for (let m of this.modules) {
            if (m.file == file) {
                return m;
            }
        }
        return null;
    }

    hasErrors(): boolean {
        for (let m of this.modules) {
            if (m.hasErrors()) {
                return true;
            }
        }
        return false;
    }

    getFirstModule(): Module {
        if (this.modules.length > 0) {
            for (let mo of this.modules) {
                if (!mo.isSystemModule) {
                    return mo;
                }
            }
        }
        return null;
    }

    isDirty(): boolean {

        if (this.dirty) {
            this.dirty = false;
            return true;
        }

        let dirty = false;
        for (let m of this.modules) {
            if (m.file.dirty) {
                dirty = true;
                break;
            }
        }
        return dirty;
    }

    getJavaModules(includeSystemModules: boolean = false){
        return this.getModules(includeSystemModules).filter( m => FileTypeManager.filenameToFileType(m.file.name).file_type == 0);
    }

    getModules(includeSystemModules: boolean, excludedModuleName?: String): Module[] {
        let ret = [];
        for (let m of this.modules) {
            if (m.file.name != excludedModuleName) {
                if (!m.isSystemModule || includeSystemModules) {
                    ret.push(m);
                }
            }
        }
        return ret;
    }

    putModule(module: Module) {
        this.modules.push(module);
        this.moduleMap[module.file.name] = module;
    }

    removeModuleWithFile(file: File) {
        for (let m of this.modules) {
            if (m.file == file) {
                this.removeModule(m);
                break;
            }
        }
    }

    removeModule(module: Module) {

        if (this.modules.indexOf(module) < 0) return;

        this.modules.splice(this.modules.indexOf(module), 1);
        this.moduleMap[module.file.name] = undefined;
        this.dirty = true;
    }

    getModule(moduleName: string): Module {
        return this.moduleMap[moduleName];
    }

    getType(identifier: string): { type: Type, module: Module } {
        for (let module of this.modules) {
            if (module.typeStore != null) {
                let type = module.typeStore.getType(identifier);
                if (type != null) {
                    return { type: type, module: module }
                }
            }
        }

        return null;
    }

    getTypeCompletionItems(moduleContext: Module, rangeToReplace: monaco.IRange): monaco.languages.CompletionItem[] {

        let completionItems: monaco.languages.CompletionItem[] = [];

        for (let module of this.modules) {
            if (module.typeStore != null) {
                for (let type of module.typeStore.typeList) {
                    if (module == moduleContext || (type instanceof Klass && type.visibility == Visibility.public)
                        || module.isSystemModule) {

                        let detail = "Klasse";

                        if(type.documentation != null){
                            detail = type.documentation;
                        } else if (module.isSystemModule) {
                            if (type instanceof PrimitiveType) {
                                detail = "Primitiver Datentyp";
                            } else {
                                detail = "Systemklasse";
                            }
                        }

                        let item = {
                            label: type.identifier,
                            detail: detail,
                            insertText: type.identifier,
                            kind: type instanceof PrimitiveType ?
                                monaco.languages.CompletionItemKind.Struct : monaco.languages.CompletionItemKind.Class,
                            range: rangeToReplace,
                            generic: ((type instanceof Klass || type instanceof Interface) && type.typeVariables.length > 0)
                        };

                        completionItems.push(item);
                    }
                }
            }
        }

        return completionItems;

    }




}


export class TypeStore {

    typeList: Type[] = [];
    typeMap: Map<string, Type> = new Map();

    addType(type: Type) {
        this.typeList.push(type);
        this.typeMap.set(type.identifier, type);
    }

    clear() {
        this.typeList.length = 0;
        this.typeMap.clear();
    }

    getType(identifier: string) {
        return this.typeMap.get(identifier);
    }



}
