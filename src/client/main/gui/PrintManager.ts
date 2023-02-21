import jQuery from 'jquery';
import { MainBase } from "../MainBase.js";

type PrintCommand = {
    text: string;
    color: string;
    newLine: boolean;
}

export class PrintManager {

    color: string = "";
    lastSpan: string = "";
    $lastSpan: JQuery<HTMLElement>;

    $lastDiv: JQuery<HTMLElement>;
    $outputDiv: JQuery<HTMLElement>;

    maxLines: number = 2000;
    $lines: JQuery<HTMLElement>[] = [];

    newLines: number = 0;

    printCommands: PrintCommand[] = [];

    currentLinelength: number = 0;
    beginOfLineState: boolean = true; // Spaces at begin of line are converted to &nbsp;

    constructor(private $runDiv: JQuery<HTMLElement>, private main: MainBase) {
        jQuery(() => {
            this.$outputDiv = $runDiv.find('.jo_output');
            this.clear();

            let that = this;

            let n: number = 0;

            let dirty = false;
            let lastPrinting = performance.now();

            setInterval(() => {
                if (that.printCommands.length > 0) {
                    that.doPrinting();
                    if (performance.now() - lastPrinting > 200) {
                        that.$outputDiv[0].scrollTop = that.$outputDiv[0].scrollHeight;
                    } else {
                        dirty = true;
                    }
                    lastPrinting = performance.now();
                }

                if (n++ % 20 == 0 && dirty) {
                    setTimeout(() => {
                        that.$outputDiv[0].scrollTop = that.$outputDiv[0].scrollHeight;
                        dirty = false;
                    }, 200);
                }

            }, 50);


        });
    }

    getGraphicsDiv():JQuery<HTMLElement> {
        return this.$runDiv.find('.jo_graphics');
    }

    showProgramEnd() {
        let $programEndDiv = this.$runDiv.find('.jo_run-programend');
        $programEndDiv.show();
        $programEndDiv.addClass('jo_programendkf');
        setTimeout(() => {
            $programEndDiv.removeClass('jo_programendkf');
            $programEndDiv.hide();
        }, 3000);
    }

    doPrinting() {

        // If there are more than maxLines in next output batch: 
        // Delete surplus lines before printing them and empty output-div
        if (this.newLines >= this.maxLines) {

            this.$outputDiv.empty();

            let i = this.printCommands.length - 1;
            let nl = 0;

            while (i >= 0) {

                if (this.printCommands[i].newLine) {
                    nl++;
                    if (nl >= this.maxLines) {
                        this.printCommands.splice(0, i + 1);
                        break;
                    }
                }
                i--;
            }

        }

        this.newLines = 0;

        // reopen last printed span-element
        if(this.$lastSpan != null){
            this.$lastSpan.remove();
            if(this.lastSpan.endsWith("</span>")) this.lastSpan = this.lastSpan.substring(0, this.lastSpan.length - 7);
        }


        for (let pc of this.printCommands) {

            // replace spaces with &nbsp;'s
            // pc.text = pc.text.replace(/ /g, "&nbsp;");


            if (this.beginOfLineState && pc.text.startsWith(" ")) {
                let match = pc.text.match(/^( *)(.*)$/);
                if (match[2].length > 0) this.beginOfLineState = false;
            } else {
                if (pc.text.length > 0) this.beginOfLineState = false;
            }

            pc.text = pc.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            if (pc.color == null) pc.color = "var(--defaultOutputColor)";

            if (this.lastSpan == "" || this.color != pc.color) {
                if (this.lastSpan != "") this.lastSpan += "</span>";      // new color => close old span
                this.lastSpan += '<span style="color: ' + pc.color + '">';
                if(pc.newLine && pc.text == "") this.lastSpan += "\u200b"; // makes empty lines possible; \u200b is a space with 0 width but full height.
                this.color = pc.color;
            }

            if (this.currentLinelength <= 10000) {
                this.lastSpan += pc.text;
                this.currentLinelength += pc.text.length;
            }


            if (pc.newLine) {
                this.beginOfLineState = true;
                if (!this.lastSpan.endsWith("</span>")) this.lastSpan += "</span>";
                this.$lastSpan = jQuery(this.lastSpan);
                this.$lastDiv.append(this.$lastSpan);
                
                this.lastSpan = "";
                this.$lastSpan = null;

                this.$lastDiv = jQuery('<div></div>');

                let $input = this.main.getInterpreter().inputManager.$input;
                if($input != null){
                    this.$lastDiv.insertBefore($input);
                } else {
                    this.$outputDiv.append(this.$lastDiv);
                }

                this.$lines.push(this.$lastDiv);
                this.currentLinelength = 0;
            }

        }

        if (this.lastSpan != "") {
            if (!this.lastSpan.endsWith("</span>")) this.lastSpan += "</span>";
            this.$lastSpan = jQuery(this.lastSpan);
            this.$lastDiv.append(this.$lastSpan);
        }

        if (this.$lines.length > this.maxLines * 1.5) {
            let that = this;
            let linesToDelete = that.$lines.length - that.maxLines;

            let $linesToDelete = that.$lines.splice(0, linesToDelete);

            for (let $line of $linesToDelete) {
                $line.remove();
            }

        }

        this.printCommands = [];
    }

    clear() {
        this.$outputDiv.empty();
        this.$lastDiv = jQuery('<div></div>');
        this.$lines.push(this.$lastDiv);
        this.$outputDiv.append(this.$lastDiv);
        this.currentLinelength = 0;
        this.color = "";
        this.lastSpan = "";
        this.printCommands = [];
    }

    print(text: string | null, color?: string|number) {
        if (text == null) return;

        if(typeof color == "number"){
            color = color.toString(16);
            while(color.length < 6) color = "0" + color;
            color = "#" + color;
        }

        text = text.toString();
        if (text.indexOf("\n") >= 0) {
            let tList = text.split("\n");
            for (let i = 0; i < tList.length; i++) {
                let t = tList[i];
                let newLine = i < tList.length - 1;
                if (t == "" && i == tList.length - 1) continue;
                this.printCommands.push({
                    text: t,
                    color: color,
                    newLine: newLine
                });
                if (newLine) this.newLines++;
            }
        } else {
            this.printCommands.push({
                text: text,
                color: color,
                newLine: false
            });
        }
    }

    println(text: string | null, color?: string|number) {
        if (text == null) text = "";
        this.print(text + "\n", color);
    }

}