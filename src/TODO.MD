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
    => or restructure this approach. Currently the state could be just the function called.
    => alternativly, we could set a keyframe state with all the offsets and add to that. Maybe also a before/-1 and a after/2

- logic to allow unperformant entries to pass through, like color etc
- before the animation, some styles need to be temporarily disabled or changed:
  - display: inline => display: inline-block
  - borderRadius: x => 0,
  - rotate
- disallow mutations of the sets/weakmaps/maps outside of their file by export a getter function instead

- callbacks need to be reversable? How to handle on reverse, iterations etc

## Maybes

- a data attribute "data-bewegung=[...]" which we could look for and add those as well with their value as input arguments
