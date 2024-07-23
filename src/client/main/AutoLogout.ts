import { Login } from "./Login";
import { Main } from "./Main";
import { MainBase } from "./MainBase";

export class AutoLogout {

    logoutAfterMinutes: number = 5;
    counterInMinutes: number = this.logoutAfterMinutes;

    constructor(login: Login){
        let that = this;
        setInterval(() => {
            that.logoutAfterMinutes--;
            if(that.logoutAfterMinutes == 0){
                login.logout();
            }
        }, 60*1000);

        document.body.addEventListener("keydown", () => {
            that.reset();
        });

        document.body.addEventListener("mousedown", () => {
            that.reset();
        })

    }

    reset(){
        this.counterInMinutes = this.logoutAfterMinutes;
    }

}