import { Main } from "../../main/Main.js";
import { Workspace } from "../../workspace/Workspace.js";
import { makeDiv, SelectItem, getSelectedObject, setSelectItems } from "../../tools/HtmlTools.js";
import { RepositoryUser, GetRepositoryRequest, GetRepositoryResponse, GetRepositoryUserListRequest, GetRepositoryUserListResponse, UserData } from "../../communication/Data.js";
import { ajax } from "../../communication/AjaxHelper.js";




export class RepositoryCreateManager {

    guiReady: boolean = false;

    $mainHeading: JQuery<HTMLDivElement>;
    $settingsDiv: JQuery<HTMLElement>;

    $repoName: JQuery<HTMLInputElement>;
    $repoDescription: JQuery<HTMLTextAreaElement>;
    $repoPublishedTo: JQuery<HTMLSelectElement>;

    $cancelButton: JQuery<HTMLElement>;
    $createButton: JQuery<HTMLElement>;


    publishedToItems: SelectItem[] = [];

    workspace: Workspace;

    constructor(public main: Main) {
    }

    initGUI() {
        this.guiReady = true;
        let that = this;
        let $updateDiv = jQuery('#createRepo-div');

        $updateDiv.append(this.$mainHeading = makeDiv('', "createUpdateRepo-mainHeading"));

        $updateDiv.append(this.$settingsDiv = makeDiv('', "createUpdateRepo-settingsDiv"));

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Name des Repositorys:</div>'));
        this.$settingsDiv.append(this.$repoName = jQuery('<input type="text" class="createUpdateRepo-inputcolumn"></input>'));

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Beschreibung:</div>'));
        this.$settingsDiv.append(this.$repoDescription = jQuery('<textarea class="createUpdateRepo-inputcolumn" style="min-height: 4em"></textarea>'));

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Veröffentlicht für:</div>'));
        this.$settingsDiv.append(this.$repoPublishedTo = jQuery('<select class="createUpdateRepo-inputcolumn"></select>'));

        let $buttonDiv = makeDiv("createRepo-buttonDiv");

        $buttonDiv.append(this.$createButton = makeDiv("", "jo_synchro_button", "Repository erstellen", { "background-color": "var(--createButtonBackground)", "color": "var(--createButtonColor)" }));
        this.$createButton.on("click", () => { that.createButtonClicked() })

        $buttonDiv.append(this.$cancelButton = makeDiv("", "jo_synchro_button", "Abbrechen", { "background-color": "var(--cancelButtonBackground)", "color": "var(--cancelButtonColor)" }));
        this.$cancelButton.on("click", () => { that.cancelButtonClicked() })

        $updateDiv.append($buttonDiv);


    }

    show(workspace: Workspace) {

        this.workspace = workspace;

        if (!this.guiReady) {
            this.initGUI();
        }

        let user = this.main.user;
        let isStudent = !(user.is_admin || user.is_schooladmin || user.is_teacher);

        this.publishedToItems =
            [
                { value: "0", object: 0, caption: "Keine Veröffentlichung (privates Repository)" },
                { value: "1", object: 1, caption: isStudent ? "Veröffentlicht für alle Schüler/innen der Klasse" : "Veröffentlicht für alle Schüler/innen der unterrichteten Klassen" },
                { value: "2", object: 2, caption: "Veröffentlicht für alle Schüler/innen der Schule" },
            ];
        setSelectItems(this.$repoPublishedTo, this.publishedToItems, "0");


        let $synchroDiv = jQuery('#createRepo-div');
        $synchroDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');


        this.initCreateMode(workspace);

        let that = this;
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });

    }

    initCreateMode(workspace: Workspace) {
        let user = this.main.user;

        let userInfo: RepositoryUser = {
            firstName: user.rufname,
            lastName: user.familienname,
            username: user.username,
            user_id: user.id,
            canWrite: true,
            klasse: ""
        }

        this.$mainHeading.text(`Repository anlegen und mit Workspace "${workspace.name}" verknüpfen:`);
        this.$createButton.show();
        this.$repoName.val(workspace.name);
    }

    hide() {
        let $synchroDiv = jQuery('#createRepo-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
    }

    createButtonClicked() {

        let publishedTo: number = getSelectedObject(this.$repoPublishedTo);
        let repoName: string = <string>this.$repoName.val();
        let repoDescription: string = <string>this.$repoDescription.val();

        this.main.networkManager.sendCreateRepository(this.workspace, publishedTo, repoName, repoDescription, (error: string, repository_id?: number) => {
            if (error == null) {
                let projectExplorer = this.main.projectExplorer;
                let element = projectExplorer.workspaceListPanel.findElement(this.workspace);
                projectExplorer.workspaceListPanel.setElementClass(element, "repository");
                this.workspace.renderSynchronizeButton(element);
                projectExplorer.showRepositoryButtonIfNeeded(this.workspace);
                window.history.back(); // close modal window
            } else {
                alert(error);
            }
        });


    }

    cancelButtonClicked() {
        window.history.back(); // close modal window
    }



}