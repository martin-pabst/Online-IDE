import { ColorHelper } from "./ColorHelper.js";

export class FilledShapeDefaults {
    static defaultFillColor: number = 0x8080ff;
    static defaultFillAlpha: number = 1.0;

    static defaultBorderColor: number = null;
    static defaultBorderAlpha: number = 1.0;
    static defaultBorderWidth: number = 10;

    static defaultVisibility: boolean = true;

    static initDefaultValues(){
        FilledShapeDefaults.defaultFillColor = 0x8080ff;
        FilledShapeDefaults.defaultFillAlpha = 1.0;
    
        FilledShapeDefaults.defaultBorderColor = null;
        FilledShapeDefaults.defaultBorderAlpha = 1.0;
        FilledShapeDefaults.defaultBorderWidth = 10;

        FilledShapeDefaults.defaultVisibility = true;
    }

    static setDefaultVisibility(visibility: boolean) {
        FilledShapeDefaults.defaultVisibility = visibility;
    }

    static setDefaultBorder(width: number, color: string | number, alpha?: number) {

        FilledShapeDefaults.defaultBorderWidth = width;

        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            FilledShapeDefaults.defaultBorderColor = c.color;
            FilledShapeDefaults.defaultBorderAlpha = alpha == null ? c.alpha : alpha;
        } else {
            FilledShapeDefaults.defaultBorderColor = color;
            if (alpha != null) FilledShapeDefaults.defaultBorderAlpha = alpha;
        }

    }

    static setDefaultFillColor(color: string | number, alpha?: number) {

        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            FilledShapeDefaults.defaultFillColor = c.color;
            FilledShapeDefaults.defaultFillAlpha = alpha == null ? c.alpha : alpha;
        } else {
            FilledShapeDefaults.defaultFillColor = color;
            if (alpha != null) FilledShapeDefaults.defaultFillAlpha = alpha;
        }

    }

}