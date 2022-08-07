import { Main } from "../main/Main.js";
import { makeDiv } from "../tools/HtmlTools.js";
import { ImageLoader, SpriteData } from "./ImageLoader.js";
import { UserSpritesheet } from "./UserSpritesheet.js";


export class SpriteManager {

    guiReady: boolean = false;

    userSpritesheet: UserSpritesheet;

    $mainHeading: JQuery<HTMLDivElement>;

    $importDropZone: JQuery<HTMLDivElement>;
    $uploadRect: JQuery<HTMLDivElement>;
    $uploadButtonStart: JQuery<HTMLDivElement>;
    $uploadLinesCount: JQuery<HTMLInputElement>;
    $uploadColumnsCount: JQuery<HTMLInputElement>;
    $uploadMargin: JQuery<HTMLInputElement>;
    $uploadSpace: JQuery<HTMLInputElement>;

    $spriteListDiv: JQuery<HTMLDivElement>;

    $buttonDiv: JQuery<HTMLDivElement>;
    $buttonCancel: JQuery<HTMLDivElement>;
    $buttonOK: JQuery<HTMLDivElement>;
    $buttonImport: JQuery<HTMLDivElement>;


    constructor(public main: Main) {
    }

    initGUI() {
        this.guiReady = true;        
        let that = this;
        let $spritemanagerDiv = jQuery('#spritemanager-div');

        // Heading
        $spritemanagerDiv.append(this.$mainHeading = makeDiv(null, "jo_sm_mainHeading"));
        this.$mainHeading.append(makeDiv("", "", "Sprites verwalten"));
        
        // Import/Export area
        let $importExportArea = makeDiv(null, "jo_sm_importExportArea", null, null, $spritemanagerDiv);

        let $importExportLeft = makeDiv(null, "jo_sm_importExportLeft", null, null, $importExportArea);
        this.$importDropZone = makeDiv(null, "jo_sm_importDropZone", "png-Dateien hierhin ziehen", null, $importExportLeft);

        this.$importDropZone.on('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
        })
        this.$importDropZone.on('drop', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.originalEvent.dataTransfer.files;
            that.importFiles(files);
        })



        let $importParameters = makeDiv(null, "jo_sm_importParameters", null, null, $importExportLeft);
        
        this.$uploadLinesCount = this.makeParameterInput($importParameters, "Zeilen:", 1);        
        this.$uploadColumnsCount = this.makeParameterInput($importParameters, "Spalten:", 1);        
        this.$uploadMargin = this.makeParameterInput($importParameters, "Rand (in px):", 0);        
        this.$uploadSpace = this.makeParameterInput($importParameters, "Abstand (in px):", 0);        

        this.$buttonImport = makeDiv(null, "jo_active jo_sm_button jo_sm_importButton", "Importieren", null, $importExportLeft);
        this.$buttonImport.on('click', () => {that.import()});

        let $importExportRight = makeDiv(null, "jo_sm_importExportRight", null, null, $importExportArea);
        let $buttonImportAll = makeDiv(null, 'jo_sm_buttonImportAll jo_sm_button jo_active', "Alle importieren", null, $importExportRight );
        let $buttonExportAll = makeDiv(null, 'jo_sm_buttonExportAll jo_sm_button jo_active', "Alle exportieren", null, $importExportRight );

        // Sprite list
        $spritemanagerDiv.append(this.$spriteListDiv = makeDiv(null, "jo_sm_spritelistDiv jo_scrollable"));


        // Buttons at page bottom
        $spritemanagerDiv.append(this.$buttonDiv = makeDiv(null, "jo_sm_buttonDiv"));

        this.$buttonDiv.append(this.$buttonCancel = makeDiv("", "jo_active jo_sm_button", "Abbrechen", { "background-color": "var(--speedcontrol-grip)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$buttonCancel.on("click", () => { that.exit() })

        this.$buttonDiv.append(this.$buttonOK = makeDiv("", "jo_active jo_sm_button", "Speichern", { "background-color": "var(--updateButtonBackground)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$buttonCancel.on("click", () => { that.saveAndExit() })

    }

    async importFiles(files: FileList) {
        let images = await (new ImageLoader()).loadFiles(files);
        for(let image of images){
            this.userSpritesheet.addSprite(image);
            this.renderImageInList(image);
        }
    }

    renderImageInList(imageData: SpriteData){

        let $line = makeDiv(null, "jo_sm_spriteListLine", null, null, this.$spriteListDiv);
        let pngFile = UPNG.encode([imageData.image.buffer], imageData.width, imageData.height, 0);
        let $img: JQuery<HTMLImageElement> = jQuery('<img>')
        $img[0].src = URL.createObjectURL(new Blob([pngFile], { type: 'image/png' } ));
        let maxWidthHeight: number = 50;
        if(imageData.width > imageData.height){
            let w = Math.min(imageData.width, maxWidthHeight);
            $img.attr('width', w + "px");
        } else {
            let h = Math.min(imageData.height, maxWidthHeight);
            $img.attr('height', h + "px");
        }
        $line.append($img);

        this.$spriteListDiv.prepend($line);

    }

    makeParameterInput($enclosingDiv: JQuery<HTMLElement>, caption: string, defaultValue: number): JQuery<HTMLInputElement> {
        let $div = $enclosingDiv.append(makeDiv(null, "jo_sm_parameterDiv"));
        makeDiv(null, "jo_sm_parameterCaption", caption, null, $div);
        return <any>$div.append('<input type="number" class="jo_sm_parameterInput" value="' + defaultValue + '"></input>');
    }

    import() {
        // TODO
    }

    show() {

        this.userSpritesheet = new UserSpritesheet();

        let that = this;
        if (!this.guiReady) {
            this.initGUI();
        }

        let $spriteDiv = jQuery('#spritemanager-div');
        $spriteDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');


        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });


    }

    saveAndExit(){
        // TODO
    }
  
    hide(){
        let $spriteDiv = jQuery('#spritemanager-div');
        $spriteDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
    }

    exit() {
        window.history.back();
    }


}