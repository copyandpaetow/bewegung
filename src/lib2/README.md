# order of events

## init / prerequisits

- on input, format the 3 parts (main elements, keyframes, options (and callbacks)) to fit the right internal structure
- add these to their respective states => could the validation be done while adding?

- for every main element, some additional data is needed

  - the original style value
  - affected elements in general
  - affected elements with the element they depend on
    => depends on other main elements

- every keyframe needs to be adjusted for the total runtime
  => depends on the totalRuntime => depends on the options

## dom

--- this can only start, when the prerequisits are done

- for every change timing the current CSS needs to be applied
  => depends on the changeTimings => depends on the keyframes
  => depends on the changeProperties => depends on the keyframes

## post processing

--- this can only start, when the dimensions are known

- \*filter the elements here
- calculate the difference between 2 dimension entries
- \*calculate the easing for affected elements
- create the WAAPI

## method output to the user

--- the methods can only be invoked when the WAAPI is done

- apply the styles and play the animation

## reactions to changes

- maybe it would be easier to just setup

  - a mutationObserver to watch for changes in elements, attributes and styles
  - a resizeObserver to watch for changes of the browser
    => just to notice change and set a flag. If the flag is set before the WAAPI wants to play, everything gets reassest starting from the main elements
