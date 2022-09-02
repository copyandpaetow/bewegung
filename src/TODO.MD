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

## test

- create test page
  - seperated into inputs, return methods + properties, css-properties
  - test media (image + video) and text in addition to a simple box, maybe even a pseudoelement

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
