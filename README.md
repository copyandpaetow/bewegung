# Bewegung

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/tterb/atomic-design-ui/blob/master/LICENSEs)

An experiment of how far you can go to create an animation library with the FLIP technique.

## Usage/Examples

```javascript
import { bewegung } from "bewegung";

const element = document.querySelector(".some-element")

const animation = bewegung({
                    element,
                    {height: "20vh", width: "20vw"},
                    {duration: 400, easing: "ease-in"}
                    })

bewegung.play()

```

## Features

- animate most css properties for a single element or multiple elements
- pausing, resuming and scrolling the animation
- input is mostly compatible with the WAAPI
- bracket syntax even for unsupported WAAPI properties
- add callbacks for every given offset but also more general ones

## Roadmap

- Increase the WAAPI Keyframe coverage
- add a pure js fallback animation engine
- move main calc out into a web worker

## Bugs

- handle transform-origin for every step
- reverse() starts add the end state, animates to the starting state and then switches back to the end state... The last step shouldnt occur, the callbacks need to be registered in the methods
- text and images are distorted => there is some weird calculations going on for elements without a set height/width that get theirs implicitly from their parents (especially for elements without children) if they get set explicitly everything works fine
  -- `width/height: min-content` works but might cause some layout shift
  -- the text element can be cloned and measured in a canvas or a rendered decoy element
  -- especially for images, the overflow needs to be hidden
  -- span elements could work for this (wrapping the element in it) but only if they have `display: inline-block`
  -- border-radius for scaled images is off and needs to be adjusted by the height/width scale factors
  -- ideally they would be replaced by clipPath like `clipPath: inset(0 round [corrected border-Radius])`

## License

[MIT](https://choosealicense.com/licenses/mit/)
