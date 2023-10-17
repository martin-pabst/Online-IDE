import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, longPrimitiveType, shortPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { BaseModule } from "../compiler/parser/Module.js";
import { Klass, Interface, Visibility } from "../compiler/types/Class.js";
import { Method, Type } from "../compiler/types/Types.js";
import { Enum } from "../compiler/types/Enum.js";
import { getDeclarationAsString } from "../compiler/types/DeclarationHelper.js";
import { defineMyJava } from "../main/gui/MyJava.js";
import jQuery from 'jquery';
import { extractCsrfTokenFromGetRequest } from "../communication/AjaxHelper.js";

export class ApiDoc {
    async start() {

        await extractCsrfTokenFromGetRequest(true);

        this.initEditor();
        this.initTypes();
        this.initClassDocumentation();
    }

    initEditor(){

        defineMyJava();

        monaco.editor.defineTheme('myCustomThemeDark', {
            base: 'vs-dark', // can also be vs-dark or hc-black
            inherit: true, // can also be false to completely replace the builtin rules
            rules: [
                { token: 'method', foreground: 'dcdcaa', fontStyle: 'italic' },
                { token: 'print', foreground: 'dcdcaa', fontStyle: 'italic bold' },
                { token: 'class', foreground: '3DC9B0' },
                { token: 'number', foreground: 'b5cea8' },
                { token: 'type', foreground: '499cd6' },
                { token: 'identifier', foreground: '9cdcfe' },
                { token: 'statement', foreground: 'bb96c0', fontStyle: 'bold' },
                { token: 'keyword', foreground: '68bed4', fontStyle: 'bold' },
                // { token: 'comment.js', foreground: '008800', fontStyle: 'bold italic underline' },
            ],
            colors: {
                "editor.background": "#1e1e1e"
            }
        });

        monaco.editor.setTheme('myCustomThemeDark');

        monaco.editor.create(jQuery('#editordiv')[0], {
            language: "myJava"
        });


    }

    initClassDocumentation() {
        let b = booleanPrimitiveType;
        let basemodule: BaseModule = new BaseModule(null);
        let that = this;

        let typeList = basemodule.typeStore.typeList.filter((a: Type) => a.identifier != null)
            .sort(
                (a: Type, b: Type) => a.identifier.localeCompare(b.identifier));


        typeList.filter((type) => type instanceof Klass && !(type instanceof Enum)).forEach((type: Type, index) => {
            let $menuItem = jQuery('<div class="jo_menu-class">' + type.identifier + '</div>');
            jQuery('#classes').append($menuItem)
            $menuItem.on('click', () => {
                that.showAPIHelp(type);
            })
        });

        typeList.filter((type) => type instanceof Interface).forEach((type: Type, index) => {
            let $menuItem = jQuery('<div class="jo_menu-class">' + type.identifier + '</div>');
            jQuery('#interfaces').append($menuItem)
            $menuItem.on('click', () => {
                that.showAPIHelp(type);
            })
        });

        typeList.filter((type) => type instanceof Enum).forEach((type: Type, index) => {
            let $menuItem = jQuery('<div class="jo_menu-class">' + type.identifier + '</div>');
            jQuery('#enums').append($menuItem)
            $menuItem.on('click', () => {
                that.showAPIHelp(type);
            })
        });


    }

    showAPIHelp(type: Type) {
        let $main = jQuery('#main');
        $main.empty();

        let t = <Klass | Interface | Enum>type;
        let $caption = jQuery('<div class="jo_type"></div>');
        $main.append($caption);
        monaco.editor.colorize(getDeclarationAsString(t, "", true), "myJava", {}).then(
            (html) => {$caption.append(jQuery(html))}
        );

        if(t instanceof Klass) this.showConstructors(t);
        this.showMethods(t);
        if(t instanceof Klass) this.showAttributes(t);

    }

