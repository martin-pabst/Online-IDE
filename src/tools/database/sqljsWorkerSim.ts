import {createDb} from './sqljsWorkerTools.js';

export class WorkerSim {

    //@ts-ignore
    initsql = initSqlJs({locateFile: (path, scriptDirectory) => "https://embed.learn-sql.de/include/lib/sql.js/sql-wasm.wasm"});
    db;
    SQL;

    onmessage: (event: {data: any}) => void;

    onError: (event: ErrorEvent) => void;

    postMessageToClient(message: any) {
        this.onmessage({data: message})
    }

    postMessage(data: any){
        let that = this;
        if (that.db == null) {
            that.initsql.then((SQL1) => {
                that.SQL = SQL1;
                that.db = createDb(SQL1, undefined);
                that.worker(data);
            }).catch((err) => {
                console.log(err);
                //@ts-ignore
                return that.postMessageToClient({
                    id: this["data"]["id"],
                    error: err["message"]
                });
            })
        } else {
            that.worker(data);
        }
    }

    terminate() {

    }

    worker(data: any) {
        var buff; var result;
        var config = data["config"] ? data["config"] : {};
        try {
            switch (data && data["action"]) {
                case "open":
                    buff = data["buffer"];
                    this.db = createDb(this.SQL, buff && new Uint8Array(buff));
                    //@ts-ignore
                    return this.postMessageToClient({
                        id: data["id"],
                        ready: true
                    });
                case "exec":
                    if (this.db === null) {
                        this.db = createDb(this.SQL, undefined);
                    }
                    if (!data["sql"]) {
                        throw "exec: Missing query string";
                    }
                    //@ts-ignore
                    return this.postMessageToClient({
                        id: data["id"],
                        results: this.db.exec(data["sql"], data["params"], config)
                    });
                case "each":
                    if (this.db === null) {
                        this.db = createDb(this.SQL, undefined);
                    }
                    var callback = function callback(row) {
                        //@ts-ignore
                        return this.postMessage({
                            id: data["id"],
                            row: row,
                            finished: false
                        });
                    };
                    var done = function done() {
                        //@ts-ignore
                        return this.postMessage({
                            id: data["id"],
                            finished: true
                        });
                    };
                    return this.db.each(data["sql"], data["params"], callback, done, config);
                case "export":
                    buff = this.db["export"]();
                    result = {
                        id: data["id"],
                        results: [
                            {
                                buffer: buff
                            }
                        ]
                    };
                    try {
                        //@ts-ignore
                        return this.postMessageToClient(result);
                    } catch (error) {
                        //@ts-ignore
                        return this.postMessageToClient(result);
                    }
                case "close":
                    if (this.db) {
                        this.db.close();
                    }
                    //@ts-ignore
                    return this.postMessageToClient({
                        id: data["id"]
                    });
                default:
                    throw new Error("Invalid action : " + (data && data["action"]));
            }

        } catch (err) {

            //@ts-ignore
            return this.postMessageToClient({
                id: data["id"],
                error: err["message"]
            });
        }

    }


}





