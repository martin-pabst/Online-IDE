import { Main } from "../client/main/Main.js";

export class GamepadTool {

    gamepads: Gamepad[] = [];

    constructor(){
        let that = this;
        window.addEventListener("gamepadconnected", function(e: GamepadEvent) {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
              e.gamepad.index, e.gamepad.id,
              e.gamepad.buttons.length, e.gamepad.axes.length);
              if(that.gamepads.indexOf(e.gamepad) < 0){
                  that.gamepads.push(e.gamepad);
              }
          });

          window.addEventListener("gamepaddisconnected", function(e: GamepadEvent) {
            console.log("Gamepad disconnected from index %d: %s",
              e.gamepad.index, e.gamepad.id);
              let i = that.gamepads.indexOf(e.gamepad);
              if(i >= 0){
                that.gamepads.splice(i, 1);
            }
        });
    }

    isGamepadButtonPressed(gamepadIndex: number, buttonIndex: number): boolean{
        let gp: Gamepad = navigator.getGamepads()[gamepadIndex];
        if(gp == null) return false;
        let button = gp.buttons[buttonIndex];
        if(button){
            // return typeof(button) == "object" ? button.pressed : (button == 1.0);
            return button.pressed;
        } else {return false;}
    }

    getGamepadAxisValue(gamepadIndex: number, axisIndex: number): number {
        let gp: Gamepad = navigator.getGamepads()[gamepadIndex];
        if(gp == null) return 0;
        return gp.axes[axisIndex];
    }

    isGamepadConnected(gamepadIndex: number){
        return navigator.getGamepads()[gamepadIndex] != null;
    }

}