import jQuery from "jquery";

export type DialogButton = {
    caption: string,
    color: string,
    callback: () => void
}

export type CheckboxState = () => boolean;

export class Dialog {

    $dialog: JQuery<HTMLElement>;
    $dialogMain: JQuery<HTMLElement>;
    $dialogFooter: JQuery<HTMLElement>;

    init() {
        this.$dialog = jQuery('#dialog');
        this.$dialog.empty();
        jQuery('#main').css('visibility', 'hidden');
        this.$dialog.append(jQuery(
            '<div style="height: 20px"></div>' +
            '<div class="dialog-main"></div>' +
            '<div class="dialog-footer"></div>' +
            '<div style="flex: 4"></div>'
        ));
        this.$dialogMain = this.$dialog.find('.dialog-main');
        this.$dialogFooter = this.$dialog.find('.dialog-footer');
        this.$dialog.css('visibility', 'visible');

        this.$dialogMain.empty();
        this.$dialogFooter.empty();
    }


    heading(text: string) {
        let $div = jQuery('<div class="dialog-heading">' + text + "</div>")
        this.$dialogMain.append($div);
        return $div;
    }

    addDiv($div: JQuery<HTMLElement>){
        this.$dialogMain.append($div);
    }

    subHeading(text: string) {
        let $div = jQuery('<div class="dialog-subheading">' + text + "</div>")
        this.$dialogMain.append($div);
        return $div;
    }

    description(text: string, color?: string) {
        let colorStyle = color == null ? "" : `style="color: ${color}"`;
        let $div = jQuery(`<div class="dialog-description" ${colorStyle}>${text}</div>`)
        this.$dialogMain.append($div);
        return $div;
    }

    input(type: string, placeholder: string):JQuery<HTMLInputElement> {
        let $div = jQuery(`<input class="dialog-input" type="${type}" placeholder="${placeholder}"></input>`)
        this.$dialogMain.append($div);
        return <any>$div;
    }

    buttons(buttons: DialogButton[]){

        let $buttonRow = jQuery('<div class="dialog-buttonRow"></div>')
        this.$dialogMain.append($buttonRow);

        for(let button of buttons){

            let $button = jQuery(`<button style="background-color: ${button.color};margin-left: 20px">${button.caption}</button>`)
            $button.on("click", () => {button.callback()})
            $buttonRow.append($button);
        }
    }

    waitMessage(text: string): (visible: boolean) => void {

        let $message = jQuery(`<div class="dialog-wait">${text}<img src="assets/graphics/ball-triangle.svg"></div>`)
        this.$dialogMain.append($message);

        return (visible: boolean) => {
            let visibility = visible ? "visible" : "hidden";
            $message.css("visibility", visibility);
        }

    }

    close() {
        this.$dialog.css('visibility', 'hidden');
        this.$dialog.empty();
        jQuery('#main').css('visibility', 'visible');
    }

    addCheckbox(description: string, ischecked: boolean, name: string): CheckboxState {
        let cb: string = '<input type="checkbox" name="' + name + '"' + (ischecked ? ' checked' : '') + '>';
        let $checkbox = jQuery(cb);
        let $description = jQuery('<label for="' + name + '">' + description + "</label>");
        
        let $div = jQuery('<div class="jo_checkbox_div"></div>')
        $div.append($checkbox, $description);

        $description.on('click', () => {$checkbox.prop("checked", !$checkbox.prop("checked"))})

        this.$dialogMain.append($div);
        return () => {
            return $checkbox.is(':checked');
        }
    }


}