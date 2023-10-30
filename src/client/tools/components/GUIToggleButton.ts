import jQuery from "jquery";

type Listener = (checked: boolean) => void;

export class GUIToggleButton {
    
    $html: JQuery<HTMLDivElement>;
    isActive: boolean = true;
    listeners: Listener[] = [];
    linkedToggleButtons: Set<GUIToggleButton> = new Set();

    constructor(private _caption: string, public $parent: JQuery<HTMLElement>, private _isChecked){
        this.$html = jQuery(`<div class='joe_toggleButton active${_isChecked ? " checked" : ""}'>${_caption}</div>`);        
        this.$parent?.append(this.$html);
        this.$html.on('pointerdown', (e) => {
            e.stopPropagation();
            if(!this._isChecked){
                this.checked = !this._isChecked;
            }
        })
    }
    
    onChange(listener: (checked: boolean) => void){
        this.listeners.push(listener);
    }

    linkTo(...otherToggleButtons: GUIToggleButton[]){
        otherToggleButtons?.forEach(tb => {
            this.linkedToggleButtons.add(tb)
            tb.linkedToggleButtons.add(this);
        });

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

    get checked(){
        return this._isChecked;
    }

    set checked(checked: boolean){
        this._isChecked = checked;
        this.$html.toggleClass('checked', checked);
        this.listeners.forEach( l => l(checked));
        if(checked){
            this.linkedToggleButtons.forEach(tb => tb.checked = false);
        }
    }



} 