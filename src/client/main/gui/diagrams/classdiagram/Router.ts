onmessage = function (e) {

    let ri: RoutingInput = e.data;
    
    if(ri.xMax == null) return; // BugFix 06.06.2020: Monaco Editor sends messages to everyone...

    let router: Router = new Router(ri);
    router.arrows = ri.arrows;

    let result = router.routeAllArrows();

    //@ts-ignore
    postMessage(result);

    self.close();

}

export type RoutingInput = {
    xMax: number,
    yMax: number,
    straightArrowSectionAfterRectangle?: number,
    distanceFromRectangles: number,
    slotDistance: number,
    rectangles: Rectangle[];
    arrows: RoutingArrow[];
    version?: number;
}

export type RoutingOutput = {
    xMax: number,
    yMax: number,
    arrows: RoutingArrow[],
    rectangles: Rectangle[],
    weights: number[][],
    locks: number[][],
    version: number
}

export type Rectangle = { top: number, left: number, width: number, height: number };

type Slot = {
    arrowDirectionOutward: Point,
    deltaFromSlotToSlot: Point,
    usedFrom?: number,
    usedTo?: number,
    lastDelta: number,
    mid: Point,
    min: number,
    max: number
}

type RoutingRectangle = Rectangle & {
    slots: Slot[];
};

export type RoutingArrow = {
    identifier: string,

    // input
    source?: Point,
    sourceDirection?: Point,
    sourceRectangleIndex: number;

    dest?: Point,
    destDirection?: Point,
    destRectangleIndex: number;

    arrowType: string,
    destinationIdentifier: string,
    debug?: boolean,

    // output
    points?: Point[],
    minimalPoints?: Point[],
    endsOnArrowWithIdentifier?: string,
    color?: string
}

type routeVariant = {
    source: Point,
    sourceDirection: Point,

    sourceDeltaFromMid: number,


    dest: Point,
    destDirection: Point,

    destDeltaFromMid: number,

    // output
    points?: Point[],
    minimalPoints?: Point[],
    endsOnArrowWithIdentifier?: string,

    weightSum: number,

    sourceSlot: Slot,
    destSlot: Slot
}


export type Point = { x: number, y: number };

type RouteStrategy = {
    straight: number,
    normal: number,
    bonus: number
};

class Router {

    weights: number[][];
    locks: number[][];
    arrowPointField: RoutingArrow[][][];

    static RectangleWeight = 1000;

    rectangles: RoutingRectangle[] = [];
    arrows: RoutingArrow[];


