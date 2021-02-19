import { convertPxToNumber } from "../../../tools/HtmlTools.js";

export class ZoomControl {
    
    public static preventFading:boolean = false;

    position: number = 0;
    yMax: number;
    $grip: JQuery<HTMLElement>;
    $zoomcontrolDisplay: JQuery<HTMLElement>;

    gripHeight: number = 10;
    overallHeight: number = 150;

    zoomMin: number = 0.2;
    zoomMax: number = 2;


    constructor($parentElement: JQuery<HTMLElement>, private callback?: (zoomfactor: number) => void){
        let $zoomcontrolOuter = jQuery('<div class="jo_zoomcontrol-outer" title="Zoom" draggable="false"></div>');
        $parentElement.append($zoomcontrolOuter);
        let $zoomcontrolBar = jQuery('<div class="jo_zoomcontrol-bar" draggable="false"></div>');
        $zoomcontrolOuter.append($zoomcontrolBar);
        this.$grip = jQuery('<div class="jo_zoomcontrol-grip" draggable="false"></div>');
        $zoomcontrolOuter.append(this.$grip);
        this.$zoomcontrolDisplay = jQuery('<div class="jo_zoomcontrol-display"></div>');
        this.$grip.append(this.$zoomcontrolDisplay);

        let mousedownY: number;
        let oldPosition: number;
        let that = this;
        that.overallHeight = convertPxToNumber($zoomcontrolOuter.css('height'));
        that.gripHeight = convertPxToNumber(that.$grip.css('height'));
        that.yMax = that.overallHeight - that.gripHeight;
        
        $zoomcontrolBar.on('mousedown', (e) => {

            let y = e.pageY - $zoomcontrolOuter.offset().top - 4;
            that.setZoom(y);
            that.$grip.css('top', y + 'px');
            //@ts-ignore
            that.$grip.trigger('mousedown', [e.clientY]);

        });
        
        
        this.$grip.on('mousedown', (e, y) => {
            if(y == null) y = e.clientY;
            mousedownY = y;
            oldPosition = that.position;
            this.$zoomcontrolDisplay.show();

            jQuery(document).on('mousemove.zoomcontrol', (e)=>{
                let deltaY = e.clientY - mousedownY;
                that.setZoom(oldPosition + deltaY);
            });

            jQuery(document).on('mouseup.zoomcontrol', () => {
                jQuery(document).off('mouseup.zoomcontrol');
                jQuery(document).off('mousemove.zoomcontrol');
                this.$zoomcontrolDisplay.hide();
            });

            e.stopPropagation();

        });

        $parentElement.on("mouseenter", (e) => {
            if(!ZoomControl.preventFading)
            $zoomcontrolOuter.fadeIn();
        });
        
        $parentElement.on("mouseleave", (e) => {
            if(!ZoomControl.preventFading)
            $zoomcontrolOuter.fadeOut();
        });

        let factor = (1.0 - this.zoomMin)/(this.zoomMax - this.zoomMin);
        this.position = factor*(this.overallHeight - this.gripHeight);
        this.$grip.css('top', this.position + "px");
    }

    setZoom(newPosition: number){

        if(newPosition < 0){
            newPosition = 0;
        }

        if(newPosition > this.yMax){
            newPosition = this.yMax;
        }

        this.position = newPosition;

        this.$grip.css('top', newPosition + "px");

        let zoomfactor = newPosition/(this.overallHeight - this.gripHeight);
        zoomfactor = this.zoomMin + zoomfactor*(this.zoomMax - this.zoomMin);

        let zfs = Math.round(zoomfactor * 100) + " %";
        this.$zoomcontrolDisplay.html(zfs);

        if(this.callback != null){
            this.callback(zoomfactor);
        }

    }

}