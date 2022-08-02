# TODOs

## upcoming tasks

- image aspect ratio
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead
  - the cleanup approach is not that good, maybe scope the state it if performance is still okay
- callbacks need to be reversable? How to handle on reverse, iterations etc

## Questions

- does the easing for the WAAPI need to adjusted like it would have been for the keyframes?
- are the cleanups really working? Maybe they should be executed in one place again to avoid issues when more than one animation is running

## Maybes

- helper functions for
  - a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
  - adding and deleting elements from the dom
- logic to allow unperformant entries to pass through, like color etc
- the 2 ways to create an animation are `element.animate(...)` and `new Animation(...)` maybe the function should also do that? At least the class syntax

## performance

some functions take more time to do than others:

- traverseDomUp
- the new KeyframeEffect in normalizeOptions
- addAffectedElements (also dom traversal)
- construct keyframes
