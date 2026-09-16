export const clickOutside = (element:any, callbackFunction:any) => {
    function onClick(event:any) {
        if (!element.contains(event.target)) {
            callbackFunction(event);
        }
    }
    
    document.body.addEventListener('click', onClick);
    
    return {
        update(newCallbackFunction:any) {
            callbackFunction = newCallbackFunction;
        },
        destroy() {
            document.body.removeEventListener('click', onClick);
        }
    }
}