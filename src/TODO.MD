# TODOs

## upcoming tasks

- image aspect ratio

  - instead of changing the element, we could clone it and add it within a container to the DOM that is fixed and overlays the original image
  - see https://codesandbox.io/s/framer-motion-scale-correction-for-transformed-images-ude0np?file=%2Fsrc%2FApp.js

- rootElement: reevaluate if the root should be included or excluded
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead
- callbacks need to be reversable? How to handle on reverse, iterations etc

- lookup tables for the exceptional CSS rules are slow as well

## Questions

- should the reactivity part do just the invalidation or should everything actually recalculated ?
- does the easing for the WAAPI need to adjusted like it would have been for the keyframes?

## Maybes

- a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
- logic to allow unperformant entries to pass through, like color etc

- try the MutationObserver one more time for more magic
  - use the MO to get all elements and get their dimensions initially
  - apply changes via classes, functions, styles etc and re-record the dom snapshot
  -
