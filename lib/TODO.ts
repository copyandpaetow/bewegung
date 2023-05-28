/*
TODOs

* updates / features

- animation options in the config file
=> iterations
=> direction?

- since the library is kinda low lever, we could include helper like observers etc

- "at" needs some improvements / aditions
=> how are easings when there is an overlap?
=> should singular BewegungsEntries have iterations?

* bugs

- counter scaling looks still buggy => easing issue

- if the root element is removed, its absolute position might lead to bugs because we dont know the next anchor parent
=> maybe we would need to change the code in a way that the parent is the first non-animation element

- if the user sets transform or clipPath, we will override them

- if any element is already included in another animation, it might lead to confusions
=> hash/salt the keys with an animation id? But what if the user sets a key manually?

* tasks

- update docs

*/
