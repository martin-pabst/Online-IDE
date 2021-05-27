import { Main } from "../../main/Main.js";
import { Workspace } from "../../workspace/Workspace.js";
import { makeDiv, SelectItem, setSelectItems, getSelectedObject } from "../../tools/HtmlTools.js";
import { RepositoryUser, GetRepositoryRequest, GetRepositoryResponse, GetRepositoryUserListRequest, GetRepositoryUserListResponse, UserData, GetRepositoryListRequest, GetRepositoryListResponse, RepositoryInfo, UpdateRepositoryRequest, UpdateRepositoryResponse, AttachWorkspaceToRepositoryRequest, WorkspaceData, AttachWorkspaceToRepositoryResponse } from "../../communication/Data.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { TeachersWithClassesMI } from "../../administration/TeachersWithClasses.js";
import { ProjectExplorer } from "../../main/gui/ProjectExplorer.js";


export class RepositoryCheckoutManager {

    guiReady: boolean = false;

    $mainHeading: JQuery<HTMLDivElement>;

    $repoListDiv: JQuery<HTMLElement>;

    $exitButton: JQuery<HTMLElement>;
    $checkoutButton: JQuery<HTMLElement>;

    $workspaceDropdown: JQuery<HTMLSelectElement>;
    $filterButtonDiv: JQuery<HTMLElement>;
    $filterInput: JQuery<HTMLInputElement>;

    filterbuttonOptions = ["alle", "private", "für die Klasse freigegebene", "für die Schule freigegebene"];

    workspace: Workspace;

    repositories: RepositoryInfo[] = [];

    constructor(public main: Main) {
    }

