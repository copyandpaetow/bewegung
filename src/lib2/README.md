# TODO

## missing features that are already implemented in V1

- callbacks
- animation concept for display: none
- proper text calculations
- filtering of unchanged elements => is this even faster?
- compliance-methods like (play, reverse, pause, cancel, finish, commitStyles, updatePlaybackRate)
- scroll

## features to add

- how to handle addition/Deletion of elements?
- borderRadius will still be a problem

## order of events

### init / prerequisits

- on input, format the 3 parts (main elements, keyframes, options) to fit the right internal structure
- add these to their respective states => could the validation be done while adding?

- for every main element, some additional data is needed

  - the original style value
  - affected elements in general
  - affected elements with the element they depend on
    => depends on other main elements

- every keyframe needs to be adjusted for the total runtime
  => depends on the totalRuntime => depends on the options

### dom

--- this can only start, when the prerequisits are done

- for every change timing the current CSS needs to be applied
  => depends on the changeTimings => depends on the keyframes
  => depends on the changeProperties => depends on the keyframes

### post processing

--- this can only start, when the dimensions are known

- \*filter the elements here
- calculate the difference between 2 dimension entries
- \*calculate the easing for affected elements
- create the WAAPI

### method output to the user

--- the methods can only be invoked when the WAAPI is done

- apply the styles and play the animation

### reactions to changes

- maybe it would be easier to just setup

  - a mutationObserver to watch for changes in elements, attributes and styles
  - a resizeObserver to watch for changes of the browser
    => just to notice change and set a flag. If the flag is set before the WAAPI wants to play, everything gets reassest starting from the main elements

  solutions

  1. on flag detection call the inner function again with the inital props

  - pro: no additional logic is needed => file size will be smaller
  - con: the inital props would need to get recalculated

  2. OR delete all states beside the 3 main ones (main elements, keyframes, options) and derive it again

  - pro: if a main element is removed or altered, the derived state just needs to get calculated again, the initial prop conversion would be skipped
  - if a main element is added (via a css selector), the keyframe and the options would need to be extended and the derived state recalculated

  Both: since we cant guarantee that no layout shift took place when resizing re-reading the dom and recalculating the keyframes as well as replacing the whole animation is neccessary

## Questions

- how to split the state? state, mutations,actions or element states, element mutations, option state, option, mutation etc
