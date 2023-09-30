import { Administration } from "./Administration.js";
import { UserData } from "../communication/Data.js";

export abstract class AdminMenuItem {

    constructor(public administration: Administration){

    }

    abstract getButtonIdentifier(): string;

    abstract onMenuButtonPressed($mainHeading: JQuery<HTMLElement>, $tableLeft: JQuery<HTMLElement>,
        $tableRight: JQuery<HTMLElement>, $mainFooter: JQuery<HTMLElement>): void;

    abstract destroy();

    abstract checkPermission(user: UserData): boolean;

    protected selectTextInCell(){
        let i = 5;
        let f = () => {
            let element = jQuery("input.w2ui-input.w2field");
            if (element.length > 0) {
                (<HTMLInputElement>element[0]).select();
            } else {
                i--;
                if (i > 0) {
                    setTimeout(f, 300);
                }
            }
        };

        setTimeout(f, 300);
    }

}