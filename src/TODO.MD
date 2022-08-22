# TODOs

## upcoming tasks

- callbacks need to be reversable? How to handle on reverse, iterations etc
- classes and attributes?
- custom properties

## Questions

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
