import jQuery from "jquery";

type Listener = () => void;

export class GUIButton {
    
    $html: JQuery<HTMLDivElement>;
    isActive: boolean = true;
    listeners: Listener[] = [];
 
    constructor(private _caption: string, public $parent: JQuery<HTMLElement>, backgroundColor: string = "#3059a9",
        onClick?: () => void
    ){
        this.$html = jQuery(`<div class='joe_guiButton active'>${_caption}</div>`);        
        this.$parent?.append(this.$html);
        this.$html.on('pointerdown', (e) => {
            e.stopPropagation();
            if(this.isActive){
                this.listeners.forEach(li => li())
            }
        })
        this.$html.css('background-color', backgroundColor);
        if(onClick != null) this.onClick(onClick);
    }
    
    onClick(listener: () => void){
        this.listeners.push(listener);
    }


    get caption(){
        return this._caption;
    }

    set caption(caption: string){
        this._caption = caption;
        this.$html.text(caption);
    }

    setActive(active: boolean){
        this.isActive = active;
        this.$html.toggleClass('active', active);
    }




} 