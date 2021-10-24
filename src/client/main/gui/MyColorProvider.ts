import { Module } from "src/client/compiler/parser/Module.js";
import { MainBase } from "../MainBase.js";

export class MyColorProvider implements monaco.languages.DocumentColorProvider {
    
    constructor(private main: MainBase){

    }

    provideDocumentColors(model: monaco.editor.ITextModel, token: monaco.CancellationToken): monaco.languages.ProviderResult<monaco.languages.IColorInformation[]> {
        let consoleModel = this.main.getBottomDiv()?.console?.editor?.getModel();
        let isConsole = model == consoleModel;

        let isMainWindow = model == this.main.getMonacoEditor().getModel();

        if (!(isConsole || isMainWindow)) return;

        let module: Module = isConsole ? this.main.getBottomDiv()?.console?.compiler.module :
            this.main.getCurrentWorkspace()?.getModuleByMonacoModel(model);

        if (module == null) {
            return null;
        }
    
        if(this.main.getCompiler() == null){
            let that = this;
            let i = 3;
            return new Promise(function(resolve, reject){

                let f = () => {
                    if(that.main.getCompiler() != null){
                        that.main.compileIfDirty();
                        resolve(module.colorInformation);
                    } else {
                        i--;
                        if(i == 0){
                            resolve([]);
                        } else {
                            setTimeout(f, 500);
                        }
                    }
                }

                setTimeout(f, 500);       
            })
        }

        this.main.compileIfDirty();
        
        return module.colorInformation;

    }

    provideColorPresentations(model: monaco.editor.ITextModel, colorInfo: monaco.languages.IColorInformation, token: monaco.CancellationToken): monaco.languages.ProviderResult<monaco.languages.IColorPresentation[]> {
        var color = colorInfo.color;
        var oldColor: string = model.getValueInRange(colorInfo.range);

        var red256 = Math.round(color.red * 255);
        var green256 = Math.round(color.green * 255);
        var blue256 = Math.round(color.blue * 255);
        var label;

        if(oldColor.startsWith('#')){
            label = '#' + this.toHex2Digits(red256) + this.toHex2Digits(green256) + this.toHex2Digits(blue256); 
        } else if(oldColor.startsWith('0x') ){
            label = '0x' + this.toHex2Digits(red256) + this.toHex2Digits(green256) + this.toHex2Digits(blue256);
        } else if(oldColor.startsWith('rgb')){
            if(color.alpha < 0.999){
                label = 'rgba(' + red256 + ', ' + green256 + ', ' + blue256 + ', ' + color.alpha + ')';
            } else {
                label = 'rgb(' + red256 + ', ' + green256 + ', ' + blue256 + ')';
            }
        } 

        return [
            {
                label: label
            }
        ];
    }

    toHex2Digits(n: number){
        let hex = n.toString(16);
        while(hex.length < 2){
            hex = '0' + hex;
        }
        return hex;
    }
}