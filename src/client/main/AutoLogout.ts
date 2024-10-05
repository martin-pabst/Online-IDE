import { ajax } from "../communication/AjaxHelper";
import { LogoutRequest } from "../communication/Data";
import { Login } from "./Login";

export class AutoLogout {

    logoutAfterMinutes: number = 20;
    counterInMinutes: number = this.logoutAfterMinutes;

    constructor(login?: Login) {
        let that = this;
        setInterval(() => {
            that.counterInMinutes--;
            if (that.counterInMinutes == 0) {
                if (login) {
                    login.logout();
                } else {
                    that.logout();
                }
            }
        }, 60 * 1000);

        document.body.addEventListener("keydown", () => {
            that.reset();
        });

        document.body.addEventListener("mousedown", () => {
            that.reset();
        })

    }

    reset() {
        this.counterInMinutes = this.logoutAfterMinutes;
    }
    
    
    logout() {
        let logoutRequest: LogoutRequest = {
            currentWorkspaceId: null
        }

        ajax('logout', logoutRequest, () => {
            window.location.href = 'index.html';
        });

    }

}