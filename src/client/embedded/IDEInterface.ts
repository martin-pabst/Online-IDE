import { Module } from "../compiler/parser/Module";
import { MainEmbedded } from "./MainEmbedded";

interface IDEFileAccess {
    getName(): string;
    getText(): string;
}

interface SingleIDEAccess {
    getFiles(): IDEFileAccess[];
}

interface OnlineIDEAccess {
    getIDE(id: string): SingleIDEAccess | undefined;
}


export class IDEFileAccessImpl implements IDEFileAccess {
    constructor(private module: Module){

    }

    getName(): string {
        return this.module.file.name;
    }
    getText(): string {
        return this.module.getProgramTextFromMonacoModel();
    }

    
}

export class SingleIDEAccessImpl implements SingleIDEAccess {

    constructor(private ide: MainEmbedded){

    }

    getFiles(): IDEFileAccess[] {
        return this.ide.getCurrentWorkspace().moduleStore.getModules(false).map(module => new IDEFileAccessImpl(module));        
    }


}

export class OnlineIDEAccessImpl implements OnlineIDEAccess {
    
    private static  ideMap: Map<string, SingleIDEAccessImpl> = new Map();

    public static registerIDE(ide: MainEmbedded){
        OnlineIDEAccessImpl.ideMap.set(ide.config.id!,  new SingleIDEAccessImpl(ide));
    }
    
    getIDE(id: string): SingleIDEAccess | undefined {
        return OnlineIDEAccessImpl.ideMap.get(id);
    }

}