import jQuery from 'jquery';
import { ajax } from "../communication/AjaxHelper.js";
import { LoginRequest, LoginResponse, LogoutRequest, TicketLoginRequest, UserData } from "../communication/Data.js";
import { Main } from "./Main.js";
import { Helper } from "./gui/Helper.js";
import { InterpreterState } from "../interpreter/Interpreter.js";
import { SoundTools } from "../tools/SoundTools.js";
import { UserMenu } from "./gui/UserMenu.js";
import { escapeHtml } from "../tools/StringTools.js";
import { SSEManager } from '../communication/SSEManager.js';
import { PruefungManagerForStudents } from './pruefung/PruefungManagerForStudents.js';
import { DatabaseSSEListener } from '../tools/database/DatabaseSSEListener.js';

export class Login {

    constructor(private main: Main) {

    }

    initGUI(isLoginWithTicket: boolean) {

        let that = this;
        if(!isLoginWithTicket){
            jQuery('#login').css('display','flex');
            jQuery('#bitteWarten').css('display','none');
            this.startAnimations();
        }

        let $loginSpinner = jQuery('#login-spinner>img');

        jQuery('#login-username').focus();

        jQuery('#login-username').on('keydown', (e) => {
            if (e.key == "Enter") {
                jQuery('#login-password').focus();
            }
        });

        jQuery('#login-password').on('keydown', (e) => {
            if (e.key == "Enter") {
                jQuery('#login-button').trigger('click');
            }
        });

        jQuery('#login-password').on('keydown', (e) => {
            if (e.key == "Tab") {
                e.preventDefault();
                jQuery('#login-button').focus();
                jQuery('#login-button').addClass('jo_active');
            }
            if (e.key == "Enter") {
                jQuery('#login-button').trigger('click');
            }
        });

        jQuery('#login-button').on('keydown', (e) => {
            if (e.key == "Tab") {
                e.preventDefault();
                jQuery('#login-username').focus();
                jQuery('#login-button').removeClass('jo_active');
            } else {
                jQuery('#login-button').trigger('click');
            }
        });


        jQuery('#jo_testuser-login-button').on('click', () => {
            jQuery('#login-username').val('Testuser');
            jQuery('#login-password').val('');
            jQuery('#login-button').trigger('click');

        })

        // Avoid double login when user does doubleclick:
        let loginHappened = false;
        jQuery('#login-button').on('click', () => {

            SoundTools.init();

            $loginSpinner.show();

            if (loginHappened) return;
            loginHappened = true;

            setTimeout(() => {
                loginHappened = false;
            }, 1000);

            this.sendLoginRequest(null);

        });

        jQuery('#buttonLogout').on('click', () => {

            if(that.main.user.is_testuser){
                that.showLoginForm();
                return;
            }

            this.main.interpreter.closeAllWebsockets();

            jQuery('#bitteWartenText').html('Bitte warten, der letzte Bearbeitungsstand wird noch gespeichert ...');
            jQuery('#bitteWarten').css('display', 'flex');

            if (this.main.workspacesOwnerId != this.main.user.id) {
                this.main.projectExplorer.onHomeButtonClicked();
            }

            this.main.networkManager.sendUpdates(() => {
                
                this.main.pruefungManagerForStudents?.stopPruefung(false);

                this.main.rightDiv.classDiagram.clearAfterLogout();

                let logoutRequest: LogoutRequest = {
                    currentWorkspaceId: this.main.currentWorkspace?.pruefung_id == null ? this.main.currentWorkspace?.id : null
                }

                ajax('logout', logoutRequest, () => {
                    // window.location.href = 'index.html';

                    that.showLoginForm();

                });
            });

            SSEManager.close();
            DatabaseSSEListener.closeSSE();

        });


    }

