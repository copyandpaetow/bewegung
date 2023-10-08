/*
TODOs



* missing requirements

- resets

* bugs

- we only need the main library ts values, not the internal stuff

- sequence playState and Finished-Promise are not updated on reactivity change

- if the first element has a negativ at-value, it will become its delay => the animation starts not at 0
? the last element with a postive at value should it have become its endDelay?

- counter-scaling needs easing adjustments 

- display: inline might need some adjustments

* checks
- what happens when 2 options run at the same time (via overlap)?

* adjacent tasks

- update docs
- think about a website concept

* future improvements 

- animation options in the overall options / config file
=> iterations? callback after each?
=> direction?

- "at" needs some improvements / aditions
=> how are easings when there is an overlap?

*/

/*

! things that didnt really work

- combining the labeling with the inital readout doubled the labeling time

- reading all callouts after each other (even if they happen at the same time) => the overhead of setting things up takes some time
=> in case of nested roots, the parent root must swallow the child root

- combining all independent changes into one because the reading takes so long

- intersection observer 
=> cloning or hiding the actual dom to do changes there
=> cloning will take a long time because the browser needs a calculate all elements new (and render images new)
=> hiding the dom with an image or an svg takes very long since the visible dom needs to be rebuild

- from/to
=> modals are kinda annoying to do if you need to calculate them yourself
=> if we use from/to as the last or first spot only it is not that difficult
=> we could use a number to indicate the function call to which it belongs to like "data-bewegung-from-1" (default would be "data-bewegung-from-0")
=> maybe we could use them internally to indicate relationships? 

- independet animation chunks
=> having an animation runnning, stopping it + dom change for reading, revert and resuming the animations as well as setting it to a certain time to read again
	 doesnt work. There is a very visual stutter
=> if done poorly, now it works. We dont even need to stop the animations for it to work	 

*/
