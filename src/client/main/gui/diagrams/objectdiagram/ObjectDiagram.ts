import { ObjectDiagramVariant } from "./ObjectDiagramVariant.js";
import { Main } from "../../../Main.js";
import { Diagram } from "../Diagram.js";
import { ListDiagram } from "./ListDiagram.js";
import { MainBase } from "../../../MainBase.js";

export class ObjectDiagram extends Diagram {

    variants: ObjectDiagramVariant[] = [];
    currentVariant: ObjectDiagramVariant = null;

    constructor(main: MainBase, private $objectDiagramDiv: JQuery<HTMLElement>) {
        super($objectDiagramDiv.find('.jo_objectdiagram-canvas'), main);
        this.variants.push(new ListDiagram(main, this));

        let $typeOption = $objectDiagramDiv.find('.jo_objectdiagram-type');
        $typeOption.empty();
        $typeOption.append('<option value="none" selected>Bitte auswählen...</option>');

        let i = 0;
        for (let variant of this.variants) {
            $typeOption.append('<option value="' + i + '">' + variant.getName() + '</option>');
        }

        let that = this;
        $typeOption.on('change', (e) => {
            //@ts-ignore
            let value: string = e.currentTarget.value;
            if(value == null){
                if(that.currentVariant != null){
                    that.$canvas.find('.jo_objectDiagramError').remove();
                    that.currentVariant.clear();
                }
                that.currentVariant = null;
            } else {
                let intValue = Number.parseInt(value);
                that.currentVariant = that.variants[intValue];
            }
            that.updateSettings();
        });

    }

    error(error: string){
        this.$canvas.append('<div class="jo_objectDiagramError">' + error + '</div>')
    }


    updateSettings(){
        let $settingsDiv = this.$objectDiagramDiv.find('.jo_objectdiagram-settings');
        if(this.currentVariant != null){
            $settingsDiv.empty();
            $settingsDiv.append(this.currentVariant.getSettingsElement());
        } else {
            $settingsDiv.empty();
        }
    }
    
    updateDiagram(){
        if(this.currentVariant != null){
            this.currentVariant.updateDiagram();
        }
    }

}