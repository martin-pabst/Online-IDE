import { Interface, Klass } from "../../../../compiler/types/Class.js";
import { Workspace } from "../../../../workspace/Workspace.js";
import { Main } from "../../../Main.js";
import { Diagram, DiagramUnitCm } from "../Diagram.js";
import { ClassBox, SerializedClassBox } from "./ClassBox.js";
import { DiagramArrow } from "./DiagramArrow.js";
import { RoutingInput, RoutingOutput } from "./Router.js";
import { MainBase } from "../../../MainBase.js";
import { openContextMenu } from "../../../../tools/HtmlTools.js";
import { TeachersWithClassesMI } from "../../../../administration/TeachersWithClasses.js";
import jQuery from 'jquery';

type ClassBoxes = {
    active: ClassBox[],
    inactive: ClassBox[],
    displaySystemClasses: boolean,
    parametersWithTypes: boolean
};

export type SerializedClassDiagram = {
    classBoxes: SerializedClassBox[],
    displaySystemClasses: boolean,
    parametersWithTypes: boolean
}

export class ClassDiagram extends Diagram {

    classBoxesRepository: { [workspaceId: number]: ClassBoxes } = {};

    arrows: DiagramArrow[] = [];

    currentWorkspaceId: number = null;
    currentWorkspace: Workspace;
    currentClassBoxes: ClassBoxes;

    version: number = 0;

    straightArrowSectionAfterRectangle = 2;
    distanceFromRectangles = 2;
    slotDistance = 2;

    dirty: boolean = false;
    routingWorker: Worker;

    constructor(private $htmlElement: JQuery<HTMLElement>, main: MainBase) {
        super($htmlElement, main);

        let that = this;
        this.$menuButton.on('click', (ev) => {
            ev.preventDefault();
            let displaysSystemClasses = that.currentClassBoxes.displaySystemClasses == true;
            let parametersWithTypes = that.currentClassBoxes.parametersWithTypes == true;
            openContextMenu([
                {
                    caption: displaysSystemClasses ? "Systemklassen ausblenden" : "Systemklassen einblenden",
                    callback: () => {
                        that.currentClassBoxes.displaySystemClasses = !displaysSystemClasses;
                        that.drawDiagram(that.currentWorkspace, false);
                    }
                },
                {
                    caption: parametersWithTypes ? "Parameter ausblenden" : "Parameter einblenden",
                    callback: () => {
                        that.currentClassBoxes.parametersWithTypes = !parametersWithTypes;
                        that.currentClassBoxes.active.forEach((cb) => {cb.hashedSignature = -1});
                        that.drawDiagram(that.currentWorkspace, false);
                    }
                },
            ], ev.pageX + 2, ev.pageY + 2);
            ev.stopPropagation();
        });
    }

    duplicateSerializedClassDiagram(oldWorkspaceId: number, newWorkspaceId: number){
        let classBoxesSrc: ClassBoxes = this.classBoxesRepository[oldWorkspaceId];

        let classBoxesDest: ClassBoxes = {
            inactive: classBoxesSrc.active.map(cb => cb.copy()).concat(classBoxesSrc.inactive.map(cb => cb.copy())),
            active: [],
            displaySystemClasses: classBoxesSrc.displaySystemClasses,
            parametersWithTypes: classBoxesSrc.parametersWithTypes 
        };

        this.classBoxesRepository[newWorkspaceId] = classBoxesDest;
        this.dirty = true;

    }

    clearAfterLogout() {
        this.classBoxesRepository = {};
        this.arrows.forEach((arrow) => { arrow.remove(); });
        jQuery(this.svgElement).find(':not(.centerRectangle)').remove();
    }

    serialize(): SerializedClassDiagram {

        if(this.currentClassBoxes == null) return;

        let scd: SerializedClassDiagram = {
            classBoxes: [],
            displaySystemClasses: this.currentClassBoxes.displaySystemClasses,
            parametersWithTypes: this.currentClassBoxes.parametersWithTypes
        }

        for (let workspaceId in this.classBoxesRepository) {
            let classBox = this.classBoxesRepository[workspaceId];
            for (let cb of classBox.active) {
                let cbs = cb.serialize();
                cbs.workspaceId = Number.parseInt(workspaceId);
                scd.classBoxes.push(cbs);
            }
        }

        return scd;

    }

    deserialize(serializedClassDiagram: SerializedClassDiagram) {
        for (let cb of serializedClassDiagram.classBoxes) {
            let classBoxes: ClassBoxes = this.classBoxesRepository[cb.workspaceId];
            if (classBoxes == null) {
                classBoxes = {
                    active: [],
                    inactive: [],
                    displaySystemClasses: false,
                    parametersWithTypes: false
                }
                this.classBoxesRepository[cb.workspaceId] = classBoxes;
            }
            classBoxes.inactive.push(ClassBox.deserialize(this, cb));
            classBoxes.displaySystemClasses = serializedClassDiagram.displaySystemClasses;
            classBoxes.parametersWithTypes = serializedClassDiagram.parametersWithTypes;
        }
    }


