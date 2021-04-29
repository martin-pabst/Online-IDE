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

            let pe = jQuery('#leftpanel');
            let me = jQuery('#editor>.monaco-editor');
            let x = md.clientX;

            jQuery(document).on(mousePointer + "move.slider1", (mm: JQuery.MouseMoveEvent) => {
                let dx = mm.clientX - x;
                let width = Number.parseInt(pe.css('width').replace('px', ''));
                pe.css('width', (width + dx) + "px");

                let mewidth = Number.parseInt(me.css('width').replace('px', ''));
                me.css('width', (mewidth - dx) + "px");
                that.main.getMonacoEditor().layout();
                if(that.main.bottomDiv.homeworkManager.diffEditor != null){
                    that.main.bottomDiv.homeworkManager.diffEditor.layout();
                }
                x = mm.clientX;
            });

            jQuery(document).on(mousePointer + "up.slider1", () => {
                jQuery(document).off(mousePointer + "move.slider1");
                jQuery(document).off(mousePointer + "up.slider1");
            });


        });

        jQuery('#slider2').on(mousePointer + "down", (md: JQuery.MouseDownEvent) => {

            let ee = jQuery('#bottomdiv-outer');
            let me = jQuery('#editor>.monaco-editor');
            let y = md.clientY;

            jQuery(document).on(mousePointer + "move.slider2", (mm: JQuery.MouseMoveEvent) => {
                let dy = mm.clientY - y;

                let height = Number.parseInt(ee.css('height').replace('px', ''));
                ee.css('height', (height - dy) + "px");

                let meheight = Number.parseInt(me.css('height').replace('px', ''));
                me.css('height', (meheight + dy) + "px");

                that.main.getMonacoEditor().layout();
                if(that.main.bottomDiv.homeworkManager.diffEditor != null){
                    that.main.bottomDiv.homeworkManager.diffEditor.layout();
                }

                y = mm.clientY;
            });

            jQuery(document).on(mousePointer + "up.slider2", () => {
                jQuery(document).off(mousePointer + "move.slider2");
                jQuery(document).off(mousePointer + "up.slider2");
            });


        });

        jQuery('#slider3').on(mousePointer + "down", (md: JQuery.MouseDownEvent) => {

            let pe = jQuery('#rightdiv');
            let me = jQuery('#editor>.monaco-editor');
            let x = md.clientX;
            ZoomControl.preventFading = true;

            jQuery(document).on(mousePointer + "move.slider3", (mm: JQuery.MouseMoveEvent) => {
                let dx = mm.clientX - x;

                let width = Number.parseInt(pe.css('width').replace('px', ''));
                pe.css('width', (width - dx) + "px");

                let mewidth = Number.parseInt(me.css('width').replace('px', ''));
                me.css('width', (mewidth + dx) + "px");
                
                that.main.getMonacoEditor().layout();
                if(that.main.bottomDiv.homeworkManager.diffEditor != null){
                    that.main.bottomDiv.homeworkManager.diffEditor.layout();
                }

                jQuery('.jo_graphics').trigger('sizeChanged');
                width += dx;
                x = mm.clientX;
                mm.stopPropagation();
            });

            jQuery(document).on(mousePointer + "up.slider3", () => {
                jQuery(document).off(mousePointer + "move.slider3");
                jQuery(document).off(mousePointer + "up.slider3");
                ZoomControl.preventFading = false;
            });


        });

    }



}