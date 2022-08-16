export type EventHandler = () => void;

export type EventHandlerData = {
    handler: EventHandler,
    THIS: Object,
    marker: string
}

export type EventMarkerData = {
    event: string,
    handler: EventHandler
}

export class EventManager<Events extends string> {

    private eventHandlers: Map<string, EventHandlerData[]> = new Map();

    registerHandler(event: Events, handler: EventHandler, THIS?:Object, eventMarker?: string){
        let handlerList: EventHandlerData[] = this.eventHandlers.get(event);
        if(handlerList == null){
            handlerList = [];
            this.eventHandlers.set(event, handlerList);
        }
        handlerList.push({handler: handler, THIS: THIS, marker: eventMarker});

    }

    unregisterHandler(event: Events, handler: EventHandler){
        let handlerList: EventHandlerData[] = this.eventHandlers.get(event);
        if(handlerList != null){
            handlerList.splice(handlerList.findIndex(hd => hd.handler == handler), 1);
        }
    }
    
    unregisterAllHandlersByEventMarker(eventMarker: string){
        this.eventHandlers.forEach((ehd) => {
            let indexesToRemove: number[] = [];
            ehd.forEach((ehd, index)=>{if(ehd.marker == eventMarker) indexesToRemove.push(index)})
            indexesToRemove.sort((a, b) => {return b - a});
            for(let i = 0; i < indexesToRemove.length; i++){
                ehd.splice(indexesToRemove[i], 1);
            }
        })
    
    }

    fireEvent(event: Events){
        let handlerList: EventHandlerData[] = this.eventHandlers.get(event);
        if(handlerList != null){
            for(let handlerData of handlerList){
                handlerData.handler.call(handlerData.THIS);
            }
        }
    }

    clearHandlers(event: Events){
        this.eventHandlers.set(event, []);
    }

    clearAllHandlers(){
        this.eventHandlers = new Map();
    }

}