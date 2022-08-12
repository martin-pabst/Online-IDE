import { Main } from "../main/Main.js";
import { downloadFile, makeDiv, openContextMenu } from "../tools/HtmlTools.js";
import { ImageFile, SpriteData } from "./ImageFile.js";
import { EditableSpritesheet } from "./EditableSpritesheet.js";
import { PixiSpritesheetData, SpritesheetData } from "./SpritesheetData.js";
import { UploadSpriteResponse } from "../communication/Data.js";


export class SpriteManager {

    guiReady: boolean = false;

    userSpritesheet: EditableSpritesheet;

    $mainHeading: JQuery<HTMLDivElement>;

    $importDropZone: JQuery<HTMLDivElement>;
    $uploadRect: JQuery<HTMLDivElement>;

    $messagesDiv: JQuery<HTMLDivElement>;
    $pngSizeDiv: JQuery<HTMLDivElement>;

    $uploadButtonStart: JQuery<HTMLDivElement>;
    $uploadLinesCount: JQuery<HTMLInputElement>;
    $uploadColumnsCount: JQuery<HTMLInputElement>;
    $uploadMargin: JQuery<HTMLInputElement>;
    $uploadSpace: JQuery<HTMLInputElement>;
    $uploadSeries: JQuery<HTMLInputElement>;
    $uploadIndex: JQuery<HTMLInputElement>;

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
        makeDiv(null, null, "1. Schritt: png-Dateien hierhin ziehen", { "font-weight": "bold" }, this.$importDropZone);
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
            this.$buttonImport.addClass("jo_active");
        })


        let $importExportCenter = makeDiv(null, "jo_sm_importExportCenter", null, null, $importExportArea);
        makeDiv(null, "jo_sm_importParameters", "2. Schritt: Angaben zu den Grafikdateien", { "margin-bottom": "10px", "font-weight": "bold" }, $importExportCenter);
        let $importParameters1 = makeDiv(null, "jo_sm_importParameters", null, null, $importExportCenter);

        this.$uploadLinesCount = this.makeIntParameterInput($importParameters1, "Zeilen:", 1);
        this.$uploadColumnsCount = this.makeIntParameterInput($importParameters1, "Spalten:", 1);
        this.$uploadMargin = this.makeIntParameterInput($importParameters1, "Rand (in px):", 0);
        this.$uploadSpace = this.makeIntParameterInput($importParameters1, "Abstand (in px):", 0);

        let $importParameters2 = makeDiv(null, "jo_sm_importParameters", null, null, $importExportCenter);
        this.$uploadSeries = this.makeStringParameterInput($importParameters2, "Serie: ", "Test", "10em");
        this.$uploadIndex = this.makeIntParameterInput($importParameters2, "Ab Index: ", 0);

        makeDiv(null, null, null, { "border-bottom": "2px solid var(--slider)", "margin-bottom": "5px" }, $importExportCenter);

        this.$buttonImport = makeDiv(null, "jo_active jo_sm_button jo_sm_importButton", "3. Schritt: Importieren", { width: "fit-content" }, $importExportCenter);
        this.$buttonImport.on('click', () => { if (that.$buttonImport.hasClass("jo_active")) { that.importFiles(that.fileList); $filesCountDiv.text(""); } });


        let $importExportMessages = makeDiv(null, "jo_sm_importExportMessages", null, null, $importExportArea);
        makeDiv(null, null, "Meldungen:", { "font-weight": "bold" }, $importExportMessages);
        let $messagesOuter = makeDiv(null, "jo_sm_messagesOuter jo_scrollable", null, null, $importExportMessages);
        this.$messagesDiv = makeDiv(null, "jo_sm_messagesDiv jo_scrollable", "Test", null, $messagesOuter);
        this.$pngSizeDiv = makeDiv(null, "jo_sm_pngSizeDiv", "Größe des Spritesheet: 0 kB", null, $importExportMessages);

        let $importExportRight = makeDiv(null, "jo_sm_importExportRight", null, null, $importExportArea);
        makeDiv(null, null, "Gesamtes Spritesheet aus Datei importieren:",null,  $importExportRight);
        let $buttonImportAll = <JQuery<HTMLInputElement>>jQuery('<input type="file" style="cursor:pointer"></input>');
        $importExportRight.append($buttonImportAll);
        let $buttonExportAll = makeDiv(null, 'jo_sm_buttonExportAll jo_sm_button jo_active', "Gesamtes Spritesheet in Datei exportieren", null, $importExportRight);
        let $buttonDeleteAll = makeDiv(null, 'jo_sm_buttonDeleteAll jo_sm_button jo_active', "Alle Sprites aus dem Spritesheet entfernen", null, $importExportRight);

        $buttonDeleteAll.on("click", (ev) => {
            ev.preventDefault();
            openContextMenu([{
                caption: "Abbrechen",
                callback: () => { }
            }, {
                caption: "Ich bin mir sicher: löschen!",
                color: "#ff6060",
                callback: () => {
                    that.$spriteListDiv.empty()
                    that.userSpritesheet.spriteDataList = []
                    that.userSpritesheet.generatePixiSpritesheet();
                    that.printPngSize();
                }
            }], ev.pageX + 2, ev.pageY + 2);
            ev.stopPropagation();
        })

        $buttonExportAll.on("click", () => { that.exportSpritesheet(); })
        $buttonImportAll.on("change", (event) => { that.importSpritesheet(event.target.files); })

        // Sprite list
        let $spritelistOuter = makeDiv(null, "jo_sm_spritelistOuter", null, null, $spritemanagerDiv);
        this.$spriteListDiv = makeDiv(null, "jo_sm_spritelistDiv jo_scrollable", null, null, $spritelistOuter);


        // Buttons at page bottom
        $spritemanagerDiv.append(this.$buttonDiv = makeDiv(null, "jo_sm_buttonDiv"));

        this.$buttonDiv.append(this.$buttonCancel = makeDiv("", "jo_active jo_sm_button", "Abbrechen", { "background-color": "var(--speedcontrol-grip)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$buttonCancel.on("click", () => { that.exit() })

        this.$buttonDiv.append(this.$buttonOK = makeDiv("", "jo_active jo_sm_button", "Speichern", { "background-color": "var(--updateButtonBackground)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$buttonOK.on("click", () => { that.saveAndExit() })

    }

    async importSpritesheet(fileList: FileList) {

        let pixiDataFile: any;
        let pngDataFile: any;

        let file = fileList[0]
        //@ts-ignore
        let zip = await JSZip.loadAsync(file);
        zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
            if((<string>zipEntry.name).endsWith(".png")) pngDataFile = zipEntry;
            if((<string>zipEntry.name).endsWith(".json")) pixiDataFile = zipEntry;
        }, function (e) {
            alert("Error reading " + file.name + ": " + e.message)
        })

        this.userSpritesheet.spritesheet.pngFile = await pngDataFile.async("uint8array");
        this.userSpritesheet.spritesheet.pixiSpritesheetData = JSON.parse(await pixiDataFile.async("text"));

        this.userSpritesheet.spritesheet.unpackPngFile();
        this.userSpritesheet.extractImagesFromSheet();

        this.$spriteListDiv.empty();
        this.userSpritesheet.spriteDataList.forEach((sd) => this.renderImageInList(sd));

    }

    async exportSpritesheet() {
            await this.userSpritesheet.generatePixiSpritesheet();
            //@ts-ignore
            const zip = new JSZip();

            let filename = window.prompt("Name des Spritesheets?", "Spritesheet");

            zip.file(filename + ".png", this.userSpritesheet.spritesheet.pngFile);
            zip.file(filename + ".json", JSON.stringify(this.userSpritesheet.spritesheet.pixiSpritesheetData))

            zip.generateAsync({ type: "blob" }).then(function (content) {
                //@ts-ignore
                downloadFile(content, "spritesheet.zip", true);
            });
        }

    async importFiles(files: FileList) {
            let linesCount = Number.parseInt(<string>this.$uploadLinesCount.val());
            let columnscount = Number.parseInt(<string>this.$uploadColumnsCount.val());
            let margin = Number.parseInt(<string>this.$uploadMargin.val());
            let space = Number.parseInt(<string>this.$uploadSpace.val());
            let series = <string>this.$uploadSeries.val();
            let indexFrom = Number.parseInt(<string>this.$uploadIndex.val());

            let images = await (new ImageFile()).loadFiles(files);
            for (let image of images) {
                let newSprites: SpriteData[] = this.userSpritesheet.addSprite(image, linesCount, columnscount, margin, space, series, indexFrom);
                newSprites.forEach(sprite => this.renderImageInList(sprite))
            }
            this.$buttonImport.removeClass("jo_active");

            setTimeout(() => {
                this.userSpritesheet.generatePixiSpritesheet();
                this.printMessage(images.length + " Bilder hinzugefügt");
                this.printPngSize();
            }, 500);

        }

        printPngSize() {
            let size = this.userSpritesheet.spritesheet.pngFile.length;
            this.$pngSizeDiv.text("Spritesheet: " + Math.round(size / 1024 * 100) / 100 + " kB (Max: 1024 kB)");
            let color: string = size > 1024 * 1024 ? "red" : "";
            this.$pngSizeDiv.css("color", color);
        }

        renderImageInList(imageData: SpriteData) {
            let that = this;
            let $line = makeDiv(null, "jo_sm_spriteListLine", null, null, this.$spriteListDiv);

            // let pngFile = UPNG.encode([imageData.image.buffer], imageData.width, imageData.height, 0);
            // let $img1: JQuery<HTMLImageElement> = jQuery('<img class="jo_sm_spritepreview">')
            // $img1[0].src = URL.createObjectURL(new Blob([pngFile], { type: 'image/png' } ));


            let $img: JQuery<HTMLCanvasElement> = jQuery('<canvas width="' + imageData.width + '" height="' + imageData.height + '"></canvas>');
            let canvas = $img[0].getContext("2d");
            const id = new ImageData(new Uint8ClampedArray(imageData.image), imageData.width, imageData.height);
            canvas.putImageData(id, 0, 0);

            let maxWidth: number = 300;
            let maxHeight: number = 100;

            let w = imageData.width;
            let h = imageData.height;

            if (w / maxWidth > h / maxHeight) {
                w = Math.min(imageData.width, maxWidth);
                h = imageData.height / imageData.width * w;
            } else {
                h = Math.min(imageData.height, maxHeight);
                w = imageData.width / imageData.height * h;
            }

            $img.css('width', w + "px");
            $img.css('height', h + "px");

            let $innerbox = makeDiv(null, "jo_spritepreview-innerbox", null, { width: w + "px", height: h + "px", "margin-right": (maxWidth - w) + "px" }, $line);
            $innerbox.append($img);

            let $inputInfoDiv = makeDiv(null, "jo_sm_inputInfoDiv", null, null, $line);
            let $inputDiv = makeDiv(null, "jo_sm_inputDiv", null, null, $inputInfoDiv);

            let $seriesInput = this.makeStringParameterInput($inputDiv, "Serie: ", imageData.series ? imageData.series : "", "10em");
            let $indexInput = this.makeIntParameterInput($inputDiv, "Index: ", imageData.index ? imageData.index : 0);

            $seriesInput.on("input", () => { imageData.series = <string>$seriesInput.val() })
            $indexInput.on("input", () => { imageData.index = <number>$indexInput.val() })

            makeDiv(null, "jo_sm_infoDiv", "Breite: " + imageData.width + " px, Höhe: " + imageData.height + " px", null, $inputInfoDiv);

            let $deleteButton = makeDiv(null, "img_delete jo_button jo_active", null, null, $line);

            $deleteButton.on('pointerdown', (ev) => {
                ev.preventDefault();
                openContextMenu([{
                    caption: "Abbrechen",
                    callback: () => { }
                }, {
                    caption: "Ich bin mir sicher: löschen!",
                    color: "#ff6060",
                    callback: () => {
                        let index = that.userSpritesheet.spriteDataList.indexOf(imageData);
                        that.userSpritesheet.spriteDataList.splice(index, 1);
                        $line.remove();
                        that.userSpritesheet.generatePixiSpritesheet();
                        that.printPngSize();
                    }
                }], ev.pageX + 2, ev.pageY + 2);
                ev.stopPropagation();
            });

            this.$spriteListDiv.prepend($line);

        }

        makeIntParameterInput($enclosingDiv: JQuery<HTMLElement>, caption: string, defaultValue: number): JQuery < HTMLInputElement > {
            let $div = $enclosingDiv.append(makeDiv(null, "jo_sm_parameterDiv"));
            makeDiv(null, "jo_sm_parameterCaption", caption, null, $div);
        let $ret = jQuery('<input type="number" class="jo_sm_parameterInput" value="' + defaultValue + '" style="width: 2em"></input>');
            $div.append($ret);
            return<any>$ret;
        }

        makeStringParameterInput($enclosingDiv: JQuery<HTMLElement>, caption: string, defaultValue: string, width: string): JQuery < HTMLInputElement > {
            let $div = $enclosingDiv.append(makeDiv(null, "jo_sm_parameterDiv"));
            makeDiv(null, "jo_sm_parameterCaption", caption, null, $div);
        let $ret = jQuery('<input type="text" class="jo_sm_parameterInput" value="' + defaultValue + '" style="width: ' + width + '"></input>');
            $div.append($ret);
            return<any>$ret;
        }

    async show() {

            let that = this;
            if (!this.guiReady) {
                this.initGUI();
            }

            this.$buttonImport.removeClass("jo_active");
            this.fileList = null;

            let $spriteDiv = jQuery('#spritemanager-div');
            $spriteDiv.css('visibility', 'visible');
            let $mainDiv = jQuery('#main');
            $mainDiv.css('visibility', 'hidden');


            this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
                that.hide();
            });

            let spritesheetData = new SpritesheetData();
            await spritesheetData.load(this.main.getCurrentWorkspace().spritesheetId);

            this.userSpritesheet = new EditableSpritesheet(spritesheetData);
            this.$spriteListDiv.empty();
            this.userSpritesheet.spriteDataList.forEach((sd) => this.renderImageInList(sd));


        }

        saveAndExit() {
            this.userSpritesheet.generatePixiSpritesheet();
            let that = this;

            let deleteSpritesheet: boolean = this.userSpritesheet.spriteDataList.length == 0;

            $.ajax({
                type: 'POST',
                async: true,
                contentType: 'application/octet-stream',
                data: this.userSpritesheet.spritesheet.pngFile,
                processData: false,
                headers: { 'x-workspaceid': "" + that.main.getCurrentWorkspace().id, "x-filetype": deleteSpritesheet ? "delete" : "png" },
                url: "servlet/uploadSprite",
                success: function (response: UploadSpriteResponse) {
                    that.main.getCurrentWorkspace().spritesheetId = deleteSpritesheet ? null : response.spriteFileId;
                    if (deleteSpritesheet) return;
                    $.ajax({
                        type: 'POST',
                        async: true,
                        contentType: 'application/text',
                        data: JSON.stringify(that.userSpritesheet.spritesheet.pixiSpritesheetData),
                        processData: false,
                        headers: { 'x-workspaceid': "" + that.main.getCurrentWorkspace().id, "x-filetype": "json" },
                        url: "servlet/uploadSprite",
                        success: function (response: UploadSpriteResponse) {
                            that.exit();
                        },
                        error: function (jqXHR, message) {
                            alert(message);
                            that.exit();
                        }
                    }
                    );
                },
                error: function (jqXHR, message) {
                    alert(message);
                    that.exit();
                }
            }
            );

            this.userSpritesheet.spritesheet.initializeSpritesheetForWorkspace(this.main.getCurrentWorkspace(), this.main);
        }

        hide() {
            let $spriteDiv = jQuery('#spritemanager-div');
            $spriteDiv.css('visibility', 'hidden');
            let $mainDiv = jQuery('#main');
            $mainDiv.css('visibility', 'visible');
        }

        exit() {
            window.history.back();
        }

        printMessage(message: string, color ?: string) {
            let colorString = color == null ? "" : 'style="color: ' + color + '"';
            this.$messagesDiv.append(`<div ${colorString}>${message}</div>`);
            let md = this.$messagesDiv[0];
            md.scrollTop = md.scrollHeight;
        }

    }   