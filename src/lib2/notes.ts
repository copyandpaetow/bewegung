/*
to handle async state management we have several options
- wrap the eventListeneres in a promise and async/await them on the toplevel: the order is set
- an object with methods: events can happen at any time
- a state machine, which would be a combination of both

if we need to support recalculations we cant use the first approach in the worker
- we would need to know which elements changed
-- if it is a new element,we would need to add it via the selector maybe?
-- if it is an old element, we would need to remove it from all the maps

alternatively, we could reupload the props


We could split the state in inital and computed, updates to the inital would trigger computed updates
=> events are already a good place to reclac stuff

maybe a generator would be nice to yield the next value back and forth? 
=> how would this handle the recalculation?

- changeTimings are not needed, maybe we can just send the changeProperties and the totalRuntime whenever they are actually needed?


*/
