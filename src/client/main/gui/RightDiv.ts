import { InterpreterState } from "../../interpreter/Interpreter.js";
import { WorldHelper } from "../../runtimelibrary/graphics/World.js";
import { makeTabs } from "../../tools/HtmlTools.js";
import { Main } from "../Main.js";
import { ClassDiagram } from "./diagrams/classdiagram/ClassDiagram.js";
import { ObjectDiagram } from "./diagrams/objectdiagram/ObjectDiagram.js";
import { MainBase } from "../MainBase.js";
import jQuery from 'jquery';

export class RightDiv {

    classDiagram: ClassDiagram;
    objectDiagram: ObjectDiagram;
    isWholePage: boolean = false;

    $tabs: JQuery<HTMLElement>;
    $headings: JQuery<HTMLElement>;

    constructor(private main: MainBase, public $rightDiv: JQuery<HTMLElement>) {

        this.$tabs = $rightDiv.find('.jo_tabs');
        this.$headings = $rightDiv.find('.jo_tabheadings');
        
        let withClassDiagram = this.$headings.find('.jo_classDiagramTabHeading').length > 0;
        let withObjectDiagram = this.$headings.find('.jo_objectDiagramTabHeading').length > 0;

        if(withClassDiagram){
            this.classDiagram = new ClassDiagram(this.$tabs.find('.jo_classdiagram'), main);
            this.$headings.find('.jo_classDiagramTabHeading').on("click", () => { that.main.drawClassDiagrams(false) });
        }

        if(withObjectDiagram){
            this.objectDiagram = new ObjectDiagram(this.main, this.$tabs.find('.jo_objectdiagram'));
            this.$headings.find('.jo_objectDiagramTabHeading').on("click", () => { that.onObjectDiagramEnabled() });
        }

        let that = this;
        let rightdiv_width: string = "100%";
        $rightDiv.find('.jo_whole-window').on("click", () => {

            that.isWholePage = !that.isWholePage;
            
            let $wholeWindow = jQuery('.jo_whole-window');

            if (!that.isWholePage) {
                jQuery('#code').css('display', 'flex');
                jQuery('#rightdiv').css('width', rightdiv_width);
                // jQuery('#run').css('width', '');
                $wholeWindow.removeClass('img_whole-window-back');
                $wholeWindow.addClass('img_whole-window');
                jQuery('#controls').insertAfter(jQuery('#view-mode'));
                $wholeWindow.attr('title', 'Auf Fenstergröße vergrößern');
                jQuery('.jo_graphics').trigger('sizeChanged');
            } else {
                jQuery('#code').css('display', 'none');
                rightdiv_width = jQuery('#rightdiv').css('width');
                jQuery('#rightdiv').css('width', '100%');
                $wholeWindow.removeClass('img_whole-window');
                $wholeWindow.addClass('img_whole-window-back');
                // that.adjustWidthToWorld();
                jQuery('.jo_control-container').append(jQuery('#controls'));
                $wholeWindow.attr('title', 'Auf normale Größe zurückführen');
                jQuery('.jo_graphics').trigger('sizeChanged');
            }
        });

    }

    adjustWidthToWorld() {
        let worldHelper: WorldHelper = this.main.getInterpreter().worldHelper;
        if (worldHelper != null && this.isWholePage) {
            let screenHeight = window.innerHeight - this.$headings.height() - 6;
            let screenWidthToHeight = window.innerWidth / (screenHeight);
            let worldWidthToHeight = worldHelper.width / worldHelper.height;
            if (worldWidthToHeight <= screenWidthToHeight) {
                let newWidth = worldWidthToHeight * screenHeight;
                this.$tabs.find('.jo_run').css('width', newWidth + "px");
                this.$tabs.find('.jo_run').css('height', screenHeight + "px");
            } else {
                let newHeight = window.innerWidth / worldWidthToHeight;
                this.$tabs.find('.jo_run').css('width', window.innerWidth + "px");
                this.$tabs.find('.jo_run').css('height', newHeight + "px");
            }
        }

    }

    initGUI() {
        makeTabs(this.$rightDiv);
    }

    isClassDiagramEnabled(): boolean {
        let heading = this.$headings.find('.jo_classDiagramTabHeading');
        if(heading.length == 0) return false;
        return heading.hasClass("jo_active");
    }

    isObjectDiagramEnabled(): boolean {
        let heading = this.$headings.find('.jo_objectDiagramTabHeading');
        if(heading.length == 0) return false;
        return heading.hasClass("jo_active");
    }

    updateObjectDiagramSettings() {
        if (this.isObjectDiagramEnabled) {
            this.objectDiagram.updateSettings();
        }
    }

    onObjectDiagramEnabled() {
        this.objectDiagram.updateSettings();
        if (this.main.getInterpreter().state == InterpreterState.paused || this.main.getInterpreter().state == InterpreterState.running) {
            this.objectDiagram.updateDiagram();
        }
    }


}