import { ThemeManager } from "./ThemeManager";
import { Main } from "../Main";
import { ViewModes, ViewMode } from "../../communication/Data";

export class ViewModeController {

    $buttonEditorFullscreen: JQuery<HTMLElement>;
    $buttonPresentationMode: JQuery<HTMLElement>;
    $buttonMonitorMode: JQuery<HTMLElement>;

    $buttonMap: { [key: string]: JQuery<HTMLElement> } = {};

    highContrast: boolean = false;
    editorHasFullWidth: boolean = false;

    rightDivWidth: number;
    editorWidth: number;

    constructor(private $buttonsContainer: JQuery<HTMLElement>, private main: Main) {

        this.$buttonEditorFullscreen = jQuery('<div title="Editor in voller Breite" class="img_whole-window jo_button jo_active" style="padding: 1px; margin-right: 8px"></div>');
        this.$buttonPresentationMode = jQuery('<div title="Präsentation (Beamer)" class="img_presentation-mode jo_button jo_active" syle="padding: 1px"></div>');
        this.$buttonMonitorMode = jQuery('<div title="Monitor" class="img_monitor-mode jo_button jo_active" style="margin-left: 5px; padding: 1px"></div>');
        $buttonsContainer.append(this.$buttonEditorFullscreen, this.$buttonPresentationMode, this.$buttonMonitorMode);

        this.$buttonMap = {
            "presentation": this.$buttonPresentationMode,
            "monitor": this.$buttonMonitorMode
        };

        let am = this.main.actionManager;

        am.registerAction("editor.fullwidth", [],
            () => {
                this.toggleEditorFullwidth();
            }, "Editor auf die volle Breite erweitern", this.$buttonEditorFullscreen);

        am.registerAction("viewmode.presentation", [],
            () => {
                this.setMode("presentation");
            }, "Präsentationsansicht", this.$buttonPresentationMode);

        am.registerAction("viewmode.monitor", [],
            () => {
                this.setMode("monitor");
            }, "Monitoransicht", this.$buttonMonitorMode);

    }

    toggleEditorFullwidth() {
        if(this.editorHasFullWidth){
            this.$buttonEditorFullscreen.removeClass('img_whole-window-back');
            this.$buttonEditorFullscreen.addClass('img_whole-window');
            this.$buttonEditorFullscreen.attr('title', 'Editor in voller Breite');
            jQuery('#rightdiv').css('width', this.rightDivWidth + "px");
            jQuery('#editor>.monaco-editor').css('width', this.editorWidth + 'px');

            jQuery('#rightdiv').show(600);
            jQuery('#leftpanel').show(600);
            jQuery('#controls').show();

        } else {
            this.$buttonEditorFullscreen.removeClass('img_whole-window');
            this.$buttonEditorFullscreen.addClass('img_whole-window-back');
            this.$buttonEditorFullscreen.attr('title', 'Editor in normaler Breite');
            
            this.rightDivWidth = Number.parseInt(jQuery('#rightdiv').css('width').replace('px', ''));
            this.editorWidth = Number.parseInt(jQuery('#editor>.monaco-editor').css('width').replace('px', ''));

            jQuery('#rightdiv').hide(600);
            jQuery('#leftpanel').hide(600);
            jQuery('#controls').hide();
            this.main.getInterpreter().stop();
        }

        setTimeout(()=>{
            this.main.getMonacoEditor().layout();
        }, 800);

        this.editorHasFullWidth = !this.editorHasFullWidth;
    }

    setMode(mode: "presentation" | "monitor", saveSettings: boolean = true) {

        let otherMode = mode == "presentation" ? "monitor" : "presentation";

        this.$buttonMap[mode].addClass("jo_pressed");
        this.$buttonMap[otherMode].removeClass("jo_pressed");

        let settings = this.main.user.settings;
        let viewModes = settings.viewModes;

        let viewMode = viewModes[mode];
        viewModes.viewModeChosen = mode;

        this.main.themeManager.switchTheme(viewMode.theme);

        this.main.editor.setFontSize(viewMode.fontSize);

        if (this.highContrast != viewMode.highContrast) {
            let editor = this.main.getMonacoEditor();
            editor.getAction("editor.action.toggleHighContrast").run();
            this.highContrast = !this.highContrast;
        }

        if (saveSettings) this.saveSettings();

    }

    saveFontSize(fontSizePx: number) {
        let viewMode = this.getChosenViewMode();
        viewMode.fontSize = fontSizePx;
        this.saveSettings();
    }

    setTheme(theme: string) {
        let viewMode = this.getChosenViewMode();
        viewMode.theme = theme;
        this.main.themeManager.switchTheme(viewMode.theme);
        this.saveSettings();
    }

    toggleHighContrast() {
        let viewMode = this.getChosenViewMode();
        viewMode.highContrast = !viewMode.highContrast;
        let editor = this.main.getMonacoEditor();
        editor.getAction("editor.action.toggleHighContrast").run();
        this.saveSettings();
    }

    getChosenViewMode(): ViewMode {
        let viewModes = this.main.user.settings.viewModes;
        return viewModes[viewModes.viewModeChosen];
    }

    saveSettings() {
        this.main.userDataDirty = true;
    }

    initViewMode() {
        let settings = this.main.user.settings;

        if (settings["viewModes"] == null) {
            settings["viewModes"] = {
                monitor: null,
                presentation: null,
                viewModeChosen: "monitor"
            }
        }

        if (settings.viewModes.monitor == null) {
            settings.viewModes.monitor = {
                fontSize: 14,
                highContrast: false,
                theme: "dark"
            };

            settings.viewModes.presentation = {
                fontSize: 18,
                highContrast: false,
                theme: "light"
            }
            this.saveSettings();
        }
        this.setMode(settings.viewModes.viewModeChosen, false);
    }


}