    adjustClassDiagramSize() {
        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];
        this.adjustSizeAndElements(classBoxes.active);
    }

    getClassBoxes(workspace: Workspace): ClassBoxes {
        let cb: ClassBoxes = this.classBoxesRepository[workspace.id];
        if (cb == null) {
            cb = {
                active: [],
                inactive: [],
                displaySystemClasses: false,
                parametersWithTypes: false
            }
            this.classBoxesRepository[workspace.id] = cb;
        }
        return cb;
    }

    switchToWorkspace(workspace: Workspace): ClassBoxes {
        let cbs1 = this.getClassBoxes(workspace);

        if (this.currentWorkspaceId != workspace.id) {
            if (this.currentWorkspaceId != null) {
                let cbs = this.classBoxesRepository[this.currentWorkspaceId];
                if (cbs != null) {
                    for (let cb of cbs.active) {
                        cb.detach();
                    }
                    for (let cb of cbs.inactive) {
                        cb.detach();
                    }
                }
            }

            for (let cb of cbs1.active) {
                this.svgElement.appendChild(cb.$element[0]);
            }
            for (let cb of cbs1.inactive) {
                if (cb.$element != null) {
                    this.svgElement.appendChild(cb.$element[0]);
                }
            }

            this.adjustSizeAndElements(cbs1.active);
        }

        this.currentWorkspaceId = workspace.id;

        return cbs1;

    }

    drawDiagram(workspace: Workspace, onlyUpdateIdentifiers: boolean) {

        if (workspace == null) return;
        this.currentWorkspace = workspace;
        this.currentClassBoxes = this.switchToWorkspace(workspace);

        let moduleStore = workspace.moduleStore;

        let newClassBoxes: ClassBox[] = [];

        let anyTypelistThere: boolean = false;
        let newClassesToDraw: (Klass | Interface)[] = [];
        let usedSystemClasses: (Klass | Interface)[] = [];

        for (let module of moduleStore.getModules(false)) {
            let typeList = module?.typeStore?.typeList;
            if (typeList == null) continue;
            anyTypelistThere = true;


            typeList.filter((type) => {
                return type instanceof Klass ||
                    type instanceof Interface
            }).forEach((klass: Klass | Interface) => {
                let cb: ClassBox = this.findAndEnableClass(klass, this.currentClassBoxes, newClassesToDraw);
                if (cb != null) newClassBoxes.push(cb);
                if (klass instanceof Klass) {
                    klass.registerUsedSystemClasses(usedSystemClasses);
                }
            });
        }

        // recursively register system classes that are used by other system classes
        let uscList1: (Klass | Interface)[] = [];
        while (uscList1.length < usedSystemClasses.length) {
            uscList1 = usedSystemClasses.slice(0);
            for (let usc of uscList1) {
                if (usc instanceof Klass) {
                    usc.registerUsedSystemClasses(usedSystemClasses);
                }
            }
        }

        if (this.currentClassBoxes.displaySystemClasses) {
            for (let usc of usedSystemClasses) {
                let cb: ClassBox = this.findAndEnableClass(usc, this.currentClassBoxes, newClassesToDraw);
                if (cb != null) newClassBoxes.push(cb);
            }
        }

        this.dirty = this.dirty || newClassesToDraw.length > 0;

        for (let klass of newClassesToDraw) {
            let cb = new ClassBox(this, Math.random() * 10 * DiagramUnitCm, Math.random() * 10 * DiagramUnitCm, klass);

            cb.renderLines();

            let freePos = this.findFreeSpace(newClassBoxes, cb.widthCm, cb.heightCm, this.minDistance);

            cb.moveTo(freePos.x, freePos.y, true);

            newClassBoxes.push(cb);

        }

        if (newClassesToDraw.length > 0) {
            this.adjustSizeAndElements(newClassBoxes);
        }

        if (!anyTypelistThere) return;

        for (let cb of this.currentClassBoxes.active) {
            cb.hide();
            cb.active = false;
            this.currentClassBoxes.inactive.push(cb);
        }

        this.currentClassBoxes.active = newClassBoxes;

        if (!onlyUpdateIdentifiers) {
            this.adjustClassDiagramSize();
            this.updateArrows();
        }

    }

    updateArrows() {
        this.$htmlElement.find('.jo_classdiagram-spinner').hide();

        // return;

        let colors: string[] = ["#0075dc", "#993f00", "#005c31", "#ff5005", "#2bce48",
            "#0000ff", "#ffa405", '#ffa8bb', '#740aff', '#990000', '#ff0000'];
        let colorIndex = 0;

        let routingInput = this.drawArrows();

        this.version++;
        routingInput.version = this.version;

        if (this.routingWorker != null) {
            this.routingWorker.terminate();
        }

        this.routingWorker = new Worker('worker/diagram-worker.js');
        let that = this;
        this.routingWorker.onmessage = function (e) {
            // when worker finished:
            let ro: RoutingOutput = e.data;
            if (ro.version == that.version) {
                that.$htmlElement.find('.jo_classdiagram-spinner').hide();

                that.arrows.forEach((arrow) => { arrow.remove(); });

                let arrowIdentifierToColorMap: { [identifier: string]: string } = {};

                let arrowsWithoutColor: number = ro.arrows.length + 1;
                let arrowsWithoutColorLast: number;
                do {
                    arrowsWithoutColorLast = arrowsWithoutColor;
                    arrowsWithoutColor = 0;
                    ro.arrows.forEach((arrow) => {
                        if (arrow.color == null) {
                            arrowsWithoutColor++;
                            if (arrow.endsOnArrowWithIdentifier == null) {
                                arrow.color = colors[colorIndex];
                                arrowIdentifierToColorMap[arrow.identifier] = arrow.color;
                                colorIndex++;
                                if (colorIndex > colors.length - 1) colorIndex = 0;
                            } else {
                                arrow.color = arrowIdentifierToColorMap[arrow.endsOnArrowWithIdentifier];
                            }
                        }
                    });
                } while (arrowsWithoutColor < arrowsWithoutColorLast);

                ro.arrows.forEach((arrow) => {
                    if (arrow.color == null) {
                        arrow.color = "#ff0000";
                    }
                });

                ro.arrows.forEach((arrow) => {
                    let da: DiagramArrow = new DiagramArrow(that.svgElement, arrow, arrow.color);
                    da.render();
                    that.arrows.push(da);
                });


            }
        }

        this.routingWorker.postMessage(routingInput); // start worker!
        this.$htmlElement.find('.jo_classdiagram-spinner').show();

    }

    drawArrows(): RoutingInput {

        let routingInput: RoutingInput = {
            rectangles: [],
            arrows: [],
            xMax: Math.ceil(this.widthCm / DiagramUnitCm),
            yMax: Math.ceil(this.heightCm / DiagramUnitCm),
            straightArrowSectionAfterRectangle: this.straightArrowSectionAfterRectangle,
            distanceFromRectangles: this.distanceFromRectangles,
            slotDistance: this.slotDistance
        }

        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];

        classBoxes.active.forEach((cb) => {
            routingInput.rectangles.push(cb.getRoutingRectangle());
        });

        classBoxes.active.forEach((cb) => {

            if (cb.klass instanceof Klass) {
                if (cb.klass.baseClass != null) {
                    let cb1 = this.findClassbox(cb.klass.baseClass, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb, cb1, "inheritance", routingInput);
                    }
                }
                for (let intf of cb.klass.implements) {
                    let cb1 = this.findClassbox(intf, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb, cb1, "realization", routingInput);
                    }
                }
                for (let cd of cb.klass.getCompositeData()) {
                    let cb1 = this.findClassbox(cd.klass, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb1, cb, "composition", routingInput);
                    }
                }

            }

        });


        return routingInput;

    }

    drawArrwow(cb1: ClassBox, cb2: ClassBox, arrowType: string, routingInput: RoutingInput) {

        let rect1 = cb1.getRoutingRectangle();
        let rect2 = cb2.getRoutingRectangle();

        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];

        routingInput.arrows.push({
            arrowType: arrowType,

            destRectangleIndex: classBoxes.active.indexOf(cb2),

            sourceRectangleIndex: classBoxes.active.indexOf(cb1),

            destinationIdentifier: cb2.className,
            identifier: cb1.className + "(extends)" + cb2.className
        });

    }

    findClassbox(klass: Klass | Interface, classBoxes: ClassBox[]): ClassBox {

        for (let cb of classBoxes) {
            if (cb.klass == klass) return cb;
        }

        return null;

    }

    findAndEnableClass(klass: Klass | Interface, classBoxes: ClassBoxes, newClassesToDraw: (Klass | Interface)[]): ClassBox {
        let i = 0;
        while (i < classBoxes.active.length) {
            let k = classBoxes.active[i];
            if (k.className == klass.identifier || k.hasSignatureAndFileOf(klass)) {
                k.attachToClass(klass);
                classBoxes.active.splice(i, 1);
                return k;
            }
            i++;
        }

        i = 0;
        while (i < classBoxes.inactive.length) {
            let k = classBoxes.inactive[i];
            if (k.className == klass.identifier || k.hasSignatureAndFileOf(klass)) {
                classBoxes.inactive.splice(i, 1);
                k.klass = klass;
                k.renderLines();
                k.show();
                k.active = true;
                this.dirty = true;
                return k;
            }
            i++;
        }

        newClassesToDraw.push(klass);

        return null;
    }

    clear() {

        let cb = this.classBoxesRepository[this.currentWorkspaceId];
        if (cb != null) {
            for (let c of cb.active) {
                c.detach();
            }
        }

    }

}