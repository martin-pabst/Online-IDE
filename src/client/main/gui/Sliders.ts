import { jo_mouseDetected } from "../../tools/HtmlTools.js";
import { Main } from "../Main.js";
import { ZoomControl } from "./diagrams/ZoomControl.js";

export class Sliders {

    main: Main;

    constructor(main: Main) {
        this.main = main;
    }

    initSliders() {
        let that = this;

        let mousePointer = window.PointerEvent ? "pointer" : "mouse";

        jQuery('#slider1').on(mousePointer + "down", (md: JQuery.MouseDownEvent) => {

            let x = md.clientX;

            jQuery(document).on(mousePointer + "move.slider1", (mm: JQuery.MouseMoveEvent) => {
                let dx = mm.clientX - x;
                
                that.moveLeftPanel(dx);

                x = mm.clientX;
            });

            jQuery(document).on(mousePointer + "up.slider1", () => {
                jQuery(document).off(mousePointer + "move.slider1");
                jQuery(document).off(mousePointer + "up.slider1");
            });


        });

        jQuery('#slider2').on(mousePointer + "down", (md: JQuery.MouseDownEvent) => {

            let y = md.clientY;

            jQuery(document).on(mousePointer + "move.slider2", (mm: JQuery.MouseMoveEvent) => {
                let dy = mm.clientY - y;

                that.moveBottomDiv(dy);

                y = mm.clientY;
            });

            jQuery(document).on(mousePointer + "up.slider2", () => {
                jQuery(document).off(mousePointer + "move.slider2");
                jQuery(document).off(mousePointer + "up.slider2");
            });


        });

        jQuery('#slider3').on(mousePointer + "down", (md: JQuery.MouseDownEvent) => {

            let x = md.clientX;
            ZoomControl.preventFading = true;

            jQuery(document).on(mousePointer + "move.slider3", (mm: JQuery.MouseMoveEvent) => {
                let dx = mm.clientX - x;

                that.moveRightDiv(dx);

                x = mm.clientX;
                mm.stopPropagation();
            });

            jQuery(document).on(mousePointer + "up.slider3", () => {
                jQuery(document).off(mousePointer + "move.slider3");
                jQuery(document).off(mousePointer + "up.slider3");
                ZoomControl.preventFading = false;
            });


        });

        let sliderknobLeft = jQuery('<div class="jo_sliderknob img_knob jo_button jo_active" style="left: -8px" draggable="false"></div>');
        jQuery('#slider2').append(sliderknobLeft);
        sliderknobLeft.on(mousePointer + 'down', (md: JQuery.MouseDownEvent) => {
            let y = md.clientY;
            let x = md.clientX;

            md.stopPropagation();
            ZoomControl.preventFading = true;

            jQuery(document).on(mousePointer + "move.knobleft", (mm: JQuery.MouseMoveEvent) => {
                let dy = mm.clientY - y;
                let dx = mm.clientX - x;
                mm.stopPropagation();

                that.moveLeftPanel(dx);
                that.moveBottomDiv(dy);

                x += dx;
                y += dy;
            });

            jQuery(document).on(mousePointer + "up.knobleft", () => {
                jQuery(document).off(mousePointer + "move.knobleft");
                jQuery(document).off(mousePointer + "up.knobleft");
                ZoomControl.preventFading = false;
            });

        });

        let sliderknobRight = jQuery('<div class="jo_sliderknob img_knob jo_button jo_active" style="right: -8px" draggable="false"></div>');
        jQuery('#slider2').append(sliderknobRight);
        sliderknobRight.on(mousePointer + 'down', (md: JQuery.MouseDownEvent) => {
            let y = md.clientY;
            let x = md.clientX;

            md.stopPropagation();
            ZoomControl.preventFading = true;

            jQuery(document).on(mousePointer + "move.knobright", (mm: JQuery.MouseMoveEvent) => {
                let dy = mm.clientY - y;
                let dx = mm.clientX - x;
                mm.stopPropagation();

                that.moveRightDiv(dx);
                that.moveBottomDiv(dy);

                x += dx;
                y += dy;
            });

            jQuery(document).on(mousePointer + "up.knobright", () => {
                jQuery(document).off(mousePointer + "move.knobright");
                jQuery(document).off(mousePointer + "up.knobright");
                ZoomControl.preventFading = false;
            });

        });

    }
    
    moveRightDiv(dx: number) {
        let $editor = jQuery('#editor>.monaco-editor');
        let $rightDiv = jQuery('#rightdiv');

        let width = Number.parseInt($rightDiv.css('width').replace('px', ''));
        $rightDiv.css('width', (width - dx) + "px");

        let mewidth = Number.parseInt($editor.css('width').replace('px', ''));
        $editor.css('width', (mewidth + dx) + "px");
        
        this.main.getMonacoEditor().layout();
        if(this.main.bottomDiv.homeworkManager.diffEditor != null){
            this.main.bottomDiv.homeworkManager.diffEditor.layout();
        }

        jQuery('.jo_graphics').trigger('sizeChanged');
        width += dx;
}
    moveBottomDiv(dy: number) {
        let $editor = jQuery('#editor>.monaco-editor');
        let $bottomDiv = jQuery('#bottomdiv-outer');

        let height = Number.parseInt($bottomDiv.css('height').replace('px', ''));
        $bottomDiv.css('height', (height - dy) + "px");

        let meheight = Number.parseInt($editor.css('height').replace('px', ''));
        $editor.css('height', (meheight + dy) + "px");

        this.main.getMonacoEditor().layout();
        if(this.main.bottomDiv.homeworkManager.diffEditor != null){
            this.main.bottomDiv.homeworkManager.diffEditor.layout();
        }
}

    moveLeftPanel(dx: number) {
        let $leftPanel = jQuery('#leftpanel');
        let $editor = jQuery('#editor>.monaco-editor');

        let width = Number.parseInt($leftPanel.css('width').replace('px', ''));
        $leftPanel.css('width', (width + dx) + "px");

        let mewidth = Number.parseInt($editor.css('width').replace('px', ''));
        $editor.css('width', (mewidth - dx) + "px");
        this.main.getMonacoEditor().layout();
        if(this.main.bottomDiv.homeworkManager.diffEditor != null){
            this.main.bottomDiv.homeworkManager.diffEditor.layout();
        }

    }



}