# TODOs

## upcoming tasks

- image aspect ratio

- rootElement: reevaluate if the root should be included or excluded
- before the animation, some styles need to be temporarily disabled or changed:
  - display: inline => display: inline-block
  - borderRadius: x => 0,
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead

- callbacks need to be reversable? How to handle on reverse, iterations etc

## Maybes

- a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
- logic to allow unperformant entries to pass through, like color etc
