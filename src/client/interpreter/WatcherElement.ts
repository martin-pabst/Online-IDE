import { AccordionElement } from "../main/gui/Accordion.js";
import { Main } from "../main/Main.js";
import { MainBase } from "../main/MainBase.js";

export class WatcherElement {

    constructor(public expression: string, public accordionElement: AccordionElement,
        private main: MainBase, private $secondLine: JQuery<HTMLElement>, private $rightTextInFirstLine: JQuery<HTMLElement>) {

    }

    setError(error: string) {
        this.$secondLine.empty();
        this.$secondLine.append(jQuery('<div class="jo_watcherResult">' + "---" + '</div>'));
    }

    evaluate() {

        let evaluator = this.main.getCurrentWorkspace().evaluator;
        let result = evaluator.evaluate(this.expression);
        if (result.error != null) {
            this.setError(result.error);
        } else {

            let v = "---";
            if (result.value != null) {
                v = result.value.type.debugOutput(result.value);
            }

            this.$secondLine.empty();
            this.$rightTextInFirstLine.empty();

            monaco.editor.colorize(v, 'myJava', { tabSize: 3 }).then((command) => {

                let $result = jQuery('<div class="jo_watcherResult">' + command + '</div>');

                if (this.expression.length + v.length < 20) {
                    this.$rightTextInFirstLine.append($result);
                } else {
                    this.$secondLine.append($result);
                }

            }
            );
        }


    }

}
