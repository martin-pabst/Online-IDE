export class EmbeddedIndexedDB {

    private db: IDBDatabase;

    public open(successCallback: () => void) {

        if (window.indexedDB) {

            let request: IDBOpenDBRequest = window.indexedDB.open("LearnJ", 1);

            let that = this;

            request.onerror = function (this: IDBRequest<IDBDatabase>, ev: Event) {
                console.log("Couldn't open IndexedDB: " + ev.type);
            };

            request.onsuccess = function (this: IDBRequest<IDBDatabase>, ev: Event) {
                that.db = request.result;
                that.db.onerror = function(event) {
                    // Allgemeine Fehlerbehandlung, die für alle Anfragen an die Datenbank gilt. 
                    // @ts-ignore
                    console.log("Datenbankfehler: " + event.target.error.message);
                  };
                  successCallback();
            };

            request.onupgradeneeded = function(ev: Event){
                // @ts-ignore
                that.db = ev.target.result;
                let objectStore = that.db.createObjectStore("scripts", { keyPath: "scriptId", autoIncrement: false});


                objectStore.transaction.oncomplete = function(event) {

                }

            }

        } else {
            console.log("IndexedDB not available.");
        }

    }


    public writeScript(scriptId: string, script: string){

        let scriptObjectStore = this.db.transaction("scripts", "readwrite").objectStore("scripts");

        scriptObjectStore.put({
            scriptId: scriptId,
            script: script
        });

    }

    public removeScript(scriptId: string){

        let scriptObjectStore = this.db.transaction("scripts", "readwrite").objectStore("scripts");

        scriptObjectStore.delete(scriptId);

    }


    public getScript(scriptId: string, callback: (script: string) => void){

        let scriptObjectStore = this.db.transaction("scripts", "readwrite").objectStore("scripts");

        let request = scriptObjectStore.get(scriptId);

        request.onerror = (event) => {
            callback(null);
        }

        request.onsuccess = (event) => {
            if(request.result == null){
                callback(null);
            } else {
                callback(request.result.script);
            }
        }

    }


}