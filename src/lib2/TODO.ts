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
const rootElement = new WeakMap<HTMLElement, HTMLElement[]>();

const secondaryElements = new Set<HTMLElement>();
const secondaryElements2: HTMLElement[] = [];

/*
case postprocess => remove sec from secondaryElements + recalculate readouts
case mo1 => remove (see above) / add to secondaryElements, get mainElements which would affect the new element, get their options + rootElement and add this combined
for the secondary element
case mo2/3: delete main element => remove from mainELements, recalc runtime, if it is different update keyframes and callbacks, start from secondaryElement calculation
case mo4: add main element => create a selector ElementMap. Get the main elements for each matching selector and copy their values, get their secondary elements and add them,
recalculate
*/

/*
TODOS

- think about what to pass back to the Bewegungs class... Should it return an animation array and handle everything else itself or should everything happen inside of the function?
- think about making the final animations list not only one array but maybe a map or 2 arrays to handle callbacks better
*/
