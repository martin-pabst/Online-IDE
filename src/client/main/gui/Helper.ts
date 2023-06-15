import { Main } from "../Main.js";
import { MainBase } from "../MainBase.js";
import jQuery from "jquery";


export type HelperDirection = "top" | "bottom" | "left" | "right";

export class Helper {

    public static openHelper(text: string, targetElement: JQuery<HTMLElement>, direction: HelperDirection) {

        let $helper = jQuery('.jo_arrow_box'); 
        $helper.removeClass(['jo_arrow_box_left', 'jo_arrow_box_right', 'jo_arrow_box_top', 'jo_arrow_box_bottom']);

        $helper.addClass('jo_arrow_box_' + direction);

        $helper.css({ left: '', right: '', top: '', bottom: '' });

        let to = targetElement.offset();
        let b = jQuery('body');

        let delta: number = 34;

        switch (direction) {
            case "bottom": $helper.css({
                left: to.left + targetElement.width() / 2 - delta,
                bottom: b.height() - to.top + delta
            });
                break;
            case "top": $helper.css({
                left: to.left + targetElement.width() / 2 - delta,
                top: to.top + targetElement.height() + 26
            });
                break;
            case "left": $helper.css({
                left: to.left + targetElement.width() + delta,
                top: to.top + targetElement.height() / 2 - delta
            });
                break;
            case "right": $helper.css({
                right: b.width() - to.left,
                top: to.top + targetElement.height() / 2 - delta
            });
                break;
        }

        $helper.find('span').html(text);

        let $button = $helper.find('.jo_button');
        $button.on('click', (e) => {
            e.stopPropagation();
            $button.off('click');
            Helper.close();
        });

        $helper.fadeIn(800);

    }

    static close() {
        let $helper = jQuery('.jo_arrow_box');
        $helper.fadeOut(800);
    }


    static showHelper(id: string, mainBase: MainBase, $element?: JQuery<HTMLElement>) {

        let main: Main;
        if(mainBase instanceof Main){
            main = mainBase;
        } else {
            return;
        }

        let helperHistory = main.user.settings!.helperHistory;

        if (id == "speedControlHelper" && helperHistory["speedControlHelperDone"]) {
            id = "stepButtonHelper";
        }

        if(id == "spritesheetHelper" && !helperHistory["newFileHelperDone"]){
            return;
        }

        let flag = id + "Done";

        if (helperHistory != null && (helperHistory[flag] == null || !helperHistory[flag])) {
            helperHistory[flag] = true;
            main.networkManager.sendUpdateUserSettings(() => { });

            let text: string = "";
            let direction: HelperDirection = "left";

            switch (id) {
                case "folderButton":
                    text = `Mit diesem Button können Sie in der Liste der Workspaces Ordner anlegen. 
                    <ul>
                    <li>Bestehende Workspaces lassen sich mit der Maus in Ordner ziehen.</li>
                    <li>Wollen Sie einen Workspace in die oberste Ordnerebene bringen, so ziehen Sie ihn einfach auf den "Workspaces"-Balken.</li>
                    <li>Über das Kontextmenü der Ordner lassen sich Workspaces und Unterordner anlegen.</li>
                    </ul>`,
                    direction = "top";
                    break;
                case "repositoryButton":
                    text = `Wenn der aktuelle Workspace mit einem Repository verknüft ist, erscheint hier der "Synchronisieren-Button". Ein Klick darauf öffnet einen Dialog, in dem die Dateien des Workspace mit denen des Repositorys abgeglichen werden können.`;
                    direction = "top";
                    break;
                case "speedControlHelper":
                    text = `Mit dem Geschwindigkeitsregler können  
                            Sie einstellen, wie schnell das Programm abläuft. 
                            Bei Geschwindigkeiten bis 10 Steps/s wird 
                            während des Programmablaufs der Programzeiger gezeigt
                            und die Anzeige der Variablen auf der linken 
                            Seite stets aktualisiert.`;
                    direction = "top";
                    $element = main.interpreter.controlButtons.speedControl.$grip;
                    break;
                case "newFileHelper":
                    text = `Es gibt noch keine Programmdatei im Workspace. <br> Nutzen Sie den Button 
                        <span class='img_add-file-dark jo_inline-image'></span> um eine Programmdatei anzulegen.
                        `;
                    direction = "left";
                    break;
                case "newWorkspaceHelper":
                    text = `Es gibt noch keinen Workspace. <br> Nutzen Sie den Button
                        <span class='img_add-workspace-dark jo_inline-image'></span> um einen Workspace anzulegen.
                        `;
                    direction = "left";
                    break;
                case "homeButtonHelper":
                    text = "Mit dem Home-Button <span class='img_home-dark jo_inline-image'></span> können Sie wieder zu Ihren eigenen Workspaces wechseln.";
                    direction = "top";
                    $element = jQuery('.img_home-dark');
                    break;
                case "stepButtonHelper":
                    text = `Mit den Buttons "Step over"
                        (<span class='img_step-over-dark jo_inline-image'></span>, Taste F8), 
                        "Step into" 
                        (<span class='img_step-into-dark jo_inline-image'></span>, Taste F7) und 
                        "Step out" 
                        (<span class='img_step-out-dark jo_inline-image'></span>, Taste F9)  
                        können Sie das Programm schrittweise ausführen und sich nach jedem Schritt die Belegung der Variablen ansehen. <br>
                        <ul><li><span class='img_step-over-dark jo_inline-image'></span> Step over führt den nächsten Schritt aus, insbesondere werden Methodenaufrufe in einem Schritt durchgeführt.</li>
                        <li><span class='img_step-into-dark jo_inline-image'></span> Step into führt auch den nächsten Schritt aus, geht bei Methodenaufrufen aber in die Methode hinein und führt auch die Anweisungen innerhalb der Methode schrittweise aus.</li>
                        <li><span class='img_step-out-dark jo_inline-image'></span> Befindet sich die Programmausführung innerhalb einer Methode, so bewirkt ein Klick auf Step out, dass der Rest der Methode ausgeführt wird und die Programmausführung erst nach der Aufrufstelle der Methode anhält.</li>
                        </ul>
                        `;
                    direction = "top";
                    $element = main.interpreter.controlButtons.$buttonStepOver;
                    break;
                case "consoleHelper": 
                    text=`
                        Hier können Sie Anweisungen oder Terme eingeben, die nach Bestätigung mit der Enter-Taste ausgeführt/ausgewertet werden. Das Ergebnis sehen Sie im Bereich über der Eingabezeile. <br>
                        Falls das Programm gerade pausiert (z.B. bei Ausführung in Einzelschritten) können Sie auch auf die Variablen des aktuellen Sichtbarkeitsbereiches zugreifen.
                    `;
                    direction = "bottom";
                    $element = main.bottomDiv.console.$consoleTab.find('.jo_monaco-editor');
                    break;
                case "spritesheetHelper":
                    text=`Unter "Sprites -> Spritesheet ergänzen" können Sie eigene png-Grafikdateien hochladen und dann als Sprites verwenden. Die Sprites werden je Workspace bzw. je Repository gespeichert.
                    <br><br>Die Übersicht der fest in die Online-IDE integrierten Sprites finden Sie jetzt nicht mehr im Hilfe-Menü, sondern auch hier unter "Sprites->Sprite-Bilderübersicht".`;
                    direction = "top";
                    $element = jQuery('#mainmenu').find('div:contains("Sprites")');
                    break;
            }

            if (text != "" && $element != null && $element.length > 0) {
                Helper.openHelper(text, $element, direction);
            }

        }

    }



}