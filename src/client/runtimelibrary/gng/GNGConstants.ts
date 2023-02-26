import { RuntimeObject } from "../../interpreter/RuntimeObject.js"
import { ShapeHelper } from "../graphics/Shape.js"

export type GNGPoint = {
    x: number,
    y: number
}

export type GNGAttributes = {
    moveAnchor: GNGPoint,
    width: number,
    height: number,
    colorString: string
}

export interface GNGHelper {
    renderGNG(ro: RuntimeObject): void
}