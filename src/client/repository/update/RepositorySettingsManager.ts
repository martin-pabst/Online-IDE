import { Main } from "../../main/Main.js";
import { Workspace } from "../../workspace/Workspace.js";
import { makeDiv, SelectItem, setSelectItems, getSelectedObject, openContextMenu } from "../../tools/HtmlTools.js";
import { RepositoryUser, GetRepositoryRequest, GetRepositoryResponse, GetRepositoryUserListRequest, GetRepositoryUserListResponse, UserData, GetRepositoryListRequest, GetRepositoryListResponse, RepositoryInfo, UpdateRepositoryRequest, UpdateRepositoryResponse, RepositoryUserWriteAccessData, UpdateRepositoryUserWriteAccessRequest, UpdateRepositoryUserWriteAccessResponse, DeleteRepositoryRequest } from "../../communication/Data.js";
import { ajax } from "../../communication/AjaxHelper.js";


export class RepositorySettingsManager {

    guiReady: boolean = false;

    $mainHeading: JQuery<HTMLDivElement>;

    $settingsDiv: JQuery<HTMLElement>;
    $repoName: JQuery<HTMLInputElement>;
    $repoDescription: JQuery<HTMLTextAreaElement>;
    $repoPublishedTo: JQuery<HTMLSelectElement>;
    $repoOwner: JQuery<HTMLSelectElement>;

    $repoListDiv: JQuery<HTMLElement>;

    $userlistDiv: JQuery<HTMLElement>;

    $exitButton: JQuery<HTMLElement>;
    $saveButton: JQuery<HTMLElement>;
    $deleteButton: JQuery<HTMLElement>;

    publishedToItems: SelectItem[] = [];

    repositoryOwnerItems: SelectItem[] = [];

    users: RepositoryUser[] = [];

    workspace: Workspace;

    constructor(public main: Main) {
    }

