import { Main } from "../Main.js";

export type WindowBackButtonListener = (event: PopStateEvent) => void;

export class WindowStateManager {

    backButtonListener: WindowBackButtonListener;
    oneTimeBackButtonListener: () => void;

    constructor(private main: Main){
        let that = this;
        history.pushState("PreventLeavingSite", "");
        window.addEventListener('popstate', (event: PopStateEvent) => {
            if(event.state == "PreventLeavingSite"){
                history.pushState("PreventLeavingSite", "");
                that.main.editor.pushHistoryState(false, that.main.editor.getPositionForHistory());
            } else if(this.oneTimeBackButtonListener == null){
                this.backButtonListener(event);
            }
            if(this.oneTimeBackButtonListener != null){
                this.oneTimeBackButtonListener();
                this.oneTimeBackButtonListener = null;
            }
        });

    }

    registerBackButtonListener(listener: WindowBackButtonListener){
        this.backButtonListener = listener;
    }

    registerOneTimeBackButtonListener(oneTimeBackButtonListener: () => void){
        this.oneTimeBackButtonListener = oneTimeBackButtonListener;
        history.pushState({}, "");
    }



    

}