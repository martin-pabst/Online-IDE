//@ts-ignore
importScripts('../lib/sql.js/sql-wasm.js');

//@ts-ignore
var initsql = initSqlJs({
    locateFile: name => (self.location + "").replace("worker/sqljs-worker.js", "") + 'lib/sql.js/' + name
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
                id: (<any>this)["data"]["id"],
                error: err["message"]
            });
        })
    } else {
        worker(event);
    }
}

function createDb(SQL, buffer) {

    db = new SQL.Database(buffer);

    db.create_function("isDate", function (inputText) {

        if (inputText == null) return true;
        if (typeof inputText != 'string') return false;

        // var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        var dateformat = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;
        // Match the date format through regular expression
        if (inputText.match(dateformat)) {
            //Test which seperator is used '/' or '-'
            var opera1 = inputText.split('/');
            var opera2 = inputText.split('-');
            var lopera1 = opera1.length;
            var lopera2 = opera2.length;
            // Extract the string into month, date and year
            if (lopera1 > 1) {
                var pdate = inputText.split('/');
            }
            else if (lopera2 > 1) {
                var pdate = inputText.split('-');
            }
            if (pdate.length != 3) return false;
            var dd = parseInt(pdate[2]);
            var mm = parseInt(pdate[1]);
            var yy = parseInt(pdate[0]);
            // Create list of days of a month [assume there is no leap year by default]
            var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (mm == 1 || mm > 2) {
                if (dd > ListofDays[mm - 1]) {
                    return false;
                }
            }
            if (mm == 2) {
                var lyear = false;
                if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
                    lyear = true;
                }
                if ((lyear == false) && (dd >= 29)) {
                    return false;
                }
                if ((lyear == true) && (dd > 29)) {
                    return false;
                }
                return true;
            }

            return true;

        }
        else {
            return false;
        }
    });

    db.create_function("isDateTime", function (inputText) {
        if (inputText == null) return true;

        if (typeof inputText != 'string') return false;

        // var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        var dateformat = /^\d{4}[\-](0[1-9]|1[012])[\-](0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0123]):([0-5][0-9]):([0-5][0-9])$/;
        // Match the date format through regular expression
        if (inputText.match(dateformat)) {
            var splitStr = inputText.split(' ');
            var dateStr = splitStr[0];
            //var timeStr = splitStr[1];

            // if (dateStr.length != 3) return false;
            // var dd = parseInt(dateStr[2]);
            // var mm = parseInt(dateStr[1]);
            // var yy = parseInt(dateStr[0]);
            if (dateStr.length != 10) return false;
            var dd = parseInt(dateStr.substring(8, 10));
            var mm = parseInt(dateStr.substring(5, 7));
            var yy = parseInt(dateStr.substring(0, 4));
            // Create list of days of a month [assume there is no leap year by default]
            var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (mm == 1 || mm > 2) {
                if (dd > ListofDays[mm - 1]) {
                    return false;
                }
            }
            if (mm == 2) {
                var lyear = false;
                if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
                    lyear = true;
                }
                if ((lyear == false) && (dd >= 29)) {
                    return false;
                }
                if ((lyear == true) && (dd > 29)) {
                    return false;
                }
                return true;
            }

            return true;

        }
        else {
            return false;
        }
    });

    db.create_function("isTime", function (inputText) {
        if (inputText == null) return true;

        if (typeof inputText != 'string') return false;

        var timeformat = /^([01][0-9]|2[0123]):([0-5][0-9]):([0-5][0-9])$/;
        // Match the date format through regular expression
        return inputText.match(timeformat) != null;
    });

    db.create_function("concat", function () {
        console.log("Hier!");
        if (arguments == null) return "";
        let erg = "";
        for(let i = 0; i < arguments.length; i++){
            erg += ("" + arguments[i]);
        }
        return erg;
    })

    return db;
}
