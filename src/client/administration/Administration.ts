import { AdminMenuItem } from "./AdminMenuItem.js";
import { SchoolsWithAdminsMI } from "./SchoolsWithAdminsMI.js";
import { ajax, csrfToken, extractCsrfTokenFromGetRequest } from "../communication/AjaxHelper.js";
import { GetUserDataResponse, UserData, ClassData } from "../communication/Data.js";
import { TeachersWithClassesMI } from "./TeachersWithClasses.js";
import { ClassesWithStudentsMI } from "./ClassesWithStudentsMI.js";
import { StudentBulkImportMI } from "./StudentBulkImortMI.js";
import { ExportImportMI } from "./ExportImportMI.js";
import { Pruefungen } from "./Pruefungen.js";

import "/include/css/icons.css";
import "/include/css/administration.css";
import { PushClientManager } from "../communication/pushclient/PushClientManager.js";


export class Administration {

    activeMenuItem: AdminMenuItem = null;

    menuItems: AdminMenuItem[] = [
        new SchoolsWithAdminsMI(this),
        new TeachersWithClassesMI(this),
        new ClassesWithStudentsMI(this),
        new StudentBulkImportMI(this),
        new ExportImportMI(this),
        new Pruefungen(this)
    ]

    userData: UserData;
    classes: ClassData[];

    async start() {

        await extractCsrfTokenFromGetRequest(true);

        let that = this;
        //@ts-ignore
        w2utils.locale('de-de');

        ajax("getUserData", {}, (response: GetUserDataResponse) => {
            that.userData = response.user;
            that.classes = response.classdata;
            this.initMenu();
            jQuery('#schoolName').text(response.schoolName);
        }, (message) => {
            alert(message);
        });

    }

    initMenu() {

        for (let mi of this.menuItems) {
            if (mi.checkPermission(this.userData)) {
                let $button = jQuery('<div class="jo_menuitem">' + mi.getButtonIdentifier() + '</div>');
                jQuery('#menuitems').append($button);
                $button.on('click', () => {

                    jQuery('#main-heading').empty();
                    
                    if(this.activeMenuItem != null) this.activeMenuItem.destroy();
                    this.activeMenuItem = mi;
                    
                    jQuery('#main-table-left').empty().css("flex-grow", "1");
                    jQuery('#main-table-right').empty().css("flex-grow", "1");
                    this.removeGrid(jQuery('#main-table-left'));
                    this.removeGrid(jQuery('#main-table-right'));
                    jQuery('#main-footer').empty();

                    mi.onMenuButtonPressed(
                        jQuery('#main-heading'), jQuery('#main-table-left'), jQuery('#main-table-right'),
                        jQuery('#main-footer'));

                    jQuery('#menuitems .jo_menuitem').removeClass('jo_active');
                    $button.addClass('jo_active');
                });
            }
        }

        jQuery('#menuitems .jo_menuitem').first().click();
    }

    removeGrid($element: JQuery<HTMLElement>){
        $element.removeClass('w2ui-reset w2ui-grid w2ui-ss');
        $element.css('flex', '');
    }

}

jQuery(() => {
    new Administration().start();
});