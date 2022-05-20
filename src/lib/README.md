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
  -- especially for images, the overflow needs to be hidden
  -- span elements could work for this (wrapping the element in it) but only if they have `display: inline-block`
  -- border-radius for scaled images is off and needs to be adjusted by the height/width scale factors
  -- ideally they would be replaced by clipPath like `clipPath: inset(0 round [corrected border-Radius])`

## Think about

- intersection Observer with rootMargin as the elements exact position => any movement will get noticed (Even page scroll ...) and could update the position of elements
- mutation Observer to get any change
  - changes and dimensions would have to be marked and reversed (and the observer most likely disconnected until the changes are reversed)
  - elements could get an attribute so signal, they shouldnt be observered

## License

[MIT](https://choosealicense.com/licenses/mit/)
