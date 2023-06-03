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
=> if we add a delay, the animation would be finished later. The stagger-delay would need to be included in the calculations...

- from/to
=> modals are kinda annoying to do if you need to calculate them yourself
=> if we use from/to as the last or first spot only it is not that difficult
=> we could use a number to indicate the function call to which it belongs to like "data-bewegung-from-1" (default would be "data-bewegung-from-0")
=> maybe we could use them internally to indicate relationships? 

* bugs

- counter scaling looks still buggy => easing issue

- certain elements rely on their parent element for e.g. overrides. 
=> If we change the parent, we would also need to change the related calculations
=> add overrides to the new parent etc
=> we could stop reading the dom tree if there is a display none
? maybe it makes more sense to remove the unanimated elements sooner? Currently we check it in different places again and again
=> instead of looking everything up, we can pass down parentData that either updates to the current treeNode or (if they dont partake in the animation)
keep passing the parentData down

- if the root element is removed, its absolute position might lead to bugs because we dont know the next anchor parent
=> maybe we would need to change the code in a way that the parent is the first non-animation element
=> that also would make rootCalculations easier but it is unclear if the weird browser fix could be implemented otherwise

- if the user sets transform or clipPath, we will override them

- display: none is meaningless. We should focus on the actual dimensions instead

- if any element is already included in another animation, it might lead to confusions
=> hash/salt the keys with an animation id? But what if the user sets a key manually?

- it looks like if the image becomes bigger than the parent via implicit overflow, that the image calculations are off
? maybe the wrapper style is missing something good to compare to?

- the easings could maybe be better included within the tree data instead of a data-attribute
- then we could also add a root attribute, which is more descriptive

* tasks

- update docs

*/
