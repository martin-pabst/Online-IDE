importScripts('../../lib/sql.js/sql-wasm.js', 'sqljsWorkerTools.js');

//@ts-ignore
var initsql = initSqlJs({
    locateFile: name => (self.location + "").replace("js/sqljs-worker/sqljsWorker.js", "") + 'lib/sql.js/' + name
   });
var db;
var SQL;

function worker(event) {
    var buff; var result;
    var data = event.data;
    var config = data["config"] ? data["config"] : {};
    try {
        switch (data && data["action"]) {
            case "open":
                buff = data["buffer"];
                createDb(SQL, buff && new Uint8Array(buff));
                //@ts-ignore
                return postMessage({
                    id: data["id"],
                    ready: true
                });
            case "exec":
                if (db === null) {
                    createDb(SQL, undefined);
                }
                if (!data["sql"]) {
                    throw "exec: Missing query string";
                }
                //@ts-ignore
                return postMessage({
                    id: data["id"],
                    results: db.exec(data["sql"], data["params"], config)
                });
            case "each":
                if (db === null) {
                    createDb(SQL, undefined);
                }
                var callback = function callback(row) {
                    //@ts-ignore
                    return postMessage({
                        id: data["id"],
                        row: row,
                        finished: false
                    });
                };
                var done = function done() {
                    //@ts-ignore
                    return postMessage({
                        id: data["id"],
                        finished: true
                    });
                };
                return db.each(data["sql"], data["params"], callback, done, config);
            case "export":
                buff = db["export"]();
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
                    return postMessage(result);
                } catch (error) {
                    //@ts-ignore
                    return postMessage(result);
                }
            case "close":
                if (db) {
                    db.close();
                }
                //@ts-ignore
                return postMessage({
                    id: data["id"]
                });
            default:
                throw new Error("Invalid action : " + (data && data["action"]));
        }

    } catch (err) {
        
        //@ts-ignore
        return postMessage({
            id: data["id"],
            error: err["message"]
        });
    }

}


self.onmessage = (event) => {
    if (db == null) {
        initsql.then((SQL1) => {
            SQL = SQL1;
            db = createDb(SQL1, undefined);
            worker(event);
        }).catch((err) => {
            console.log(err);
            //@ts-ignore
            return postMessage({
                id: this["data"]["id"],
                error: err["message"]
            });
        })
    } else {
        worker(event);
    }
}
