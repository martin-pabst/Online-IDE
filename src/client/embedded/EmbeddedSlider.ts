
export class EmbeddedSlider {

    $sliderDiv: JQuery<HTMLElement>;

    /**
     * A div contains $container and another div. Between the latter two 
     * a slider should get inserted.
     * @param $container 
     * @param firstLast true, if $container is left/on top of other div; false if otherwise
     * @param horVert true, if $container and other div are left/right of another; false if they are on top/below each other
     * @param callback 
     * @param $otherDiv 
     */
    constructor(private $container: JQuery<HTMLElement>, 
        private firstLast: boolean, private horVert: boolean,
         private callback: (newLength: number) => void, private $otherDiv?: JQuery<HTMLElement>){
            this.initSlider();
    }

    initSlider() {
        let that = this;

        if(this.$otherDiv == null){
            this.$container.parent().children().each((index, element) => {
                if(element != this.$container[0]){
                    that.$otherDiv = jQuery(element);
                }
            });
        }

        this.$sliderDiv = jQuery('<div class="joe_slider"></div>');

        this.$sliderDiv.css({
            width: this.horVert ? "100%" : "4px",
            height: this.horVert ? "4px" : "100%",
            cursor: this.horVert ? "row-resize" : "col-resize",
        });

        if(this.firstLast){
            this.$sliderDiv.css({
                top: "0px",
                left: "0px"
            });
        } else {
            if(this.horVert){
                this.$sliderDiv.css({
                    bottom: "0px",
                    left: "0px"
                });    
            } else {
                this.$sliderDiv.css({
                    top: "0px",
                    right: "0px"
                });    
            }
        }

        this.$container.append(this.$sliderDiv);

        this.$sliderDiv.on("mousedown", (md: JQuery.MouseDownEvent) => {

            let x = md.clientX;
            let y = md.clientY;

            jQuery(document).on("mousemove.slider", (mm: JQuery.MouseMoveEvent) => {
                let dx = mm.clientX - x;
                let dy = mm.clientY - y;

                that.slide(dx, dy);
                
                x = mm.clientX;
                y = mm.clientY;

            });

            jQuery(document).on("mouseup.slider", () => {
                jQuery(document).off("mousemove.slider");
                jQuery(document).off("mouseup.slider");
            });


        });

        setTimeout(() => {
            that.slide(1, 1);
        }, 600);

    }

    setColor(color: string){
        this.$sliderDiv.css('background-color', color);
    }

    slide(dx: number, dy: number){
        if(this.horVert){
            let height = Number.parseInt(this.$container.css('height').replace('px', ''));
            let otherHeight = Number.parseInt(this.$otherDiv.css('height').replace('px', ''));
            let newHeight = this.firstLast ? height -= dy : height += dy;
            let newOtherHeight = this.firstLast ? otherHeight += dy : otherHeight -= dy;
            this.$container.css('height', newHeight + "px");
            this.$otherDiv.css('height', newOtherHeight + "px");
            this.callback(newHeight);
        } else {
            let width = Number.parseInt(this.$container.css('width').replace('px', ''));
            let otherWidth = Number.parseInt(this.$otherDiv.css('width').replace('px', ''));
            let newWidth = this.firstLast ? width -= dx : width += dx;
            let newOtherWidth = this.firstLast ? otherWidth += dx : otherWidth -= dx;
            this.$container.css('width', newWidth + "px");
            this.$otherDiv.css('width', newOtherWidth + "px");
            this.callback(newWidth);
        }
        this.$container.css('flex', "0 1 auto");

    }


}