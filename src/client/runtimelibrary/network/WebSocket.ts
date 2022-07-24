import { Module } from "../../compiler/parser/Module.js";
import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Value } from "../../compiler/types/Types.js";
import { Interpreter, InterpreterState } from "../../interpreter/Interpreter.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { WebSocketRequestConnect, WebSocketRequestDisconnect, WebSocketRequestSendToAll, WebSocketRequestSendToClient, WebSocketResponseOtherClientDisconnected, WebSocketResponseMessage, WebSocketResponseNewClient, WebSocketResponse, GetWebSocketTokenResponse, WebSocketResponsePairingFound, WebSocketRequestFindPairing } from "../../communication/Data.js";
import { WebSocketClientHelper } from "./WebSocketClient.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { SystemClass } from "../System.js";
import { ArrayType } from "../../compiler/types/Array.js";

export class WebSocketClass extends Klass {

    constructor(module: Module) {
        super("WebSocket", module, "Ein Objekt der Klasse WebSocket kann Daten über das Internet senden und empfangen. Um die Klasse benutzen zu können, musst Du eine eigene Klasse schreiben, die die Klasse WebSocket erweitert und die Methoden onConnect, onMessage, onOtherClientConnected und onOtherClientDisconnected überschreibt.");

        this.setBaseClass(<Klass>module.typeStore.getType("Object"));
        let webSocketClientType = <Klass>module.typeStore.getType("WebSocketClient");
        let systemClassType = <SystemClass>module.typeStore.getType("System");

        this.addMethod(new Method("WebSocket", new Parameterlist([
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;

                let interpreter = this.module?.main?.getInterpreter();

                let wh = new WebSocketHelper(o, interpreter, webSocketClientType, systemClassType);

                o.intrinsicData["Helper"] = wh;

            }, false, false, 'Instanziert ein neues WebSocket-Objekt.', true));

        this.addMethod(new Method("open", new Parameterlist([
            { identifier: "sessionCode", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "nickName", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let sessionCode: string = parameters[1].value;
                let nickName: string = parameters[2].value;

                let wh: WebSocketHelper = o.intrinsicData["Helper"];
                wh.connect(sessionCode, nickName);

                o.intrinsicData["Helper"] = wh;

            }, false, false, 'Startet die Verbindung mit dem Server. Den SessionCode kannst Du frei wählen. Mit allen anderen Clients, die eine Verbindung mit demselben SessionCode aufbauen, kannst Du anschließend Daten austauschen. Auch der Nickname ist frei wählbar. Er ist für alle anderen Clients sichtbar.',
            false));

        this.addMethod(new Method("sendToAll", new Parameterlist([
            { identifier: "message", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "messageType", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];
                let message: string = parameters[1].value;
                let messageType: string = parameters[2].value;

                wh.sendToAll(message, messageType);

            }, false, false, 'Sendet Daten (message) an alle anderen Clients. Den messageType kannst Du frei wählen. Die empfangenden Clients bekommen ihn zusammen mit den Daten übermittelt. Tipp: Du kannst auch Objekte senden, musst sie dazu aber vorher serialisieren, d.h. mithilfe der Methode toJson in eine Zeichenkette verwandeln.', false));

        this.addMethod(new Method("findClients", new Parameterlist([
            { identifier: "count", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];
                let count: number = parameters[1].value;

                wh.findClientsFromCount(count);

            }, false, false, 'Sucht die übergebene Anzahl von "kontaktbereiten" Clients, d.h. solchen Clients, die exakt dieselbe Suchanfrage abgegeben haben. Findet der Server die Clients, so ruft er bei allen beteiligten Clients onClientsFound auf.', false));

        this.addMethod(new Method("findClients", new Parameterlist([
            { identifier: "nicknames", type: new ArrayType(stringPrimitiveType), declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];
                let nickNamesValues: Value[] = parameters[1].value;

                let nicknames: string[] = nickNamesValues.map((nnv) => nnv.value);

                wh.findClientsFromNicknames(nicknames);

            }, false, false, 'Sucht die Clients mit den angegebenen Nicknames. Haben sie eine entsprechende Suchanfrage (d.h. dieselben Nicknames) abgegeben, so so ruft der Server bei allen beteiligten Clients onClientsFound auf.', false));

        this.addMethod(new Method("findClient", new Parameterlist([
            { identifier: "nickname", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];
                let nickName: string = parameters[1].value;

                wh.findClientsFromNicknames([nickName]);

            }, false, false, 'Sucht den Client mit dem angegebenen Nickname. Hat er eine entsprechende Suchanfrage (d.h. mit dem Nickname DIESES clients) abgegeben, so so ruft der Server bei beiden Clients onClientsFound auf.', false));

        this.addMethod(new Method("close", new Parameterlist([
        ]), voidPrimitiveType,
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];

                wh.disconnect();

            }, false, false, 'Beendet die Verbindung. Bei allen anderen Clients, die sich mit derselben sessionId verbunden haben, wird daraufhin die Methode onOtherClientDisconnected aufgerufen.', false));

        this.addMethod(new Method("onOpen", new Parameterlist([
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, sobald die Verbindung mit dem Server zustandegekommen ist.", false));

        this.addMethod(new Method("onClose", new Parameterlist([
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, nachdem die Verbindung geschlossen wurde.", false));

        this.addMethod(new Method("onMessage", new Parameterlist([
            { identifier: "sender", type: webSocketClientType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "message", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "messageType", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null,
            null, // no statements!
            false, false, "Wird immer dann aufgerufen, wenn eine Nachricht eines anderen Clients empfangen wurde.", false));

        this.addMethod(new Method("onOtherClientConnected", new Parameterlist([
            { identifier: "otherClient", type: webSocketClientType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird immer dann aufgerufen, wenn sich ein anderer Client unter Nutzung desselben sessionCodes mit dem Server verbunden hat.", false));

        this.addMethod(new Method("onOtherClientDisconnected", new Parameterlist([
            { identifier: "otherClient", type: webSocketClientType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird immer dann aufgerufen, wenn ein anderer Client unter Nutzung desselben sessionCodes die Verbindung mit dem Server beendet hat.", false));

        this.addMethod(new Method("onClientsFound", new Parameterlist([
            { identifier: "oherClients", type: new ArrayType(webSocketClientType), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "ownNumber", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null,
            null, // no statements!
            false, false, "Wird aufgerufen, wenn die durch die Methoden findClient bzw. findClients zuvor gesuchten Clients gefunden wurden.", false));

        this.addMethod(new Method("getOtherClients", new Parameterlist([]),
            new ArrayType(webSocketClientType),
            (parameters) => {

                let o: RuntimeObject = parameters[0].value;
                let wh: WebSocketHelper = o.intrinsicData["Helper"];

                let ret = wh.clientList.map(client => {return {type: webSocketClientType, value: client.runtimeObject}});
                
                return ret;

            }, // no statements!
            false, false, "Gibt alle bisher bei der selben Session angemeldeten Clients zurück.", false));

    }


}

export class WebSocketHelper {

    onOpenMethod: Method;
    onCloseMethod: Method;
    onMessageMethod: Method;
    onClientConnectedMethod: Method;
    onClientDisconnectedMethod: Method;
    onClientsFoundMethod: Method;

    clientList: WebSocketClientHelper[] = [];
    idToClientMap: { [id: number]: WebSocketClientHelper } = {};

    connection: WebSocket;
    client_id: number; // own client-id
    isOpen: boolean = false;

    constructor(private runtimeObject: RuntimeObject, private interpreter: Interpreter,
        private webSocketClientType: Klass, private systemClassType: SystemClass) {

        let klass: Klass = <Klass>runtimeObject.class;

        // [[Entries]]:Array(4)
        // 0:{"Test3()" => Method}
        // 1:{"onConnect()" => Method}
        // 2:{"onMessage(WebSocketClient, String, String)" => Method}
        // 3:{"toJson()" => Method}

        this.onOpenMethod = klass.methods.find(m => m.signature == "onOpen()");
        this.onCloseMethod = klass.methods.find(m => m.signature == "onClose()");
        this.onMessageMethod = klass.methods.find(m => m.signature == "onMessage(WebSocketClient, String, String)");
        this.onClientConnectedMethod = klass.methods.find(m => m.signature == "onOtherClientConnected(WebSocketClient)");
        this.onClientDisconnectedMethod = klass.methods.find(m => m.signature == "onOtherClientDisconnected(WebSocketClient)");
        this.onClientsFoundMethod = klass.methods.find(m => m.signature == "onClientsFound(WebSocketClient[], int)");

    }

    connect(sessionCode: string, nickName: string) {

        if(this.interpreter.main.isEmbedded()){
            this.interpreter.throwException("Die Netzwerkfunktionalitäten stehen nur eingeloggten Nutzern in der Entwicklungsumgebung zur Verfügung und können daher leider hier nicht ausprobiert werden.");
            return;
        }


        ajax('getWebSocketToken', {}, (response: GetWebSocketTokenResponse) => {

            let url: string = (window.location.protocol.startsWith("https") ? "wss://" : "ws://") + window.location.host + "/servlet/websocket";
            this.connection = new WebSocket(url);

            this.connection.onerror = (error: Event) => { this.onError(error); }
            this.connection.onclose = (event: CloseEvent) => { this.onClose(event); }
            this.connection.onmessage = (event: MessageEvent) => { this.onMessage(event); }

            this.connection.onopen = (event: Event) => {
                let request: WebSocketRequestConnect = {
                    command: 1,
                    token: response.token,
                    nickname: nickName,
                    sessionCode: sessionCode
                }

                this.interpreter.webSocketsToCloseAfterProgramHalt.push(this.connection);
                this.isOpen = true;
                this.sendIntern(JSON.stringify(request));
                this.onOpen();

            }

        });

    }

    unsentMessages: string[] = [];
    sendIntern(message: string) {

        if (!this.isOpen) {
            this.unsentMessages.push(message);
        } else {
            try {
                this.connection.send(message);
            } catch (exception) {
                console.log(exception);
            }
        }
    }

    onClose(event: CloseEvent) {
        this.isOpen = false;
        this.runMethod(this.onCloseMethod, []);
    }

    sendToClient(clientId: number, data: string, dataType: string) {
        let message: WebSocketRequestSendToClient = {
            command: 3,
            data: data,
            dataType: dataType,
            recipient_id: clientId
        };
        this.sendIntern(JSON.stringify(message));
    }

    sendToAll(data: string, dataType: string) {
        let message: WebSocketRequestSendToAll = {
            command: 2,
            data: data,
            dataType: dataType
        };
        this.sendIntern(JSON.stringify(message));
    }

    disconnect() {
        let message: WebSocketRequestDisconnect = {
            command: 4
        };
        this.sendIntern(JSON.stringify(message));
        this.connection.close();
        let wtr = this.interpreter.webSocketsToCloseAfterProgramHalt;
        wtr.splice(wtr.indexOf(this.connection), 1);
    }

    onMessage(event: MessageEvent) {

        let response: WebSocketResponse = JSON.parse(event.data);
        if (response.command == undefined) return;

        switch (response.command) {
            case 1: // new Client
                let clientRuntimeObject = new RuntimeObject(this.webSocketClientType);
                let wch: WebSocketClientHelper = new WebSocketClientHelper(clientRuntimeObject, this, response.user_id,
                    response.rufname, response.familienname, response.username, response.nickname);
                clientRuntimeObject.intrinsicData["Helper"] = wch;
                this.clientList.push(wch);
                this.idToClientMap[response.user_id] = wch;
                this.runMethod(this.onClientConnectedMethod, [{ type: this.webSocketClientType, value: clientRuntimeObject }]);
                break;
            case 2: // message
                let clientHelper = this.idToClientMap[response.from_client_id];
                if (clientHelper == null) return;
                this.runMethod(this.onMessageMethod, [
                    { type: this.webSocketClientType, value: clientHelper.runtimeObject },
                    { type: stringPrimitiveType, value: response.data },
                    { type: stringPrimitiveType, value: response.dataType }
                ]);
                break;
            case 3: // other client disconnected
                let clientHelper1 = this.idToClientMap[response.disconnecting_client_id];
                if (clientHelper1 == null) return;
                this.clientList.splice(this.clientList.indexOf(clientHelper1), 1);
                this.idToClientMap[response.disconnecting_client_id] = undefined;
                this.runMethod(this.onClientDisconnectedMethod, [
                    { type: this.webSocketClientType, value: clientHelper1.runtimeObject }
                ]);
                break;
            case 4: // time synchronization
                this.systemClassType.deltaTimeMillis = response.currentTimeMills - Date.now();
                this.client_id = response.client_id
                break;
            case 5: // keep alive
                break;
            case 6: // Clients found
                this.onClientsFound(response);
                break;
        }
    }

    onClientsFound(response: WebSocketResponsePairingFound) {
        let own_index: number = 0;
        let otherClients: Value[] = [];

        for (let client of response.clients) {
            if (client.id == this.client_id) {
                own_index = client.index;
            } else {
                let otherClient = this.idToClientMap[client.id];
                if (otherClient != null) {
                    otherClient.index = client.index;
                    otherClients.push({
                        type: this.webSocketClientType,
                        value: otherClient.runtimeObject
                    });
                }
            }
        }

        let arrayValue: Value = {
            type: new ArrayType(this.webSocketClientType),
            value: otherClients
        }

        this.runMethod(this.onClientsFoundMethod, [arrayValue, { type: intPrimitiveType, value: own_index }]);

    }

    onError(error: Event) {
        this.interpreter.throwException("Kommunikationsfehler beim WebSocket");
    }

    onOpen() {
        this.isOpen = true;
        if(this.unsentMessages.length > 0){
            this.unsentMessages.forEach(m => this.sendIntern(m));
            this.unsentMessages = [];
        }
        this.runMethod(this.onOpenMethod, []);
    }

    runMethod(method: Method, stackElements: Value[]) {
        if (method == null) return;
        stackElements.splice(0, 0, {
            type: this.runtimeObject.class,
            value: this.runtimeObject
        });

        if (this.interpreter.state == InterpreterState.waitingForInput || this.interpreter.state == InterpreterState.waitingForDB) {
            this.interpreter.executeImmediatelyInNewStackframe(method.program, stackElements);
        } else {
            this.interpreter.runTimer(method, stackElements, () => { }, false);
        }
    }

    findClientsFromCount(count: number) {
        let message: WebSocketRequestFindPairing = {
            command: 6,
            count: count,
            nicknames: []
        }

        this.sendIntern(JSON.stringify(message));
    }

    findClientsFromNicknames(nicknames: string[]) {
        let message: WebSocketRequestFindPairing = {
            command: 6,
            count: nicknames.length,
            nicknames: nicknames
        }

        this.sendIntern(JSON.stringify(message));
    }


}