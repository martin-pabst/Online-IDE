import { Module } from "../../compiler/parser/Module.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType, objectType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { WebSocketRequestConnect, WebSocketRequestDisconnect, WebSocketRequestSendToAll, WebSocketRequestSendToClient, WebSocketResponseOtherClientDisconnected, WebSocketResponseMessage, WebSocketResponseNewClient, WebSocketResponse } from "../../communication/Data.js";
import { WebSocketHelper } from "./WebSocket.js";

export class WebSocketClientClass extends Klass {

    constructor(module: Module) {
        super("WebSocketClient", module, "Ein Objekt der Klasse WebSocketClient repräsentiert einen anderen Rechner, mit dem dieser Rechner über den WebSocket in Kontakt steht.");

        let objectType = <Klass>module.typeStore.getType("Object");
        this.setBaseClass(objectType);

        this.addMethod(new Method("send", new Parameterlist([
            { identifier: "message", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "messageType", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketClientHelper = o.intrinsicData["Helper"];
                let message: string = parameters[1].value;
                let messageType: string = parameters[2].value;

                wh.send(message, messageType);

            }, false, false, 'Sendet Daten (message) an diesen Client. Den messageType kannst Du frei wählen. Die client bekommt ihn zusammen mit den Daten übermittelt. Tipp: Du kannst auch Objekte senden, musst sie dazu aber vorher serialisieren, d.h. mithilfe der Methode toJson in eine Zeichenkette verwandeln.', false));

            this.addMethod(new Method("setUserData", new Parameterlist([
                { identifier: "schlüssel", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
                { identifier: "wert", type: objectType, declaration: null, usagePositions: null, isFinal: true },
            ]), voidPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let wh: WebSocketClientHelper = o.intrinsicData["Helper"];
                    let key: string = parameters[1].value;
                    let value: RuntimeObject = parameters[2].value;
    
                    wh.setUserData(key, value);
    
                }, false, false, 'Mit dieser Methode kannst Du beliebige Objektreferenzen in diesem WebSocketClient-Objekt speichern. Den Schlüssel kannst Du dabei frei wählen und später nutzen, um den Wert durch die Methode getUserData wieder zu holen.', false));
    
            this.addMethod(new Method("getUserData", new Parameterlist([
                { identifier: "schlüssel", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            ]), objectType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let wh: WebSocketClientHelper = o.intrinsicData["Helper"];
                    let key: string = parameters[1].value;
    
                    return wh.getUserData(key);
    
                }, false, false, 'Mit dieser Methode kannst Du eine Objektreferenz erhalten, die Du zuvor mit der Methode setUserData gespeichert hast. Bemerkung1: Diese Methode entfernt die Objekreferenz nicht aus dem WebSocketClient-Objekt. Bemerkung2: Damit Du alle Methoden des erhaltenen Objekts aufrufen kannst, musst Du dem Computer mitteilen, von welcher Klasse es ist ("casten"). Das geht für die Klasse MeineNutzerDaten bspw. so: MeineNutzerDaten mnd = (MeineNutzerDaten)client.getUserData("schlüssel");', false));

            let getterList: { att: string, getter: string, help: string}[] = [{att: "rufname", getter: "getFirstName", help: "Rufnamen"},
             {att: "familienname", getter: "getLastName", help: "Familiennamen"}, 
            {att: "username", getter: "getUsername", help: "Benutzernamen"}, {att: "nickname", getter: "getNickname", help: "Spielernamen"}  ];

            for( let getter of getterList){
                this.addMethod(new Method(getter.getter, new Parameterlist([
                ]), stringPrimitiveType,
                    (parameters) => {
        
                        let o: RuntimeObject = parameters[0].value;
                        let wh: WebSocketClientHelper = o.intrinsicData["Helper"];
        
                        return wh[getter.att];
        
                    }, false, false, 'Gibt den ' + getter.help + " des Clients zurück.", false));

            }

            this.addMethod(new Method("getNumber", new Parameterlist([
            ]), intPrimitiveType,
                (parameters) => {
    
                    let o: RuntimeObject = parameters[0].value;
                    let wh: WebSocketClientHelper = o.intrinsicData["Helper"];
    
                    return wh.index;
    
                }, false, false, 'Gehört ein Client zu einer mit findClient bzw. findClients gefundenen Gruppe, so erhältst Du mit dieser Methode die "Rangfolge" dieses Clients in dieser Gruppe. Allen Clients wird dieselbe Rangfolgeordnung vom Server mitgeteilt. So lässt sich bspw. einfach festlegen, welcher Client eine besondere Rolle (Server) in der Gruppe erhalten soll (z.B. Client mit Nummer 1). Bemerkung: Die Nummer ist eine Zahl zwischen 1 und der Anzahl der Clients in der Gruppe.', false));

    
    }


}

export class WebSocketClientHelper {

    keyValueStore: {[key: string]: RuntimeObject} = {};
    index: number = 0;

    public connected: boolean = true;

    constructor(public runtimeObject: RuntimeObject, private webSocketHelper: WebSocketHelper, 
        private id: number, public rufname: string, public familienname: string, public username: string, public nickname: string) {

    }

    send(message: string, messageType: string){
        this.webSocketHelper.sendToClient(this.id, message, messageType);       
    }

    getUserData(key: string): any {
        return this.keyValueStore[key];
    }

    setUserData(key: string, value: RuntimeObject) {
        this.keyValueStore[key] = value;
    }


}