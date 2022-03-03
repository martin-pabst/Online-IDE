import { escapeHtml } from "./StringTools.js";

export function makeEditable(elementWithText: JQuery<HTMLElement>,
    elementToReplace: JQuery<HTMLElement>,
    renameDoneCallback: (newContent: string) => void, selectionRange: { start: number, end: number } = null) {

    let mousePointer = window.PointerEvent ? "pointer" : "mouse";

    if (elementToReplace == null) {
        elementToReplace = elementWithText;
    }

    let $input = jQuery('<input type="text" class="jo_inplaceeditor" spellcheck="false">');
    $input.css({
        width: elementToReplace.css('width'),
        height: elementToReplace.css('height'),
        color: elementToReplace.css('color'),
        position: elementToReplace.css('position'),
        "background-color": elementToReplace.css('background-color'),
        "font-size": elementToReplace.css('font-size'),
        "font-weight": elementToReplace.css('font-weight'),
        "box-sizing": "border-box"
    });
    $input.val(elementWithText.text());
    $input.on(mousePointer + "down", (e) => { e.stopPropagation(); })

    if (selectionRange != null) {
        (<HTMLInputElement>$input[0]).setSelectionRange(selectionRange.start, selectionRange.end);
    }

    elementToReplace.after($input);
    elementToReplace.hide();
    setTimeout(() => {
        $input.focus();
    }, 300);

    $input.on("keydown.me", (ev) => {
        if (ev.key == "Enter" || ev.key == "Escape") {
            $input.off("keydown.me");
            $input.off("focusout.me");
            $input.remove();
            elementToReplace.show();
            let newValue = escapeHtml(<string>$input.val());
            renameDoneCallback(newValue);
            return;
        }
    });

    $input.on("focusout.me", (ev) => {
        $input.off("keydown.me");
        $input.off("focusout.me");
        $input.remove();
        elementToReplace.show();
        let newValue = escapeHtml(<string>$input.val());
        renameDoneCallback(newValue);
        return;
    });

}

export type ContextMenuItem = {
    caption: string;
    color?: string;
    callback: () => void;
    link?: string;
    subMenu?: ContextMenuItem[]
};

export function openContextMenu(items: ContextMenuItem[], x: number, y: number): JQuery<HTMLElement> {

    let mousePointer = window.PointerEvent ? "pointer" : "mouse";

    let $contextMenu = jQuery('<div class="jo_contextmenu"></div>');

    let $openSubMenu: JQuery<HTMLElement> = null;
    let parentMenuItem: ContextMenuItem = null;

    for (let mi of items) {
        let caption: string = mi.caption;
        if (mi.link != null) {
            caption = `<a href="${mi.link}" target="_blank" class="jo_menulink">${mi.caption}</a>`;
        }
        let $item = jQuery('<div>' + caption + (mi.subMenu != null ? '<span style="float: right"> &nbsp; &nbsp; &gt;</span>' : "") + '</div>');
        if (mi.color != null) {
            $item.css('color', mi.color);
        }
        if (mi.link == null) {
            $item.on(mousePointer + 'up.contextmenu', (ev) => {
                ev.stopPropagation();
                jQuery('.jo_contextmenu').remove();
                jQuery(document).off(mousePointer + "up.contextmenu");
                jQuery(document).off(mousePointer + "down.contextmenu");
                jQuery(document).off("keydown.contextmenu");
                mi.callback();
            });
            $item.on(mousePointer + 'down.contextmenu', (ev) => {
                ev.stopPropagation();
            });
        } else {
            let $link = $item.find('a');
            $link.on(mousePointer + "up", (event) => {
                event.stopPropagation();
                setTimeout(() => {
                    $item.hide();
                }, 500);
            })
            $link.on(mousePointer + "down", (event) => {
                event.stopPropagation();
            })

        }

        $item.on(mousePointer + 'move.contextmenu', () => {
            if (mi != parentMenuItem && $openSubMenu != null) {
                $openSubMenu.remove();
                parentMenuItem = null;
                $openSubMenu = null;
            }
            if (mi.subMenu != null) {
                $openSubMenu = openContextMenu(mi.subMenu, $item.offset().left + $item.width(), $item.offset().top);
            }
        });

        $contextMenu.append($item);
    }

    jQuery(document).on(mousePointer + "down.contextmenu", (e) => {
        jQuery(document).off(mousePointer + "down.contextmenu");
        jQuery(document).off("keydown.contextmenu");
        jQuery('.jo_contextmenu').remove();
    })

    jQuery(document).on("keydown.contextmenu", (ev) => {
        if (ev.key == "Escape") {
            jQuery(document).off(mousePointer + "up.contextmenu");
            jQuery(document).off("keydown.contextmenu");
            jQuery('.jo_contextmenu').remove();
        }
    });

    let leftRight = x > window.innerWidth * 0.8 ? "right" : "left";
    let xp = x > window.innerWidth * 0.8 ? window.innerWidth - x : x;
    let topBottom = y > window.innerHeight * 0.8 ? "bottom" : "top";
    let yp = y > window.innerHeight * 0.8 ? window.innerHeight - y : y;

    let css = {};
    css[leftRight] = xp + "px";
    css[topBottom] = yp + "px";

    $contextMenu.css(css);


    jQuery("body").append($contextMenu);
    $contextMenu.show();

    return $contextMenu;
}

