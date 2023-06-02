/*
TODOs

* updates / features

- animation options in the overall options / config file
=> iterations
=> direction?
=> expose the animations?

- since the library is kinda low lever, we could include helper like observers etc

- "at" needs some improvements / aditions
=> how are easings when there is an overlap?
=> should singular BewegungsEntries have iterations?

- cache animations? Let them stay alive?
=> imagine an animation that is performed often but on an interaction (like hovering over a card to expand it)

- stagger?
=> we could set a data-attribute for this if the option is set or the user sets them manually
=> like this there could be some fine tuning from the user

* bugs

- counter scaling looks still buggy => easing issue

- certain elements rely on their parent element for e.g. overrides. 
=> If we change the parent, we would also need to change the related calculations
=> add overrides to the new parent etc
? maybe it makes more sense to remove the unanimated elements sooner

- if the root element is removed, its absolute position might lead to bugs because we dont know the next anchor parent
=> maybe we would need to change the code in a way that the parent is the first non-animation element

- if the user sets transform or clipPath, we will override them

- if any element is already included in another animation, it might lead to confusions
=> hash/salt the keys with an animation id? But what if the user sets a key manually?

* tasks

- update docs

*/