    showConstructors(t: Klass){
        let $main = jQuery('#main');
        $main.append(jQuery('<div class="jo_constructor-heading">Konstruktoren:</div>'));
        let methods = t.methods.filter((m) => m.isConstructor);

        while(methods.length == 0 && t.baseClass != null){
            t = t.baseClass;
            methods = methods.concat(t.getMethods(Visibility.protected).filter((m) => m.isConstructor));
        }

        methods.sort((a, b) => a.identifier.localeCompare(b.identifier));

        if(methods.length == 0){
            $main.append(jQuery('<div class="jo_method">Keine</div>'));
        } else {
            for(let method of methods){
                let $caption = jQuery(jQuery('<div class="jo_method"></div>'));
                $main.append($caption);
                monaco.editor.colorize(getDeclarationAsString(method, "", true), "myJava", {}).then(
                    (html) => {$caption.append(jQuery(html))}
                );

                if(method.documentation != null && method.documentation != ""){
                    $main.append(jQuery('<div class="jo_documentation">' + method.documentation + '</div>'));
                }
            }
        }     
    }

    showMethods(t: Klass | Interface | Enum){
        let $main = jQuery('#main');
        $main.append(jQuery('<div class="jo_method-heading">Methoden:</div>'));
        let methods: Method[];
        if(t instanceof Interface){
            methods = t.methods.slice(0);
        } else {
            methods = t.getMethods(Visibility.protected).filter((m) => !m.isConstructor);
        }
        if(t instanceof Klass && t.staticClass != null){
            methods = methods.concat(t.staticClass.getMethods(Visibility.protected).filter((m) => !m.isConstructor));
        }

        methods.sort((a, b) => a.identifier.localeCompare(b.identifier));

        if(methods.length == 0){
            $main.append(jQuery('<div class="jo_method">Keine</div>'));
        } else {
            for(let method of methods){
                let $caption = jQuery(jQuery('<div class="jo_method"></div>'));
                $main.append($caption);
                monaco.editor.colorize(getDeclarationAsString(method, "", true), "myJava", {}).then(
                    (html) => {$caption.append(jQuery(html))}
                );

                if(method.documentation != null && method.documentation != ""){
                    $main.append(jQuery('<div class="jo_documentation">' + method.documentation + '</div>'));
                }
            }
        }     
    }

    showAttributes(t: Klass){
        let $main = jQuery('#main');
        $main.append(jQuery('<div class="jo_attribute-heading">Attribute:</div>'));
        let attributes = t.getAttributes(Visibility.protected);
        if(t instanceof Klass && t.staticClass != null){
            attributes = attributes.concat(t.staticClass.getAttributes(Visibility.protected));
        }

        attributes.sort((a, b) => a.identifier.localeCompare(b.identifier));

        if(attributes.length == 0){
            $main.append(jQuery('<div class="jo_method">Keine</div>'));
        } else {
            for(let attribute of attributes){
                let $caption = jQuery(jQuery('<div class="jo_method"></div>'));
                $main.append($caption);
                monaco.editor.colorize(getDeclarationAsString(attribute, "", true), "myJava", {}).then(
                    (html) => {$caption.append(jQuery(html))}
                );

                if(attribute.documentation != null && attribute.documentation != ""){
                    $main.append(jQuery('<div class="jo_documentation">' + attribute.documentation + '</div>'));
                }
            }
        }     
    }

    initTypes() {
        voidPrimitiveType.init();
        intPrimitiveType.init();
        longPrimitiveType.init();
        shortPrimitiveType.init();
        floatPrimitiveType.init();
        doublePrimitiveType.init();
        booleanPrimitiveType.init();
        stringPrimitiveType.init();
        charPrimitiveType.init();
    }

}

jQuery(() => { 
    
        //@ts-ignore
        window.require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' } });
        //@ts-ignore
        window.require.config({
            'vs/nls': {
                availableLanguages: {
                    '*': 'de'
                }
            },
            ignoreDuplicateModules: ["vs/editor/editor.main"]
        });
    
        //@ts-ignore
        window.require(['vs/editor/editor.main'], function () {

            new ApiDoc().start(); 
    
            // main.loadWorkspace();
    
    
        });
    
    
    
});