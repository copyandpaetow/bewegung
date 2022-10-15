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

/*
- dom element as a key is very nice to work with (weakmaps or maps) 
	=> because it has a reference to related elements to it (parent, children, next/prev Sibling)
	=> this could be emulated though with a key-object. We would need to use a weakRef or a translation for the elements to keys
	=> with this we could re-assign in case of filtering but it adds a layer of complexity. 
	   It would also be tricky to search where the element is used so we could replace the parent
	**we will use dom elements**

- storing stuff in lists and then iterating them without changing to something else is good for performance (StructureOfArrays > ArrayOfStructure)
- having many store locations is more performant than a key-value pair, where the value is a huge and everchanging object
- index as a sole connection is error prone, especially if for filtering reasons, the dom element is still there, just not within the library

- main- and secondary elements should have the same data structure because they will often be used the same way 
- should all elements be in all stores? Or should the secondary elements be in some? 

- since the elements can be in multiple chunks, the stores should always return an array
- secondary elements dependece on primary ones are needed for the options (timeline) and for the selectors (MO)


*/

const mainElements = new Set<HTMLElement>();
const mainElements2: HTMLElement[] = [];

const keyframes = new WeakMap<HTMLElement, CSSStyleDeclaration[][]>();
const callbacks = new WeakMap<HTMLElement, VoidFunction[][]>();
const options = new WeakMap<HTMLElement, EffectTiming[]>();
const rootElement = new WeakMap<HTMLElement, HTMLElement>();

const secondaryElements = new Set<HTMLElement>();
const secondaryElements2: HTMLElement[] = [];

/*
case postprocess => remove sec from secondaryElements + recalculate readouts
case mo1 => remove (see above) / add to secondaryElements, get mainElements which would affect the new element, get their options + rootElement and add this combined
for the secondary element
case mo2/3: delete main element => recalc runtime, if it is different update keyframes and callbacks, start from secondaryElement calculation
case mo4: add main element => create a selector ElementMap. Get the main elements for each matching selector and copy their values, get their secondary elements and add them,
recalculate
*/

/*
TODOS

- change structure again to match the above vision, but keep the scheduling and the task layout
- try to use as few "global"weakmap stores as possible
- think about filtering some more. Currently, they are just Arrays of {..., offset}. They could also be a SoA or a map with offsets as keys
*/