    initGUI() {
        this.guiReady = true;
        let that = this;
        let $checkoutDiv = jQuery('#checkoutRepo-div');

        $checkoutDiv.append(this.$mainHeading = makeDiv('checkoutRepo-mainHeading', "createUpdateRepo-mainHeading", ""));
        this.$mainHeading.append(makeDiv("", "", "Checkout Repository - Workspace mit Repository verbinden"));
        this.$mainHeading.append(this.$exitButton = makeDiv("", "jo_synchro_button", "Zurück zum Programmieren", { "background-color": "var(--speedcontrol-grip)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$exitButton.on("click", () => { that.exitButtonClicked() })


        let $divBelow = makeDiv("checkoutRepo-divBelow");
        $checkoutDiv.append($divBelow);

        let $chooseWorkspaceDiv = makeDiv("", "checkoutRepo-chooseDiv");
        $divBelow.append($chooseWorkspaceDiv);
        $chooseWorkspaceDiv.append(makeDiv("", "checkoutRepo-minorHeading", "Diesen Worspace mit dem Repository verbinden:"));
        this.$workspaceDropdown = jQuery('<select></select>');
        $chooseWorkspaceDiv.append(this.$workspaceDropdown);

        let $publishedToFilterDiv = makeDiv("", "checkoutRepo-chooseDiv");
        $divBelow.append($publishedToFilterDiv);
        $publishedToFilterDiv.append(makeDiv("", "checkoutRepo-minorHeading", "Diese Repositories anzeigen:"));
        this.$filterButtonDiv = jQuery('<fieldset></fieldset>');
        $publishedToFilterDiv.append(this.$filterButtonDiv);

        this.filterbuttonOptions.forEach((value, index) => {
            let $radioButton = jQuery(`<input type="radio" id="b${index}" name="publishedFilter" value="${index}" ${index == 0 ? "checked" : ""}>`);
            $radioButton.data('value', index);
            $radioButton.on("change", (e) => {
                that.showRepositories();
            })
            this.$filterButtonDiv.append($radioButton);
            this.$filterButtonDiv.append(jQuery(`<label for="b${index}">${value}</label>`));
        })

        let $inputFilterDiv = makeDiv("", "checkoutRepo-chooseDiv");
        $divBelow.append($inputFilterDiv);
        $inputFilterDiv.append(makeDiv("", "checkoutRepo-minorHeading", "Filter/Suche:"));
        this.$filterInput = jQuery('<input type="text"></input>');
        $inputFilterDiv.append(this.$filterInput);

        this.$filterInput.on("input", (e) => {
            that.showRepositories();
        });

        $divBelow.append(makeDiv('', 'updateRepo-minorHeading', 'Repositories:', {'margin-bottom': '10px', 'margin-top': '20px'}));

        this.$repoListDiv = makeDiv('checkoutRepo-repoListDiv', 'jo_scrollable');
        $divBelow.append(this.$repoListDiv);

        let $buttonDiv = makeDiv("updateRepo-buttonDiv");

        $buttonDiv.append(this.$checkoutButton = makeDiv("", "jo_synchro_button", "Checkout", { "background-color": "var(--updateButtonBackground)", "color": "var(--updateButtonColor)" }));
        this.$checkoutButton.on("click", () => { that.checkoutButtonClicked() })

        $divBelow.append($buttonDiv);

    }

    show(workspace: Workspace) {

        if (!this.guiReady) {
            this.initGUI();
        }

        let $checkoutDiv = jQuery('#checkoutRepo-div');
        $checkoutDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');

        let user = this.main.user;

        let grlq: GetRepositoryListRequest = {
            onlyOwnRepositories: false
        }

        this.$repoListDiv.empty();
        let that = this;
        ajax('getRepositoryList', grlq, (response: GetRepositoryListResponse) => {

            this.repositories = response.repositories;

            this.showRepositories();

        });

        // Init Workspace-Dropdown
        this.$workspaceDropdown.empty();
        setSelectItems(this.$workspaceDropdown, [{
            caption: "Neuen Workspace erstellen",
            object: null,
            value: -1
        }].concat(this.main.workspaceList.filter(ws => ws.repository_id == null).map(ws => {
            return {
                caption: ws.name,
                object: ws,
                value: ws.id
            }
        }))
        , -1);

        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });

    }


    showRepositories(){

        let that = this;

        this.$repoListDiv.find('.checkoutRepo-repoListItem').remove();

        let published_to = this.$filterButtonDiv.find('input:checked').data('value') - 1;

        let filteredRepositories: RepositoryInfo[] = published_to < 0 ? this.repositories :
            this.repositories.filter(repoInfo => repoInfo.published_to == published_to);

        let filterSearch: string = <string>this.$filterInput.val();
        filterSearch = filterSearch.toLocaleLowerCase();

        if(filterSearch != ""){
            filteredRepositories = filteredRepositories.filter(
                repInfo => [repInfo.owner_username , repInfo.owner_name , repInfo.name , repInfo.description].join(" ").toLocaleLowerCase().indexOf(filterSearch) >= 0
            )
        }

        filteredRepositories.forEach(repInfo => {
            let $div = makeDiv('', 'checkoutRepo-repoListItem');
            let $divLeft = makeDiv('', 'checkoutRepo-repoListItemLeft');
            $div.append($divLeft);

            $divLeft.append(makeDiv('', 'checkoutRepo-repoListName', repInfo.name));
            $divLeft.append(makeDiv('', 'checkoutRepo-repoListOwner', repInfo.owner_name + " (" + repInfo.owner_username + ")"));

            let $divRight = makeDiv('', 'checkoutRepo-repoListItemRight', repInfo.description);
            $div.append($divRight);

            this.$repoListDiv.append($div);
            $div.data('repoInfo', repInfo);
            $div.on("click", () => {
                that.selectRepository($div, repInfo);
            })
        });

        this.selectFirstRepository();

    }

    selectRepository($repoDiv: JQuery<HTMLDivElement>, repInfo: RepositoryInfo) {
        this.$repoListDiv.find('.checkoutRepo-repoListItem').removeClass('active');
        if($repoDiv != null){
            $repoDiv.addClass('active');
        }
    }

    selectFirstRepository(){
        this.$repoListDiv.find('.checkoutRepo-repoListItem').removeClass('active');
        this.$repoListDiv.find('.checkoutRepo-repoListItem').first().addClass('active');
    }

    hide() {
        let $synchroDiv = jQuery('#checkoutRepo-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
    }

    checkoutButtonClicked() {
        let selectedItem = this.$repoListDiv.find('.active').first();
        let repoData: RepositoryInfo = <any>selectedItem.data('repoInfo');

        let workspace: Workspace = getSelectedObject(this.$workspaceDropdown);

        let request: AttachWorkspaceToRepositoryRequest = {
            repository_id: repoData.id,
            createNewWorkspace: workspace == null,
            workspace_id: workspace == null ? null : workspace.id
        }

        let that = this;
        ajax('attachWorkspaceToRepository', request, (response: AttachWorkspaceToRepositoryResponse) => {

            if(workspace == null && response.new_workspace != null){

                let newWorkspace = that.main.networkManager.createNewWorkspaceFromWorkspaceData(response.new_workspace);
                that.main.projectExplorer.workspaceListPanel.sortElements();
                that.main.projectExplorer.workspaceListPanel.select(newWorkspace, false, true);

                alert('Der neue Workspace ' + response.new_workspace.name + " wurde erfolgreich angelegt.");

            } else {

                workspace.repository_id = repoData.id;
                let explorer = that.main.projectExplorer;
                explorer.workspaceListPanel.setElementClass(workspace.panelElement, "repository");
                alert(`Der Workspace ${workspace.name} wurde erfolgreich mit dem Repository ${repoData.name} verknüpft.`);

            }

            window.history.back();

        });

        // let updateRepositoryRequest: UpdateRepositoryRequest = {
        //     owner_id: owner.user_id,
        //     description: <string>this.$repoDescription.val(),
        //     published_to: published_to,
        //     repository_id: repoData.id
        // };

        // ajax("updateRepository", updateRepositoryRequest, (response: UpdateRepositoryResponse) => {

        //     //TODO: update user write access..


        // });



    }


    exitButtonClicked() {
        this.hide();
    }


}