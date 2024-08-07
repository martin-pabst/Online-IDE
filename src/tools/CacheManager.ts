export class CacheManager {

    async fetchStringFromCache(path: string): Promise<string> {
        if (!this.cacheAvailable()) return null;

        let cache = await this.getCache();

        let value = await cache.match(path);

        if(value != null){
            return await value.text();
        } else {
            return null;
        }


    }

    async fetchUint8ArrayFromCache(path: string): Promise<Uint8Array> {
        if (!this.cacheAvailable()) return null;

        let cache = await this.getCache();

        let value = await cache.match(path);

        if(value != null){
            return new Uint8Array(await value.arrayBuffer());
        } else {
            return null;
        }

    }

    async store(path: string, data: Uint8Array|string) {
        if (!this.cacheAvailable()) return;
        let that = this;
        let cache = await this.getCache();
            cache.put(path, new Response(data));
    }

    cacheAvailable(): boolean {
        return 'caches' in self;
    }

    async getCache(): Promise<Cache> {
        return caches.open('my-cache');
    }

    databaseIdToCacheIdentifier(databaseId: number): string {
        return "/onlineIdeTemplateDb" + databaseId;
    }

}