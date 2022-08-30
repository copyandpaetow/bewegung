# TODOs

## upcoming tasks

- callbacks need to be reversable? How to handle on reverse, iterations etc
- enable addtion/removal or classes and attributes?
- custom properties?
- background images
- prefer reduced motion
- update docs
- improve the playState setting
- filter unaffected Elements

## test

- iterations
- can clip-path pass through?
- other media elements like video
- transform-origin
- filter
- pseudo-elements

## Questions

## Maybes

- helper functions for
  - a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
  - adding and deleting elements from the dom
- logic to allow unperformant entries to pass through, like color etc

## performance

some functions take more time to do than others:

- traverseDomUp
- the new KeyframeEffect in normalizeOptions
- addAffectedElements (also dom traversal)
- construct keyframes
