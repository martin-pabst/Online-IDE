type EventHandler = () => void;

class EventManager<Events extends string> {

    private eventHandlers: Map<string, EventHandler[]> = new Map();

    registerHandler(event: Events, handler: EventHandler){
        let handlerList: EventHandler[] = this.eventHandlers.get(event);
        if(handlerList == null){
            handlerList = [];
            this.eventHandlers.set(event, handlerList);
        }
        handlerList.push(handler);
    }

    unregisterHandler(event: Events, handler: EventHandler){
        let handlerList: EventHandler[] = this.eventHandlers.get(event);
        if(handlerList != null){
            handlerList.splice(handlerList.indexOf(handler), 1);
        }
    }
    
    fireEvent(event: Events){
        let handlerList: EventHandler[] = this.eventHandlers.get(event);
        if(handlerList != null){
            for(let handler of handlerList){
                handler();
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