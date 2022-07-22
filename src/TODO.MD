# TODOs

## upcoming tasks

- image aspect ratio

- rootElement: reevaluate if the root should be included or excluded
- move some properties to the calculation
  - clipPath,
  - opacity,
  - rotate,
  - perspective,
  - filter
- logic to allow unperformant entries to pass through, like color etc
- before the animation, some styles need to be temporarily disabled or changed:
  - display: inline => display: inline-block
  - borderRadius: x => 0
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead

## Maybes

- a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
