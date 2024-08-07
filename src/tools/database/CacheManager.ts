export class CacheManager {
    
    fetchTemplateFromCache(databaseId: number, callback: (templateDump: Uint8Array) => void) {
        if(databaseId == null){callback(null); return;}
        let that = this;
        if(!this.cacheAvailable()) callback(null);
        this.getCache((cache) => {
            cache.match(that.databaseIdToCacheIdentifier(databaseId)).then(
                (value)=>{
                    value.arrayBuffer().then((buffer) => callback(new Uint8Array(buffer)));
                })
                .catch(() => callback(null));
        })        
    }

    saveTemplateToCache(databaseId: number, templateDump: Uint8Array) {
        if(!this.cacheAvailable()) return;
        let that = this;
        this.getCache((cache) => {
            cache.put(that.databaseIdToCacheIdentifier(databaseId), new Response(templateDump));
        })        
    }

    cacheAvailable(): boolean {
        return 'caches' in self;
    }

    getCache(callback: (cache: Cache) => void) {
        caches.open('my-cache').then(callback);
    }

    databaseIdToCacheIdentifier(databaseId: number): string {
        return "/onlineIdeTemplateDb" + databaseId;
    }

}