/*
TODOs


* bugs

- if the first element has a negativ at-value, it will become its delay => the animation starts not at 0
? the last element with a postive at value should it have become its endDelay?

- counter-scaling needs easing adjustments 
- display: inline might need some adjustments
- in a sequence, scrolling from the bottom (after a reload for example) to the top breaks the layouting => is this the weird browser bug again?
- elements that animate overlap unanimated elements

* checks
- what happens when 2 options run at the same time (via overlap)?
- does it work in all browsers?

* adjacent tasks

- update docs

* future improvements 

- we only need the main library ts values, not the internal stuff
- animation options in the overall options / config file
=> iterations? callback after each?
=> direction?

- reactivity
- resets

- "at" needs some improvements / aditions
=> how are easings when there is an overlap?

*/