    sendLoginRequest(ticket: string){
        let that = this;

        let servlet = "login";

        let loginRequest: LoginRequest|TicketLoginRequest = {
            username: <string>jQuery('#login-username').val(),
            password: <string>jQuery('#login-password').val()
        }

        if(ticket != null){
            servlet = "ticketLogin";
            loginRequest = {
                ticket: ticket
            }
        }

        ajax(servlet, loginRequest, (response: LoginResponse) => {

            if (!response.success) {
                jQuery('#login-message').html('Fehler: Benutzername und/oder Passwort ist falsch.');
                jQuery('#login-spinner>img').hide();
            } else {

                // We don't do this anymore for security reasons - see AjaxHelper.ts
                // Alternatively we now set a long expiry interval for cookie.
                // credentials.username = loginRequest.username;
                // credentials.password = loginRequest.password;

                jQuery('#login').hide();
                jQuery('#main').css('visibility', 'visible');

                jQuery('#bitteWartenText').html('Bitte warten ...');
                jQuery('#bitteWarten').css('display', 'flex');

                let user: UserData = response.user;
                user.is_testuser = response.isTestuser;

                if (user.settings == null || user.settings.helperHistory == null) {
                    user.settings = {
                        helperHistory: {
                            consoleHelperDone: false,
                            newFileHelperDone: false,
                            newWorkspaceHelperDone: false,
                            speedControlHelperDone: false,
                            homeButtonHelperDone: false,
                            stepButtonHelperDone: false,
                            repositoryButtonDone: false,
                            folderButtonDone: false
                        },
                        viewModes: null,
                        classDiagram: null
                    }
                }
                
                that.main.user = user;

                this.main.waitForGUICallback = () => {
                    
                    that.main.mainMenu.initGUI(user, "");
                    
                    jQuery('#bitteWarten').hide();
                    let $loginSpinner = jQuery('#login-spinner>img');
                    $loginSpinner.hide();
                    jQuery('#menupanel-username').html(escapeHtml(user.rufname) + " " + escapeHtml(user.familienname));
                    
                    new UserMenu(that.main).init();
                    
                    if (user.is_teacher) {
                        that.main.initTeacherExplorer(response.classdata);
                    }
                    

                    that.main.workspacesOwnerId = user.id;
                    that.main.restoreWorkspaces(response.workspaces, true);

                    that.main.networkManager.initializeTimer();

                    that.main.projectExplorer.fileListPanel.setFixed(!user.is_teacher);
                    that.main.projectExplorer.workspaceListPanel.setFixed(!user.is_teacher);

                    that.main.rightDiv?.classDiagram?.clear();

                    if (user.settings.classDiagram != null) {
                        that.main.rightDiv?.classDiagram?.deserialize(user.settings.classDiagram);
                    }

                    that.main.viewModeController.initViewMode();
                    that.main.bottomDiv.hideHomeworkTab();
                    
                    if (!this.main.user.settings.helperHistory.folderButtonDone && that.main.projectExplorer.workspaceListPanel.elements.length > 5) {
                        
                        Helper.showHelper("folderButton", this.main, jQuery('.img_add-folder-dark'));
        
                    }
        
                    that.main.networkManager.initializeSSE();

                    this.main.pruefungManagerForStudents?.close();

                    if(!user.is_teacher && !user.is_admin && !user.is_schooladmin){
                        this.main.pruefungManagerForStudents = new PruefungManagerForStudents(this.main);
                        if(response.activePruefung != null){

                            let workspaceData = this.main.workspaceList.filter(w => w.pruefung_id == response.activePruefung.id)[0].getWorkspaceData(true);

                            this.main.pruefungManagerForStudents.startPruefung(response.activePruefung);
                        }
                    }
    

                }

                if (this.main.startupComplete == 0) {
                    this.main.waitForGUICallback();
                    this.main.waitForGUICallback = null;
                }

            }

        }, (errorMessage: string) => {
            jQuery('#login-message').html('Login gescheitert: ' + errorMessage);
            jQuery('#login-spinner>img').hide();
        }
        );

    }

    loginWithTicket(ticket: string) {
        jQuery('#login').hide();
        jQuery('#main').css('visibility', 'visible');

        jQuery('#bitteWartenText').html('Bitte warten ...');
        jQuery('#bitteWarten').css('display', 'flex');
        this.sendLoginRequest(ticket);

    }


    private showLoginForm(){
        jQuery('#login').show();
        jQuery('#main').css('visibility', 'hidden');
        jQuery('#bitteWarten').css('display', 'none');
        jQuery('#login-message').empty();
        this.main.interpreter.setState(InterpreterState.not_initialized);
        this.main.getMonacoEditor().setModel(monaco.editor.createModel("", "myJava"));
        this.main.projectExplorer.fileListPanel.clear();
        this.main.projectExplorer.fileListPanel.setCaption('');
        this.main.projectExplorer.workspaceListPanel.clear();
        this.main.bottomDiv?.console?.clear();
        this.main.interpreter.printManager.clear();

        if (this.main.teacherExplorer != null) {
            this.main.teacherExplorer.removePanels();
            this.main.teacherExplorer = null;
        }

        this.main.currentWorkspace = null;
        this.main.user = null;

    }


    startAnimations() {
        // let $loginAnimationDiv = $('#jo_login_animations');
        // $loginAnimationDiv.empty();


        // let $gifAnimation = $('<img src="assets/startpage/code_1.gif" class="jo_gif_animation">');
        // $loginAnimationDiv.append($gifAnimation);
        
        // let left = Math.trunc(Math.random()*(screen.width - 400)) + "px";
        // let top = Math.trunc(Math.random()*(screen.height - 400)) + "px";

        // $gifAnimation.css({
        //     "left": left,
        //     "top": top
        // })
    }


}