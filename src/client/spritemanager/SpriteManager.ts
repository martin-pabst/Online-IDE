import { Main } from "../main/Main.js";
import { makeDiv, openContextMenu } from "../tools/HtmlTools.js";
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

    fileList: FileList;


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
        this.$importDropZone = makeDiv(null, "jo_sm_importDropZone", null, null, $importExportLeft);
        makeDiv(null, null, "1. Schritt: png-Dateien hierhin ziehen", {"font-weight": "bold"}, this.$importDropZone);
        let $filesCountDiv = makeDiv(null, null, "", null, this.$importDropZone);

        this.$importDropZone.on('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
        })
        this.$importDropZone.on('drop', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();

            var files = evt.originalEvent.dataTransfer.files;
            that.fileList = files;
            $filesCountDiv.text(files.length != 1 ? (files.length + " Dateien sind ausgewählt.") : "Eine Datei ist ausgewählt.");
        })


        let $importExportCenter = makeDiv(null, "jo_sm_importExportCenter", null, null, $importExportArea);
        makeDiv(null, null, "2. Schritt: Angaben zu den Grafikdateien", {"margin-bottom": "10px", "font-weight": "bold"}, $importExportCenter);
        let $importParameters = makeDiv(null, "jo_sm_importParameters", null, null, $importExportCenter);

        this.$uploadLinesCount = this.makeIntParameterInput($importParameters, "Zeilen:", 1);        
        this.$uploadColumnsCount = this.makeIntParameterInput($importParameters, "Spalten:", 1);        
        this.$uploadMargin = this.makeIntParameterInput($importParameters, "Rand (in px):", 0);        
        this.$uploadSpace = this.makeIntParameterInput($importParameters, "Abstand (in px):", 0);        

        this.$buttonImport = makeDiv(null, "jo_active jo_sm_button jo_sm_importButton", "3. Schritt: Importieren", {width: "fit-content"}, $importExportCenter);
        this.$buttonImport.on('click', () => {that.importFiles(that.fileList);
        });

        let $importExportRight = makeDiv(null, "jo_sm_importExportRight", null, null, $importExportArea);
        let $buttonImportAll = makeDiv(null, 'jo_sm_buttonImportAll jo_sm_button jo_active', "Alle importieren", null, $importExportRight );
        let $buttonExportAll = makeDiv(null, 'jo_sm_buttonExportAll jo_sm_button jo_active', "Alle exportieren", null, $importExportRight );

        let $spritelistOuter = makeDiv(null, "jo_sm_spritelistOuter", null, null, $spritemanagerDiv);

        // Sprite list
        this.$spriteListDiv = makeDiv(null, "jo_sm_spritelistDiv jo_scrollable", null, null, $spritelistOuter);


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

        let that = this;
        let $line = makeDiv(null, "jo_sm_spriteListLine", null, null, this.$spriteListDiv);

        let pngFile = UPNG.encode([imageData.image.buffer], imageData.width, imageData.height, 0);
        let $img: JQuery<HTMLImageElement> = jQuery('<img class="jo_sm_spritepreview">')
        $img[0].src = URL.createObjectURL(new Blob([pngFile], { type: 'image/png' } ));
        let maxWidth: number = 300;
        let maxHeight: number = 100;

        let w = imageData.width;
        let h = imageData.height;

        if(w/maxWidth > h/maxHeight){
            w = Math.min(imageData.width, maxWidth);
            h = imageData.height/imageData.width*w;
        } else {
            h = Math.min(imageData.height, maxHeight);
            w = imageData.width/imageData.height * h;
        }

        $img.attr('width', w + "px");
        $img.attr('height', h + "px");

        let $innerbox = makeDiv(null, "jo_spritepreview-innerbox", null, {width: w + "px", height: h + "px", "margin-right": (maxWidth - w) + "px"}, $line);
        $innerbox.append($img);

        let $inputInfoDiv = makeDiv(null, "jo_sm_inputInfoDiv", null, null, $line);
        let $inputDiv = makeDiv(null, "jo_sm_inputDiv", null, null, $inputInfoDiv);

        let $seriesInput = this.makeStringParameterInput($inputDiv, "Serie: ", imageData.series?imageData.series : "", "10em");
        let $indexInput = this.makeIntParameterInput($inputDiv, "Index: ", imageData.index?imageData.index : 0);

        $seriesInput.on("input", () => {imageData.series = <string>$seriesInput.val()})
        $indexInput.on("input", () => {imageData.index = <number>$indexInput.val()})

        makeDiv(null, "jo_sm_infoDiv", "Breite: " + imageData.width + " px, Höhe: " + imageData.height + " px", null, $inputInfoDiv);

        let $deleteButton = makeDiv(null, "img_delete jo_button jo_active", null, null, $line);

        $deleteButton.on('pointerdown', (ev) => {
            ev.preventDefault();
            openContextMenu([{
                caption: "Abbrechen",
                callback: () => {}
            }, {
                caption: "Ich bin mir sicher: löschen!",
                color: "#ff6060",
                callback: () => {
                    let index = that.userSpritesheet.spriteDataList.indexOf(imageData);
                    that.userSpritesheet.spriteDataList.splice(index, 1);
                    $line.remove();
                    that.userSpritesheet.generatePixiSpritesheet();
                }
            }], ev.pageX + 2, ev.pageY + 2);
            ev.stopPropagation();
        });

        this.$spriteListDiv.prepend($line);

    }

    makeIntParameterInput($enclosingDiv: JQuery<HTMLElement>, caption: string, defaultValue: number): JQuery<HTMLInputElement> {
        let $div = $enclosingDiv.append(makeDiv(null, "jo_sm_parameterDiv"));
        makeDiv(null, "jo_sm_parameterCaption", caption, null, $div);
        return <any>$div.append('<input type="number" class="jo_sm_parameterInput" value="' + defaultValue + '" style="width: 2em"></input>');
    }

    makeStringParameterInput($enclosingDiv: JQuery<HTMLElement>, caption: string, defaultValue: string, width: string): JQuery<HTMLInputElement> {
        let $div = $enclosingDiv.append(makeDiv(null, "jo_sm_parameterDiv"));
        makeDiv(null, "jo_sm_parameterCaption", caption, null, $div);
        return <any>$div.append('<input type="text" class="jo_sm_parameterInput" value="' + defaultValue + '" style="width: ' + width + '"></input>');
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