# TODOs

## upcoming tasks

- callbacks need to be reversable? How to handle on reverse, iterations etc
- custom properties?
- background images
- prefer reduced motion
- update docs
- improve the playState setting
  - reset finish promise
- filter unaffected Elements
  - since the code is reactive we dont need the weakmap approach anymore, at least not the element as keys
  - maybe something that gets garbage collected when filtered out of the allElements
- values for the same element in different chunks can be merged. In an edge case it might be difficult (e.g chunk1 animate width of element in 1s with ease, chunk2 animate hight of element in 2s with linear)

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
