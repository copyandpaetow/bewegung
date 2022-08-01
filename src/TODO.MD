# TODOs

## upcoming tasks

- image aspect ratio
- rootElement: rootElement should be included but not the body element. It should also be configurable as option for each chunk
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead
- callbacks need to be reversable? How to handle on reverse, iterations etc
  - they currently will be called to often. They dont need to be called on element- but on chunk based
- add the observer delayed so if the lib is used as bewegung(...).play() it is never set up. Could be checked via the playState
- lookup tables for the exceptional CSS rules might be slow
- rename "calculate" since there the reading is done and the calculations are more in "animate" (maybe rename that too)

## Questions

- should the reactivity part do just the invalidation or should everything actually recalculated ?
- does the easing for the WAAPI need to adjusted like it would have been for the keyframes?
- are the cleanups really working? Maybe they should be executed in one place again to avoid issues when more than one animation is running

## Maybes

- helper functions for
  - a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
  - adding and deleting elements from the dom
- logic to allow unperformant entries to pass through, like color etc
- the 2 ways to create an animation are `element.animate(...)` and `new Animation(...)` maybe the function should also do that? At least the class syntax
