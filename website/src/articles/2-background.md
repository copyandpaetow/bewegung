
# what options do we have to animate something

When we want to animate something, we have several options and can leverage both CSS and/or JS for this:

(here would be a good place to do a rendering break-out => maybe in an collapsed accordion?)

## CSS transition and animations

*The good*
these are the simplest and most accessible animations since they purely happen in the CSS world. We don't even need to know JS, we add a `transition` property with the name of the soon-to-be-animated-property and a duration. Additionally, an easing, delays, directions, etc. can be added to fine tune the animation. Keyframe animation allow for even more precision.

*The bad*
Sadly, we cant animate everything with them. There are some properties that cant be animated, like `display: none` or a change in `z-index`.

*the ugly*
not all properties are equal and its not clear which are which. To see a pixel on the screen, the browser has to through several steps to calculate and paint the screen. This has to be done 60+ times per second. Every round of that work is called a frame.
There are just four properties that change something during the last step and are therefor very performant. The other properties change steps before and make the browser to work harder. If it is too hard for the browser to do the work, they will skip a frame. This makes the animation look janky and not smooth.

## Web Animation API (WAAPI)

*The good*
The programmatic JS version to the CSS keyframe animation. It requires a slightly different input (an element, keyframes, and some options or a duration number) but behaves basically the same. It also features some additional methods and events with make it very nice to work with, e.g. the `animationend` event, the options to update the keyframes and/or timings, an `endDelay`, and many more.

*The bad*
Like with the CSS animations, we cant animate everything

*the ugly*
Additionally to the CSS issues, the browser can throttle the framerate of these animations to save power

## requestAnimationFrame

*The good*
an amazing API to execute a callback (a style change in our case) exactly when it is really convenient for the browser to do so. This reduces the performance issues we learned about earlier a lot. This is why most of the well known animation libraries (GSAP, motionOne) are using this API.

*The bad*
Animating values that are not numeric like `display: flex` to `display: grid` is really difficult with this approach.

*the ugly*
There are still performance implications to this technique and if the browser has to do too much in one callback, it will take longer than the frame and the animation looks janky again. If this function will be called multiple times in close proximity, some to all will be execute in that frame. It is not clear, how many will be batched that way.
This type of animation can also be throttled.

//example needed

## The weird love child: the FLIP animation technique

*The good*
An acronym for first, last, invert, play. A genius technique to animate the badly performing css properties. The idea is to record the affected elements dimension before the animation (first), change the dom somehow, record the dom again (last), calculate the difference between the dom elements position and/or dimension and make the elements look like before the dom change with `transform` (invert), and then animate these elements back to their new normal.

*The bad*
It requires dimensional changes in the layout to work. We can't animate colors with this.

*the ugly*
We basically have to do the animation ourself. This includes hidden details about element relationships the browser usually does for us, like flow of text, scaling children while already scaling parents, etc. If these would change during the animation, the browser could not help us and we have to calculate/animate these intermediate steps on our own.

//example needed
