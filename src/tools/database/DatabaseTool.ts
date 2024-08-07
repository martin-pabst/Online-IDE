import { MainBase } from "../../client/main/MainBase.js";
import { WorkerSim } from "./sqljsWorkerSim.js";

export type DatabaseDumpType = "binaryUncompressed" | "binaryCompressed" | "other";

export type DatabaseDirectoryEntry = {
    name: string,
    description: string,
    filename: string
}

export type QueryResult = {
    columns: string[],
    values: any[][],
    buffer?: Uint8Array
}

export type QuerySuccessCallback = (results: QueryResult[]) => void;
export type QueryErrorCallback = (error: string) => void;

export type ColumnStructure = {
    name: string;
    table: TableStructure;

    typeLengths?: number[]; // for varchar(5), ...
    completeTypeSQL: string;

    references?: ColumnStructure;
    referencesRawData?: any[];
    isPrimaryKey: boolean;
    isAutoIncrement: boolean;

    notNull: boolean;
    defaultValue: string;

    dumpValueFunction?: (any) => string
}

export type TableStructure = {
    name: string;
    size: number;
    columns: ColumnStructure[];
    completeSQL: string;
}

export type DatabaseStructure = {
    tables: TableStructure[]
}


export class DatabaseTool {

    databaseDirectoryEntries: DatabaseDirectoryEntry[] = null;

    worker: Worker;

    queryId: number = 0;

    querySuccessCallbacksMap: Map<number, QuerySuccessCallback> = new Map();
    queryErrorCallbackMap: Map<number, QueryErrorCallback> = new Map();

    databaseStructure: DatabaseStructure;

    constructor(private main: MainBase){

    }

    initializeWorker(template: Uint8Array, queries: string[], callbackAfterInitializing?: (error: string) => void) {
        
        this.main.getBottomDiv().console.writeConsoleEntry('Bitte warten, die Datenbank wird initialisiert...', null);
        
            if (this.worker != null) {
            this.worker.terminate();
        }

        let t = performance.now();

        // console.log("Starting worker...");

        let url: string = "worker/sqljs-worker.js"
        if(this.main.isEmbedded()){
            //@ts-ignore
            url = window.javaOnlineDir + url;
        }

        //@ts-ignore
        if(window.jo_doc){
            //@ts-ignore
            this.worker = new WorkerSim();
        } else {
            this.worker = new Worker(url);
        }
        let that = this;

        let error: string;

        this.worker.onmessage = () => {
            // console.log("Database opened (" + (performance.now() - t)/1000 + " s)");
            that.worker.onmessage = event => {

                // console.log(event.data);

                let id = event.data.id;
                if (event.data.error == null) {
                    let querySuccessCallback = that.querySuccessCallbacksMap.get(id);
                    if (querySuccessCallback != null) {
                        querySuccessCallback(event.data.results);
                    }
                } else {
                    let queryErrorCallback = that.queryErrorCallbackMap.get(id);
                    if (queryErrorCallback != null) {
                        queryErrorCallback(event.data.error);
                    }
                }

                // if(event.data.buffer){
                //     console.log(event.data.buffer);
                // }


                this.queryErrorCallbackMap.delete(id);
                this.querySuccessCallbacksMap.delete(id);

            };

            if(queries == null) queries = [];
            queries = queries.slice();
            let queryCount = queries.length;

            let execQuery = () => {
                if (queries.length > 0) {
                    // this.main.getWaitOverlay().setProgress(`${Math.round((1-queries.length/queryCount)*100) + " %"}`)
                    let query = queries.shift();
                    that.executeQuery(query, (result) => {
                        execQuery();
                    }, (error) => {
                        error = ("Error while setting up database: " + error + ", query: " + query);
                        console.log({"error": "Error while setting up database: " + error, "query": query});
                        console.log()
                        execQuery();
                    })
                } else {
                    if (callbackAfterInitializing != null) callbackAfterInitializing(error);
                   
                }
            }

            execQuery();

        };

        this.worker.onerror = (e) => {
            error = ("Worker error: " + e.error);
            console.log("Worker error: " + e.error);
        }

        this.worker.postMessage({
            id: that.queryId++,
            action: "open",
            buffer: template, /*Optional. An ArrayBuffer representing an SQLite Database file*/
        });

    }

    executeQuery(query: string, successCallback: QuerySuccessCallback, errorCallback: QueryErrorCallback) {

        let id = this.queryId++;

        this.querySuccessCallbacksMap.set(id, successCallback);
        this.queryErrorCallbackMap.set(id, errorCallback);

        this.worker.postMessage({
            id: id,
            action: "exec",
            sql: query,
            params: {}
        });

    }

    executeWriteQueries(queries: string[], successCallback: () => void, errorCallback: QueryErrorCallback){

        if(queries.length == 0){
            successCallback()
            return;
        }

        let query = queries.shift();

        this.executeQuery(query, () => {
            this.executeWriteQueries(queries, successCallback, errorCallback);
        }, (message) => {
            this.executeWriteQueries(queries, () => {}, (error) => {});
            errorCallback(message); // report first error
        });

    }

    static getDumpType(dump: Uint8Array): DatabaseDumpType {

        let sqliteMagicBytes: number[] = [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65];
        let zlibMagicByte: number = 0x78;

        let found: boolean = true;
        for (let i = 0; i < sqliteMagicBytes.length; i++) {
            if (sqliteMagicBytes[i] != dump[i]) {
                found = false;
                break;
            }
        }
        if (found) return "binaryUncompressed";

        if (dump[0] == zlibMagicByte) return "binaryCompressed";

        return "other";

    }

    close(){
        if(this.worker != null){
            this.worker.terminate();
            this.worker = null;
        }
    }

}