    initGUI() {
        this.guiReady = true;
        let that = this;
        let $updateDiv = jQuery('#updateRepo-div');

        $updateDiv.append(this.$mainHeading = makeDiv('updateRepo-mainHeading', "createUpdateRepo-mainHeading", ""));
        this.$mainHeading.append(makeDiv("", "", "Repositories verwalten"));
        this.$mainHeading.append(this.$exitButton = makeDiv("", "jo_synchro_button", "Zurück zum Programmieren", { "background-color": "var(--speedcontrol-grip)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$exitButton.on("click", () => { that.exitButtonClicked() })


        let $divBelow = makeDiv("updateRepo-divBelow");
        $updateDiv.append($divBelow);

        let $divLeft = makeDiv("updateRepo-divLeft");
        $divBelow.append($divLeft);

        $divLeft.append(makeDiv('', 'updateRepo-minorHeading', 'Repositories:'));

        this.$repoListDiv = makeDiv("updateRepo-repoListDiv");
        $divLeft.append(this.$repoListDiv);

        let $rightDiv = makeDiv("updateRepo-divRight");
        $divBelow.append($rightDiv);

        this.$settingsDiv = makeDiv("", "createUpdateRepo-settingsDiv");
        $rightDiv.append(this.$settingsDiv);

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Name des Repositorys:</div>'));
        this.$settingsDiv.append(this.$repoName = jQuery('<input type="text" class="createUpdateRepo-inputcolumn"></input>'));
        this.$repoName.on("input", () => { that.enableSaveButton() });

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Beschreibung:</div>'));
        this.$settingsDiv.append(this.$repoDescription = jQuery('<textarea class="createUpdateRepo-inputcolumn" style="min-height: 4em"></textarea>'));
        this.$repoDescription.on("input", () => { that.enableSaveButton() });


        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Veröffentlicht für:</div>'));
        this.$settingsDiv.append(this.$repoPublishedTo = jQuery('<select class="createUpdateRepo-inputcolumn"></select>'));
        this.$repoPublishedTo.on("change", () => { that.enableSaveButton() });

        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Eigentümer:</div>'));
        this.$settingsDiv.append(this.$repoOwner = jQuery('<select class="createUpdateRepo-inputcolumn"></select>'));
        this.$repoOwner.on("change", () => { that.enableSaveButton() });

        $rightDiv.append(this.$userlistDiv = makeDiv("updateRepo-userlistDiv"));

        this.$userlistDiv.append(makeDiv(null, "updateRepo-userlistheading", "Benutzer, die das Repository nutzen", { "grid-column": 1 }))
        this.$userlistDiv.append(makeDiv(null, "updateRepo-userlistheading", "Schreibberechtigung", { "grid-column": 2 }))

        let $buttonDiv = makeDiv("updateRepo-buttonDiv");

        $buttonDiv.append(this.$saveButton = makeDiv("", "jo_synchro_button", "Änderungen speichern", { "background-color": "var(--updateButtonBackground)", "color": "var(--updateButtonColor)" }));
        this.$saveButton.on("click", () => { that.saveButtonClicked() })
        this.$saveButton.hide();

        $rightDiv.append($buttonDiv);

    }

    enableSaveButton() {
        this.$saveButton.show();
    }

    show(repository_id: number) {

        if (!this.guiReady) {
            this.initGUI();
        }

        let $synchroDiv = jQuery('#updateRepo-div');
        $synchroDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');

        let user = this.main.user;
        let is_student = !(user.is_teacher || user.is_admin || user.is_schooladmin);

        this.publishedToItems = [
            { value: 0, object: 0, caption: "Keine Veröffentlichung (privates Repository)" },
            { value: 1, object: 1, caption: is_student ? "Veröffentlicht für alle Schüler/innen der Klasse" : "Veröffentlicht für alle Schüler/innen der unterrichteten Klassen" },
            { value: 2, object: 2, caption: "Veröffentlicht für alle Schüler/innen der Schule" },
        ];

        setSelectItems(this.$repoPublishedTo, this.publishedToItems, 0);

        this.$saveButton.show();

        this.showRepositoryList();

        let that = this;

        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });

    }

    deleteRepository(repInfo: RepositoryInfo) {

        let that = this;
        let request: DeleteRepositoryRequest = { repository_id: repInfo.id };
        ajax('deleteRepository', request, () => {
            that.showRepositoryList();
        });

    }

    showRepositoryList() {
        this.emptyRepositoryInfo();
        let grlq: GetRepositoryListRequest = {
            onlyOwnRepositories: true
        }

        this.$repoListDiv.empty();
        let that = this;
        ajax('getRepositoryList', grlq, (response: GetRepositoryListResponse) => {

            let $firstDiv: JQuery<HTMLDivElement>;
            let firstRepInfo: RepositoryInfo;

            if(response.repositories.length == 0){
                alert('Sie haben noch keine Repositories, und\nkönnen daher keine verwalten.\nTipp: Ein Repository können Sie durch Rechtsklick auf einen Workspace anlegen.');
                that.exitButtonClicked();
                return;
            }

            response.repositories.forEach(repInfo => {
                let $div = makeDiv('', 'updateRepo-repoListItem');
                let $namediv = makeDiv('', '', repInfo.name);
                let $deleteDiv = jQuery('<div class="img_delete jo_button jo_active" title="Repository löschen..."></div>');
                $div.append($namediv, $deleteDiv);
                this.$repoListDiv.append($div);
                $div.on('click', (e) => {
                    that.selectRepository($div, repInfo);
                })
                $div.data('repoInfo', repInfo);
                if (firstRepInfo == null) {
                    firstRepInfo = repInfo;
                    $firstDiv = $div;
                }

                $deleteDiv.on("click", (ev) => {
                    ev.preventDefault();
                    openContextMenu([{
                        caption: "Abbrechen",
                        callback: () => { }
                    }, {
                        caption: "Ich bin mir sicher: löschen!",
                        color: "#ff6060",
                        callback: () => {
                            that.deleteRepository(repInfo);
                        }
                    }], ev.pageX + 2, ev.pageY + 2);
                    ev.stopPropagation();
                });
            });

            if ($firstDiv != null) {
                this.selectRepository($firstDiv, firstRepInfo);
            }

        }, (message) => {
            console.log(message);
            alert('Sie haben noch keine Repositories, und\nkönnen daher keine verwalten.\nTipp: Ein Repository können Sie durch Rechtsklick auf einen Workspace anlegen.');
            that.exitButtonClicked();
            return;
        });
    }

    selectRepository($repoDiv: JQuery<HTMLDivElement>, repInfo: RepositoryInfo) {
        this.emptyRepositoryInfo();
        if (this.$saveButton.is(":visible")) {
            let selectedItem = this.$repoListDiv.find('.active').first();
            let repoData: RepositoryInfo = <any>selectedItem.data('repoInfo');
            if (repoData) {
                alert(`Deine Änderungen am Repository "${repoData.name}" wurden nicht gespeichert.`);
            }
        }

        this.$saveButton.hide();
        this.$repoListDiv.find('.updateRepo-repoListItem').removeClass('active');
        $repoDiv.addClass('active');
        this.$repoName.val(repInfo.name);
        this.$repoDescription.val(repInfo.description);
        this.$repoPublishedTo.val(repInfo.published_to);

        this.$repoOwner.empty();
        this.$userlistDiv.children().not('.updateRepo-userlistheading').remove();

        let req: GetRepositoryUserListRequest = { repository_id: repInfo.id };
        let that = this;

        ajax('getRepositoryUserList', req, (response: GetRepositoryUserListResponse) => {

            response.repositoryUserList.forEach(userData => {

                let $userDiv = makeDiv("", "updateRepo-userDiv", `${userData.firstName} ${userData.lastName} (${userData.username})`, { 'grid-column': 1 });

                let $canWriteDiv = makeDiv("", "canWriteDiv", "", { 'grid-column': 2 });
                let $canWriteCheckBox = jQuery('<input type="checkbox">');
                $canWriteDiv.append($canWriteCheckBox);

                //@ts-ignore
                $canWriteCheckBox.attr('checked', userData.canWrite);
                $canWriteCheckBox.data('user', userData);
                $canWriteCheckBox.on("change", () => { that.enableSaveButton() });

                that.$userlistDiv.append($userDiv, $canWriteDiv);
            });

            that.$repoOwner.empty();
            setSelectItems(that.$repoOwner, response.repositoryUserList.map(userData => {
                let se: SelectItem = {
                    caption: `${userData.firstName} ${userData.lastName} (${userData.username})`,
                    object: userData,
                    value: userData.user_id + ""
                }
                return se;
            }), repInfo.owner_id + "")

        });

    }

    emptyRepositoryInfo() {
        this.$repoOwner.empty();
        this.$repoName.val('');
        this.$repoDescription.val('');
        this.$userlistDiv.find('.updateRepo-userDiv').remove();
        this.$userlistDiv.find('.canWriteDiv').remove();
    }

    hide() {
        let $synchroDiv = jQuery('#updateRepo-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
    }

    saveButtonClicked() {

        let that = this;

        let selectedItem = this.$repoListDiv.find('.active').first();
        let repoData: RepositoryInfo = <any>selectedItem.data('repoInfo');

        let name: string = <string>this.$repoName.val();
        let owner: RepositoryUser = getSelectedObject(this.$repoOwner);
        let published_to: number = getSelectedObject(this.$repoPublishedTo);

        let updateRepositoryRequest: UpdateRepositoryRequest = {
            owner_id: owner.user_id,
            description: <string>this.$repoDescription.val(),
            published_to: published_to,
            repository_id: repoData.id,
            name: name
        };


        // update user write access:

        let writeAccessList: RepositoryUserWriteAccessData[] = [];

        that.$userlistDiv.find('input').each((index, element) => {
            let $element = jQuery(element);
            let user: RepositoryUser = <any>$element.data('user');
            writeAccessList.push({
                has_write_access: <any>jQuery(element).is(':checked'),
                user_id: user.user_id
            });
        });

        let request: UpdateRepositoryUserWriteAccessRequest = {
            repository_id: repoData.id,
            writeAccessList: writeAccessList
        }

        if (repoData.owner_id == owner.user_id || 
              confirm("Soll die Eigentümerschaft über das Repository " + repoData.name + " wirklich an " + owner.firstName + " " + owner.lastName + " übertragen werden?")) {
            ajax('updateRepositoryUserWriteAccess', request, (response: UpdateRepositoryUserWriteAccessResponse) => {


                ajax("updateRepository", updateRepositoryRequest, (response: UpdateRepositoryResponse) => {

                    repoData.name = name;
                    repoData.owner_id = owner.user_id;
                    repoData.owner_name = owner.firstName + " " + owner.lastName;
                    repoData.owner_username = owner.username;
                    repoData.published_to = published_to;
                    repoData.description = updateRepositoryRequest.description;

                    alert('Die Änderungen wurden erfolgreich gespeichert.')
                    that.$saveButton.hide();
                    that.showRepositoryList();


                }, (errorMessage: string) => {
                    alert("Fehler: " + errorMessage);
                    that.exitButtonClicked();
                });

            }, (errorMessage: string) => {
                alert("Fehler: " + errorMessage);
                that.exitButtonClicked();
            }
            );
        } else {
            alert("Der Speichervorgang wurde nicht durchgeführt.");
        }
    }


    exitButtonClicked() {
        window.history.back();
    }


}