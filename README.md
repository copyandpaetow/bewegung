# Bewegung

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/tterb/atomic-design-ui/blob/master/LICENSEs)

An animation experiment of how far you can go with the FLIP technique to become an actual library.

## API

### Syntax

```javascript
//for one entry

bewegung({ target, keyframes, option });

bewegung({ target, keyframes });

//for multiple entries

bewegung([{ target, keyframes, option }, { target, keyframes, option }, ...]);

bewegung([{ target, keyframes }, { target, keyframes }, ...]);

//from a previous animation

bewegung(keyframeEffect)

bewegung([keyframeEffect, keyframeEffect, ...])

```

### Parameters

#### Target

Can be one or multiple elements or their selector.

#### keyframes

Takes in an object of css-styles or an array of these css-style objects. In addition to css styles, an `offset` can be included to indicate the starting time of that style to take effect (the original css property `offset` is renamed to `cssOffset`). Another additon is the `callback`, which executes a function at its offset-time.
If no `offset` is supplied, it will assume 1 (for one entry), 0 and 1 (for two entries) and for more it will be 0 and 1 for the first and last and all other will get distributed evenly.

```javascript
bewegung({
          element,
          [
            {height: "20vh", width: "20vw", offset: 0.5, callback: ()=>console.log("starting to grow")},
            {height: "40vh", width: "40vw"}
            ],
          {duration: 400, easing: "ease-in"}
          })
```

It is also possible to input an Object with css style arrays. If there are less `offset`s than entries, they will be filled up like with the array syntax.

```javascript
bewegung({
          element,
          {
            height:[ "20vh", "40vh"],
            width: ["20vw", "40vw"],
            callback: [()=>console.log("starting to grow")],
            offset: [0.5]
            },
          {duration: 400, easing: "ease-in"}
          })
```

#### option

Can either be a detailed object or just a number, which will be the duration (in ms).

```javascript
bewegung({
          element,
          {height:"20vh",width: "20vw"},
          400
          })

bewegung({
          element,
          {height:"20vh",width: "20vw"},
          {duration: 400, easing: "ease-in"}
          })
```

The `option` object can include these optional fields:

- **duration**: The animation runtime in ms. Defaults to `400`.
- **delay**: The time the animation waits before running. Defaults to `0`.
- **endDelay**: The time the animation waits after running before actually completing. Defaults to `0`.
- **easing**: The animation curve / timing function of the animation. Defaults to `ease`.
- **onAnimationStart**: a callback on animation start.
- **onAnimationEnd**: a callback on animation end.
- **onAnimationPause**: a callback on animation pause.
- **onAnimationCancel**: a callback on animation cancel.

Other options like **direction**, **fill**, and **iteration** are possible to add, but might cause issues when combined with multiple animations.

#### KeyframeEffect

It is also possible to add an existing keyframe effect or an array of effects to the animation. More about keyframeEffects can be found here: [keyframeEffect](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect)

### Methods

#### Play, Pause, Reverse

```javascript
import { bewegung } from "bewegung";

const element = document.querySelector(".some-element")

const animation = bewegung({
                  element,
                  {height: "20vh", width: "20vw"},
                  {duration: 400, easing: "ease-in"}
                  })

bewegung.play()

//something happens

bewegung.pause()

//something else happens, so the animation should go back

bewegung.reverse()
```

#### Scroll

`.scroll(progress:number, done: boolean)`

The animation can be controlled with a progress input (a number between 0 and 1) like the amount of page scrolled down. An optional second parameter is used to finish the animation.

```javascript
import { bewegung } from "bewegung";

const element = document.querySelector(".some-element")

const animation = bewegung({
                  element,
                  {height: "20vh", width: "20vw"},
                  {duration: 400, easing: "ease-in"}
                  })

window.addEventListener("scroll", ()=>{
  const scrollAmount = window.pageYOffset / document.body.scrollHeight
  const isVisible = scrollAmount < 0.5
  animation.scroll(scrollAmount, isVisible)
})

```

#### Refresh

the animation calculates the needed keyframes from the elements position. If these change between calling the animation function and it's `.play()` method, the animation could look off / be wrong. in that case the calculation can be redone.

```javascript
import { bewegung } from "bewegung";

const element = document.querySelector(".some-element")

const animation = bewegung({
                  element,
                  {height: "20vh", width: "20vw"},
                  {duration: 400, easing: "ease-in"}
                  })

// an element got removed / replaced / changed

animation.refresh()
animation.play()

```

#### Finish, Cancel, CommitStyles

The animation can be ended in several ways. `.finish()` completes the animation regardless of how much time it had left to play, `.cancel()` cancels the animation and removed its effects on elements, and `.commitStyles()` adds the wanted styles directly (could be useful if you cant do the animation, but want the results anyways)

#### UpdatePlaybackRate

`.updatePlaybackRate(speed:number)`

With `.updatePlaybackRate(2)` the speed of the animation can be increased, e.g. doubled with `2`

### Status Properties

- Ready: A promise indicating if the calculations are done,
- Finished: A promise indicating if all animations have been run,
- Pending: a boolean indicating if the animation is waiting or paused,

## License

[MIT](https://choosealicense.com/licenses/mit/)