export function makeTabs(tabDiv: JQuery<HTMLElement>) {
    let headings = tabDiv.find('.jo_tabheadings>div').not('.jo_noHeading');
    let tabs = tabDiv.find('.jo_tabs>div');

    let mousePointer = window.PointerEvent ? "pointer" : "mouse";

    headings.on(mousePointer + "down", (ev) => {
        let target = jQuery(ev.target);
        headings.removeClass('jo_active');
        target.addClass('jo_active');
        let tab = tabDiv.find('.' + target.data('target'));
        tabs.removeClass('jo_active');
        tabs.trigger('myhide');
        tab.addClass('jo_active');
        tab.trigger('myshow');
    });

}

export function convertPxToNumber(pxString: string): number {
    pxString = pxString.replace('px', '').trim();
    return Number.parseInt(pxString);
}

export function makeDiv(id: string, klass: string = "", text: string = "", css?: { [id: string]: any }): JQuery<HTMLDivElement> {

    let s = "";
    if (id != null && id != "") s += ` id="${id}"`;

    if (klass != null && klass != "") s += ` class="${klass}"`;

    let div = jQuery(`<div${s}></div>`);

    if (css != null) {
        div.css(css);
    }

    if (text != null && text != "") {
        div.text(text);
    }

    return <any>div;

}

export type SelectItem = {
    value: string | number,
    object: any,
    caption: string
}

export function setSelectItems($selectElement: JQuery<HTMLSelectElement>, items: SelectItem[], activeItemValue?: string | number) {
    $selectElement.empty();
    items.forEach(item => {
        let selected: string = (item.value == activeItemValue) ? ' selected="selected"' : "";
        let element = jQuery(`<option value=${item.value}${selected}>${item.caption}</option>`);
        $selectElement.append(element);
        element.data('object', item.object);
    }
    );

    $selectElement.data('items', items);


}

export function getSelectedObject($selectDiv: JQuery<HTMLSelectElement>) {

    let items: SelectItem[] = $selectDiv.data('items');

    let selectedValue = $selectDiv.val();

    return items.find(item => item.value == selectedValue)?.object;

}

export var jo_mouseDetected: boolean = false;
export function checkIfMousePresent() {
    if (matchMedia('(pointer:fine)').matches) {
        jo_mouseDetected = true;
    }
}

export function animateToTransparent($element: JQuery<HTMLElement>, cssProperty: string, startColorRgb: number[], duration: number) {
    let colorPraefix = 'rgba(' + startColorRgb[0] + ", " + startColorRgb[1] + ", " + startColorRgb[2] + ", ";
    let value = 1.0;
    let delta = value / (duration / 20);

    let animate = () => {
        $element.css(cssProperty, colorPraefix + value + ")");
        value -= delta;
        if (value < 0) {
            $element.css(cssProperty, "");
        } else {
            setTimeout(animate, 20);
        }
    }

    animate();
}

export function downloadFile(obj: any, filename: string, isBlob: boolean = false) {
    var blob = isBlob? obj : new Blob([JSON.stringify(obj)], { type: 'text/plain' });
    //@ts-ignore
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        //@ts-ignore
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        var e = document.createEvent('MouseEvents'),
            a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
        //@ts-ignore
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
        a.remove();
    }
}


function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

export function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}
