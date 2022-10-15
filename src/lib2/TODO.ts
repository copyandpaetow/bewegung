/*

TODOS:
- how to include RAF in the scheduler for DOM work? currently it will delay everything or increase the calculation duration by a lot
? maybe the current implementation still works fine without raf for the dom work

- it would be nice to separate the initial state into their own blocks, but its unclear if it is feasible 



*/

/*
tasks:

- normalize inputs

- get affected Elements

- calcualte totalRuntime
- recalculate keyframe and callback offsets

- save element state
- apply keyframes to main elements and read out all element

- update values for display none
- remove unchanged elements => how to remove them from other structures?

- calculate keyframes
- calculate images
- set overrides
- set callbacks


- how to remove elements from the strucutre if they get removed via MO or when they dont change? 
=> element key in a weakmap only works "automatically" for the MO not for the unchanged part
=> they cant also be used everywhere because 1 element can be in multiple animations

=> but after all it will be one WAAPI


in which cases we need to be aware of one element can have multiple entries?
- when we need the main element selectors for getting the affected elements
- when we need the keyframes for the main element to apply them to the dom
- when we need the options for the timeline
- when we need to callbacks 


mainElements = [[1,2,3], [3], [2, 4]]

options= [{}, {}, {}]
keyframes= [{}, {}, {}]

secondaryElements = Map([
	[11, [i1]],
	[22, [i1, i3]],
	[33, [i1, i2]],
	[44, [i3]]
])

case postprocess: element is not changed => should remove the element from secondaryElements and the calculation map


case MO1: sec element gets added/ deleted => add to / delete from secondaryElements and recalc from applying styles to keyframes
case MO2: primary element gets added / deleted without closing the entry => add to / delete from mainElements and recalc from calc second elements
case MO3: primary element gets added / deleted with closing the entry => remove the empty array and every other entry with that index from the other states and recalc second elements


*/