    constructor(public routingInput: RoutingInput) {
        this.initRoutingRectangles(routingInput.rectangles);
        this.arrows = routingInput.arrows;
        this.arrowPointField = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(null));
    }

    initRoutingRectangles(rectangles: Rectangle[]) {
        if(rectangles == null) return;
        for (let r of rectangles) {
            this.rectangles.push({
                left: r.left,
                width: r.width,
                top: r.top,
                height: r.height,
                slots: [
                    {   // top
                        arrowDirectionOutward: { x: 0, y: -1 },
                        deltaFromSlotToSlot: { x: 1, y: 0 },
                        min: 1 - Math.round(r.width / 2),
                        max: r.width - Math.round(r.width / 2) - 1,
                        mid: { x: r.left + Math.round(r.width / 2), y: r.top },
                        lastDelta: -1
                    },
                    {   // right
                        arrowDirectionOutward: { x: 1, y: 0 },
                        deltaFromSlotToSlot: { x: 0, y: 1 },
                        min: 1 - Math.round(r.height / 2),
                        max: r.height - Math.round(r.height / 2) - 1,
                        mid: { x: r.left + r.width, y: r.top + Math.round(r.height / 2) },
                        lastDelta: -1
                    },
                    {   // bottom
                        arrowDirectionOutward: { x: 0, y: 1 },
                        deltaFromSlotToSlot: { x: 1, y: 0 },
                        min: 1 - Math.round(r.width / 2),
                        max: r.width - Math.round(r.width / 2) - 1,
                        mid: { x: r.left + Math.round(r.width / 2), y: r.top + r.height },
                        lastDelta: -1
                    },
                    {   // left
                        arrowDirectionOutward: { x: -1, y: 0 },
                        deltaFromSlotToSlot: { x: 0, y: 1 },
                        min: 1 - Math.round(r.height / 2),
                        max: r.height - Math.round(r.height / 2) - 1,
                        mid: { x: r.left, y: r.top + Math.round(r.height / 2) },
                        lastDelta: -1
                    }
                ]
            })
        }
    }

    initWeights() {

        this.weights = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(-1));
        this.locks = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));

    }

    prepareRectangles() {

        let distanceFromRectangles = this.routingInput.distanceFromRectangles;
        if (distanceFromRectangles == null) distanceFromRectangles = 1;

        for (let r of this.rectangles) {
            let left = r.left - distanceFromRectangles;
            if (left < 0) left = 0;
            let right = r.left + r.width + distanceFromRectangles;
            if (right > this.routingInput.xMax - 1) right = this.routingInput.xMax - 1;
            let top = r.top - distanceFromRectangles;
            if (top < 0) top = 0;
            let bottom = r.top + r.height + distanceFromRectangles;
            if (bottom > this.routingInput.yMax - 1) bottom = this.routingInput.yMax - 1;
            for (let y = top; y <= bottom; y++) {
                for (let x = left; x <= right; x++) {
                    this.locks[x][y] = Router.RectangleWeight;
                }
            }

        }
    }

    smoothArrows() {

        this.weights = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));
        for (let a of this.arrows) {
            if (a.points == null) continue;
            for (let p of a.points) {
                this.weights[p.x][p.y]++;
            }
        }

        this.locks = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));
        this.prepareRectangles();

        let done = false;
        while (!done) {
            done = true;

            let p: Point[] = [null, null, null, null];
            let delta: Point[] = [null, null, null];

            for (let a of this.arrows) {
                if (a.points == null || a.minimalPoints == null) continue;

                let arrowDirty = false;

                let debug: boolean = a.identifier == "a3";
                if (debug) debugger;

                if (a.minimalPoints.length > 4) {

                    for (let i = 0; i < a.minimalPoints.length - 4; i++) {

                        for (let j = 0; j <= 3; j++) {
                            p[j] = a.minimalPoints[i + j];
                        }

                        for (let j = 0; j <= 2; j++) {
                            delta[j] = { x: p[j + 1].x - p[j].x, y: p[j + 1].y - p[j].y };
                        }

                        if (this.sameDirection(delta[0], delta[2]) &&
                            !this.sameDirection(delta[0], delta[1])) {

                            let d01 = Math.abs(delta[0].x) + Math.abs(delta[0].y);
                            let d12 = Math.abs(delta[1].x) + Math.abs(delta[1].y);
                            let d23 = Math.abs(delta[2].x) + Math.abs(delta[2].y);

                            // if(d12 > 20 || d23 > 20) continue;

                            let x = p[0].x;
                            let y = p[0].y;

                            // if(x == 8 && y == 2) debugger;

                            let free: boolean = true;
                            for (let i = 1; i <= Math.round(d12); i++) {
                                x += Math.sign(delta[1].x);
                                y += Math.sign(delta[1].y);
                                if (this.weights[x][y] != 0 || this.locks[x][y] != 0) {
                                    free = false;
                                    break;
                                }
                            }

                            for (let i = 1; i < Math.round(d01); i++) {
                                x += Math.sign(delta[0].x);
                                y += Math.sign(delta[0].y);
                                if (this.weights[x][y] != 0 || this.locks[x][y] != 0) {
                                    free = false;
                                    break;
                                }
                            }

                            if (free) {
                                x = p[0].x;
                                y = p[0].y;
                                for (let i = 1; i <= Math.round(d12); i++) {
                                    x += Math.sign(delta[1].x);
                                    y += Math.sign(delta[1].y);
                                    this.weights[x][y] = 1;
                                }
                                for (let i = 1; i < Math.round(d01); i++) {
                                    x += Math.sign(delta[0].x);
                                    y += Math.sign(delta[0].y);
                                    this.weights[x][y] = 1;
                                }

                                x = p[0].x;
                                y = p[0].y;
                                for (let i = 1; i <= Math.round(d01); i++) {
                                    x += Math.sign(delta[0].x);
                                    y += Math.sign(delta[0].y);
                                    this.weights[x][y] = 0;
                                }
                                for (let i = 1; i < Math.round(d12); i++) {
                                    x += Math.sign(delta[1].x);
                                    y += Math.sign(delta[1].y);
                                    this.weights[x][y] = 0;
                                }

                                let s = a.identifier + ": ";
                                for (let p of a.minimalPoints) s += "(" + p.x + ", " + p.y + "),";

                                p[1].x = p[0].x + delta[1].x;
                                p[1].y = p[0].y + delta[1].y;

                                let delete2And3: boolean = p[1].x == p[3].x && p[1].y == p[3].y;

                                a.minimalPoints.splice(i + 2, delete2And3 ? 2 : 1);
                                arrowDirty = true;

                                i--;

                                done = false;
                            }

                        }

                    }

                }

                if (arrowDirty) {

                    for (let i = 0; i < a.minimalPoints.length - 2; i++) {

                        if (
                            a.minimalPoints[i + 0].x == a.minimalPoints[i + 1].x &&
                            a.minimalPoints[i + 1].x == a.minimalPoints[i + 2].x ||
                            a.minimalPoints[i + 0].y == a.minimalPoints[i + 1].y &&
                            a.minimalPoints[i + 1].y == a.minimalPoints[i + 2].y
                        ) {

                            a.minimalPoints.splice(i + 1, 1);
                            i--;

                        }

                    }

                    let s = "->";
                    for (let p of a.minimalPoints) s += "(" + p.x + ", " + p.y + "),";

                }

            }
        }
    }

    sameDirection(p1: Point, p2: Point): boolean {
        return Math.sign(p1.x) == Math.sign(p2.x) && Math.sign(p1.y) == Math.sign(p2.y);
    }

    prepareArrowLocks(newArrow: RoutingArrow) {

        for (let a of this.arrows) {

            if (a == newArrow) return;
            let joinArrow: boolean = a.arrowType == newArrow.arrowType && a.destinationIdentifier == newArrow.destinationIdentifier;

            if(a.points == null) return;
            
            for (let p of a.points) {
                if (joinArrow) {
                    this.locks[p.x][p.y] = 0;
                    this.weights[p.x][p.y] = 0;
                } else {
                    let w = 6;
                    this.locks[p.x][p.y] += w;
                }
            }


        }

    }


    calculateWeights(xStart: number, yStart: number, dxStart: number, dyStart: number) {

        if(this.weights[xStart + dxStart] == null){
            return;
        }

        this.weights[xStart + dxStart][yStart + dyStart] = 1;
        this.weights[xStart][yStart] = 0;

        let d = this.routingInput.straightArrowSectionAfterRectangle;
        if (d == null) d = 3;

        let normalX = 1 - Math.abs(dxStart);
        let normalY = 1 - Math.abs(dyStart);

        let i: number = 0;
        while (i < d + 3) {
            let x = xStart + dxStart * i;
            let y = yStart + dyStart * i;
            if (x > 0 && x < this.routingInput.xMax &&
                y > 0 && y < this.routingInput.yMax &&
                this.locks[x][y] > 0) {
                this.locks[x][y] = 0;
            }
            i++;
        }

        i = 0;
        while (i <= d) {
            let x = xStart + dxStart * i;
            let y = yStart + dyStart * i;
            if (x > 0 && x < this.routingInput.xMax &&
                y > 0 && y < this.routingInput.yMax) {
                this.locks[x + normalX][y + normalY] = 1000;
                this.locks[x - normalX][y - normalY] = 1000;
            }
            i++;
        }

        let stack: Point[] = [];

        for (let y = 0; y < this.routingInput.yMax; y++) {
            for (let x = 0; x < this.routingInput.xMax; x++) {
                if (this.weights[x][y] >= 0) {
                    stack.push({ x: x, y: y });
                }

            }
        }

        // stack.push({ x: xStart + dxStart, y: yStart + dyStart });


        while (stack.length > 0) {

            let stack1: Point[] = stack;
            stack = [];

            for (let p of stack1) {
                let x = p.x;
                let y = p.y;
                let w: number = this.weights[x][y];
                if (x > 0) {
                    let w1 = this.weights[x - 1][y];
                    let l1 = this.locks[x - 1][y];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) {              // w1 < 0
                        this.weights[x - 1][y] = w + 1;
                        stack.push({ x: x - 1, y: y });
                    }
                }
                if (x < this.routingInput.xMax - 1) {
                    let w1 = this.weights[x + 1][y];
                    let l1 = this.locks[x + 1][y];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) {              // w1 < 0
                        this.weights[x + 1][y] = w + 1;
                        stack.push({ x: x + 1, y: y });
                    }
                }
                if (y > 0) {
                    let w1 = this.weights[x][y - 1];
                    let l1 = this.locks[x][y - 1];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) {              // w1 < 0
                        this.weights[x][y - 1] = w + 1;
                        stack.push({ x: x, y: y - 1 });
                    }
                }
                if (y < this.routingInput.yMax - 1) {
                    let w1 = this.weights[x][y + 1];
                    let l1 = this.locks[x][y + 1];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) {              // w1 < 0
                        this.weights[x][y + 1] = w + 1;
                        stack.push({ x: x, y: y + 1 });
                    }
                }

            }

        }


    }

    addPoint(x: number, y: number, arrow: RoutingArrow): RoutingArrow {
        if(x < this.arrowPointField.length && y < this.arrowPointField[x].length){
            arrow.points.push({ x: x, y: y });
            let arrows: RoutingArrow[] = this.arrowPointField[x][y];
            if (arrows != null) {
                for (let a of arrows) {
                    if (a.arrowType == arrow.arrowType && a.destinationIdentifier == arrow.destinationIdentifier) {
                        return a;
                    }
                }
            }
        }
    }

    addArrowToArrowPointsField(arrow: RoutingArrow) {
        if (arrow.points == null) return;
        for (let p of arrow.points) {
            let arrows: RoutingArrow[] = this.arrowPointField[p.x][p.y];
            if (arrows == null) {
                this.arrowPointField[p.x][p.y] = [arrow];
            } else {
                arrows.push(arrow);
            }
        }
    }

    // addPoint(x: number, y: number, arrow: RoutingArrow): RoutingArrow {
    //     arrow.points.push({ x: x, y: y });
    //     let arrows: RoutingArrow[] = this.arrowPointField[x][y];
    //     if (arrows == null) {
    //         arrows = [];
    //         this.arrowPointField[x][y] = arrows;
    //     } else {
    //         for (let a of arrows) {
    //             if (a.arrowType == arrow.arrowType && a.destinationIdentifier == arrow.destinationIdentifier) {
    //                 arrows.push(arrow);
    //                 return a;
    //             }
    //         }
    //     }
    //     arrows.push(arrow);
    // }

    routeAllArrows(): RoutingOutput {
        if(this.arrows != null){
            for (let a of this.arrows) {
                this.routeArrowOptimized(a, a.debug == true);
            }
            this.smoothArrows();
        }


        return {
            xMax: this.routingInput.xMax,
            yMax: this.routingInput.yMax,
            arrows: this.arrows,
            rectangles: this.rectangles,
            weights: this.weights,
            locks: this.locks,
            version: this.routingInput.version
        }
    }


    routeArrowOptimized(a: RoutingArrow, debug: boolean = false) {

        let routeVariants: routeVariant[] = [];
        let sourceRect = this.rectangles[a.sourceRectangleIndex];
        let destRect = this.rectangles[a.destRectangleIndex];
        let slotDistance = this.routingInput.slotDistance;

        for (let sourceDirection = 0; sourceDirection < 4; sourceDirection++) {
            // for (let sourceSlotDelta of [-1, 1]) 
            {
                for (let destDirection = 0; destDirection < 4; destDirection++) {
                    // for (let destSlotDelta of [-1, 1]) 
                    {

                        let sourceSlot = sourceRect.slots[sourceDirection];
                        let destSlot = destRect.slots[destDirection];

                        let sourceDeltaFromMid = 0;

                        let sourceSlotDelta = sourceSlot.lastDelta * -1;
                        sourceSlot.lastDelta *= -1;
                        let destSlotDelta = destSlot.lastDelta * -1;
                        destSlot.lastDelta *= -1;

                        if (sourceSlot.usedFrom != null) {

                            sourceDeltaFromMid = sourceSlotDelta > 0 ?
                                sourceSlot.usedTo + slotDistance : sourceSlot.usedFrom - slotDistance;

                            if(sourceDeltaFromMid < sourceSlot.min || sourceDeltaFromMid > sourceSlot.max){
                                continue;
                            }
                        }

                        let sourcePos = {
                            x: sourceSlot.mid.x + sourceSlot.deltaFromSlotToSlot.x * sourceDeltaFromMid,
                            y: sourceSlot.mid.y + sourceSlot.deltaFromSlotToSlot.y * sourceDeltaFromMid
                        };

                        let destDeltaFromMid = 0;
                        if (destSlot.usedFrom != null) {

                            destDeltaFromMid = destSlotDelta > 0 ?
                                destSlot.usedTo + slotDistance : destSlot.usedFrom - slotDistance;

                            if(destDeltaFromMid < destSlot.min || destDeltaFromMid > destSlot.max){
                                continue;
                            }
                        }

                        let destPos = {
                            x: destSlot.mid.x + destSlot.deltaFromSlotToSlot.x * destDeltaFromMid,
                            y: destSlot.mid.y + destSlot.deltaFromSlotToSlot.y * destDeltaFromMid
                        };


                        a.source = sourcePos;
                        a.dest = destPos;
                        a.sourceDirection = sourceSlot.arrowDirectionOutward;
                        a.destDirection = { x: destSlot.arrowDirectionOutward.x, y: destSlot.arrowDirectionOutward.y };
                        a.endsOnArrowWithIdentifier = null;

                        if (Math.abs(sourcePos.x - destPos.x) + Math.abs(sourcePos.y - destPos.y) > 2 * this.routingInput.straightArrowSectionAfterRectangle) {
                            this.routeArrow(a, false);

                            let weight = 0;
                            for (let p of a.points) {
                                let w = this.weights[p.x][p.y];
                                weight += (w < 0 ? 1000 : w);
                                let l = this.locks[p.x][p.y];
                                if(l > 11 && l < 1000){ // Intersection of arrows
                                    weight += 500;
                                }
                            }

                            routeVariants.push({
                                dest: destPos,
                                source: sourcePos,
                                destDeltaFromMid: destDeltaFromMid,
                                sourceDeltaFromMid: sourceDeltaFromMid,
                                destDirection: a.destDirection,
                                sourceDirection: a.sourceDirection,
                                weightSum: weight,
                                endsOnArrowWithIdentifier: a.endsOnArrowWithIdentifier,
                                points: a.points,
                                minimalPoints: a.minimalPoints,
                                sourceSlot: sourceSlot,
                                destSlot: destSlot
                            });
                        }
                    }
                }
            }
        }

        let minWeight = 1000000;
        let bestVariant: routeVariant = null;
        for (let v of routeVariants) {
            if (v.weightSum > 3 && v.weightSum < minWeight) {
                bestVariant = v;
                minWeight = v.weightSum;
            }
        }

        if (bestVariant != null) {
            a.source = bestVariant.source;
            a.dest = bestVariant.dest;
            a.sourceDirection = bestVariant.sourceDirection;
            a.destDirection = bestVariant.destDirection;
            a.endsOnArrowWithIdentifier = bestVariant.endsOnArrowWithIdentifier;
            a.minimalPoints = bestVariant.minimalPoints;
            a.points = bestVariant.points;

            if (bestVariant.sourceDeltaFromMid < 0) {
                bestVariant.sourceSlot.usedFrom = bestVariant.sourceDeltaFromMid;
                if (bestVariant.sourceSlot.usedTo == null) bestVariant.sourceSlot.usedTo = 0;
            } else {
                bestVariant.sourceSlot.usedTo = bestVariant.sourceDeltaFromMid;
                if (bestVariant.sourceSlot.usedFrom == null) bestVariant.sourceSlot.usedFrom = 0;
            }
            if (bestVariant.destDeltaFromMid < 0) {
                bestVariant.destSlot.usedFrom = bestVariant.destDeltaFromMid;
                if (bestVariant.destSlot.usedTo == null) bestVariant.destSlot.usedTo = 0;
            } else {
                bestVariant.destSlot.usedTo = bestVariant.destDeltaFromMid;
                if (bestVariant.destSlot.usedFrom == null) bestVariant.destSlot.usedFrom = 0;
            }

            this.addArrowToArrowPointsField(a);

        }

    }

    routeArrow(a: RoutingArrow, debug: boolean = false) {

        if (debug == true) debugger;
        this.initWeights();
        this.prepareRectangles();
        this.prepareArrowLocks(a);
        this.calculateWeights(a.dest.x, a.dest.y, a.destDirection.x, a.destDirection.y);

        // this.render(ctx);
        let dx = a.sourceDirection.x;
        let dy = a.sourceDirection.y;

        a.points = [];

        this.addPoint(a.source.x, a.source.y, a);

        let x = a.source.x + a.sourceDirection.x * 2;
        let y = a.source.y + a.sourceDirection.y * 2;

        if (x < 0 || x >= this.routingInput.xMax || y < 0 || y >= this.routingInput.yMax) {
            return;
        }

        let lockWeight = 6;
        this.locks[x][y] = lockWeight;

        let fertig = false;
        let endsInArrow: RoutingArrow = null;

        this.addPoint(a.source.x + a.sourceDirection.x, a.source.y + a.sourceDirection.y, a);
        endsInArrow = this.addPoint(x, y, a);

        let routeStrategies: RouteStrategy[] = [];

        for (let straight = 5; straight >= 0; straight--) {
            for (let normal = 0; normal <= 5; normal++) {
                if (straight != 0 || normal != 0) {
                    routeStrategies.push({ straight: straight, normal: normal, bonus: -Math.abs(straight) - Math.abs(normal) + 1 })
                    if (normal != 0)
                        routeStrategies.push({ straight: straight, normal: -normal, bonus: -Math.abs(straight) - Math.abs(normal) + 1 })
                }
            }
        }


        let lastLength = 0;
        while (!fertig) {

            let newDirectionX = 0;
            let newDirectionY = 0;
            if (Math.abs(a.dest.x - x) + Math.abs(a.dest.y - y) < 4) {
                newDirectionX = a.dest.x - x;
                newDirectionY = a.dest.y - y;
                fertig = true;
            } else {
                let minimumWeight = 1000000;

                let w = this.weights[x][y];
                let from: Point = { x: x, y: y };

                if (debug == true) console.log("Position: " + x + "/" + y + ", weight: " + this.weights[x][y] + "+" + this.locks[x][y] + " = " + w);
                for (let rs of routeStrategies) {

                    let ndx = rs.straight * dx + rs.normal * dy;
                    let ndy = rs.straight * dy - rs.normal * dx;

                    let xNew = x + ndx;
                    let yNew = y + ndy;

                    if (xNew < 0 || yNew < 0 || xNew > this.routingInput.xMax - 1 || yNew > this.routingInput.yMax - 1) {
                        continue;
                    }

                    let weight = this.getWeight(from, { x: xNew, y: yNew });

                    let newWeight = weight.destWeight + Math.sqrt(weight.wayWeight); //this.weights[xNew][yNew] + this.locks[xNew][yNew];
                    let s: string = "Trying " + xNew + "/" + yNew + ": w = " + this.weights[xNew][yNew] + "+" +
                        this.locks[xNew][yNew] + " = " + newWeight + ", Bonus = " + rs.bonus;
                    if (newWeight > w) {
                        newWeight += 3;
                        s += " Verschlechterung => Strafe -3! ";
                    }
                    newWeight -= rs.bonus;
                    // deltaW /= rs.length;
                    if (newWeight < minimumWeight) {
                        minimumWeight = newWeight;
                        newDirectionX = ndx;
                        newDirectionY = ndy;
                        s += " -> new Minimum!";
                    }
                    if (debug == true) console.log(s);

                }

                if (x == a.dest.x && y == a.dest.y || newDirectionX == 0 && newDirectionY == 0) {
                    fertig = true;
                }
            }

            if (x + newDirectionX < 0 || x + newDirectionX > this.routingInput.xMax - 1
                || y + newDirectionY < 0 || y + newDirectionY > this.routingInput.yMax - 1) {
                fertig = true;
                break;
            }

            let weightSumFirstXThenY = 0;
            let weightSumFirstYThenX = 0;

            // first x then y
            let xn = x;
            let yn = y;
            for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                xn += Math.sign(newDirectionX);
                weightSumFirstXThenY += this.weights[xn][yn] + this.locks[xn][yn];
            }
            for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                yn += Math.sign(newDirectionY);
                weightSumFirstXThenY += this.weights[xn][yn] + this.locks[xn][yn];
            }

            // first y then x
            xn = x;
            yn = y;
            for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                yn += Math.sign(newDirectionY);
                weightSumFirstYThenX += this.weights[xn][yn] + this.locks[xn][yn];
            }
            for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                xn += Math.sign(newDirectionX);
                weightSumFirstYThenX += this.weights[xn][yn] + this.locks[xn][yn];
            }

            if (weightSumFirstXThenY <= weightSumFirstYThenX) {
                if (newDirectionX != 0) {
                    for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                        if (endsInArrow != null) break;
                        x += Math.sign(newDirectionX);
                        this.locks[x][y] += lockWeight;
                        endsInArrow = this.addPoint(x, y, a);
                    }
                    dx = Math.sign(newDirectionX); dy = 0;
                }
                if (newDirectionX * newDirectionY != 0) {
                    this.locks[x][y] += 1;
                }
                if (newDirectionY != 0 && endsInArrow == null) {
                    for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                        if (endsInArrow != null) break;
                        y += Math.sign(newDirectionY);
                        this.locks[x][y] += lockWeight;
                        endsInArrow = this.addPoint(x, y, a);
                    }
                    dx = 0; dy = Math.sign(newDirectionY);
                }
            } else {
                for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                    if (endsInArrow != null) break;
                    y += Math.sign(newDirectionY);
                    this.locks[x][y] += lockWeight;
                    endsInArrow = this.addPoint(x, y, a);
                }
                this.locks[x][y] += 1;
                for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                    if (endsInArrow != null) break;
                    x += Math.sign(newDirectionX);
                    this.locks[x][y] += lockWeight;
                    endsInArrow = this.addPoint(x, y, a);
                }
                dy = 0; dx = Math.sign(newDirectionX);
            }

            if (a.points.length > 1000 || a.points.length == lastLength) fertig = true;
            lastLength = a.points.length;

            if (endsInArrow != null) {
                fertig = true;
            }

        }

        if (endsInArrow == null) {
            this.addPoint(x, y, a);
        }

        a.minimalPoints = [];
        if (a.points.length > 0) {
            let lastEdge = a.points[0];
            a.minimalPoints.push(lastEdge);
            let lastPoint = a.points[0];
            let i = 0;
            for (let p of a.points) {
                if (p.x != lastEdge.x && p.y != lastEdge.y || i == a.points.length - 1) {
                    a.minimalPoints.push(lastPoint);
                    lastEdge = lastPoint;
                }
                lastPoint = p;
                i++;
            }
            a.minimalPoints.push(lastPoint);
        }

        if (endsInArrow != null) {
            a.endsOnArrowWithIdentifier = endsInArrow.identifier;
        }

    }

    getWeight(from: Point, to: Point): { destWeight: number, wayWeight: number, firstHorizontal: boolean } {

        let dx = to.x - from.x;
        let dy = to.y - from.y;

        let length = Math.abs(dx) + Math.abs(dy);

        let weightFirstHorizontal = 0;
        let weightFirstVertical = 0;

        let x = from.x;
        let y = from.y;
        for (let delta = 1; delta <= Math.abs(dx); delta++) {
            x += Math.sign(dx);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstHorizontal += l;
        }
        for (let delta = 1; delta <= Math.abs(dy); delta++) {
            y += Math.sign(dy);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstHorizontal += l;
        }

        x = from.x;
        y = from.y;
        for (let delta = 1; delta <= Math.abs(dy); delta++) {
            y += Math.sign(dy);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstVertical += l;
        }
        for (let delta = 1; delta <= Math.abs(dx); delta++) {
            x += Math.sign(dx);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstVertical += l;
        }

        let firstHorizontal = weightFirstHorizontal < weightFirstVertical;

        return {
            wayWeight: firstHorizontal ? weightFirstHorizontal : weightFirstVertical,
            firstHorizontal: firstHorizontal,
            destWeight: this.weights[to.x][to.y] + this.locks[to.x][to.y]
        }

    }



    dist(x1: number, y1: number, x2: number, y2: number) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }



}