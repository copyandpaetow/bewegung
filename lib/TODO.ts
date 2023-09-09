/*
TODOs

* updates / features

- animation options in the overall options / config file
=> iterations
=> direction?
=> callbacks on iteration/start/end?


- "at" needs some improvements / aditions
=> how are easings when there is an overlap?

- cache animations? Let them stay alive?
=> imagine an animation that is performed often but on an interaction (like hovering over a card to expand it)

* bugs

- counter scaling looks still buggy => easing issue

- if the root element is removed, its absolute position might lead to bugs because we dont know the next anchor parent
=> maybe we would need to change the code in a way that the root is the first non-animation element
=> that also would make rootCalculations easier but it is unclear if the weird browser fix could be implemented otherwise

- if the user sets transform or clipPath, we will override them

- it looks like if the image becomes bigger than the parent via implicit overflow, that the image calculations are off
? maybe the wrapper style is missing something good to compare to?

* tasks

- update docs

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

*/
