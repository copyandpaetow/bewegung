// @ts-nocheck
import { Chunks } from "./types";

const input = [
	{ target: [elem1, elem2, elem3], keyframes1, callbacks1, options1 },
	{ target: [elem4, elem5, elem6], keyframes2, callbacks2, options2 },
	{ target: [elem7, elem8, elem9], keyframes3, callbacks3, options3 },
];

/* 
1. all entries need to get normalized
2. all elements in target need to get set into the mainElement state
3. keyframes, callbacks, options need to be set into the store with every element in the target-array //? or via lookup
=> this means they are duplicated for every element in the target-array (e.g. 3 times instead of 9 in the upper example)
*  the addiditon of the mainElements and the calc of affected elements could happen in chuncks


4. for every element in the mainElements the affected elements are gotten from the DOM and written into another store
	 (as well as originalStyle, and which of the affected elements are influenced by which main elements)
=> this is currently only used for the easing. This could be calculated here as well
5. keyframes, callbacks, options are formatted //* options have no dependencies, keyframes and callbacks depend on the options
=> this step could happen beforehand
*  the easing could be part of the keyframe calc and is only dependend on the group of elements per input entry and not on the element itself
6. out of the keyframes and the options 3 things will get computed: 
	 changeTimings, changeStyles, totalRunetime //*depends on keyframes (styles), on Options (totalRuntime) or both(changeTimings)

*  simple flow a depends on b depends on c ...
7. for every timing, the corresonding keyframe will get applied to the mainElement DOM node, and the DOM will get read. 
	 After that the Styles of the changed elements will get reset //*depends on 6
8. this data will get calculated into animation-keyframes //*depends on 7
9. the animation-keyframes will get made into WAAPI //*depends on 8
=> stuff directly on DOM elements could be in event handlers (reading DImensions, setting styles etc), these would need to get removed in the MO though


10. reactions
=> if main element is added, it can only be part of a group via a matching selector, recalc only needed
=> if main element is removed, and if its group still has entries only recalc is needed, if the group is empty, everything needs to get redone
*  in that case, the props would need to change if the node is put in there
?  maybe only the totalRuntime could be recalculated on main element changes and be used as a surogate parameter, if that changes, all needs to change
=> if a side element is added, only recalc is needed but //? how do we get its easing? (check for isParent, isSibiling, isChild for each main element)
=> if a side element is removed, recalc only needed 
*/

/*
a. all entries need to get normalized and the data structure gets returned as singleSourceOfTruth
* this would need to be reactive, changes from the MO need to affect this and tripple down from here
b. changeTimings, changeStyles, totalRunetime are calculated from that
c. keyframes and callbacks get updated on their way to a store, options too but they dont need to be formated
=> at that time they still have access to the options so they dont need to get iterated
d. for a chunk of elements, their affeced elements will be fetched and added as a set to the afffectedElements state.
	 the element chunk will get added to the mainElements state. The options of the chunk will added to the affectedByMainElements state
?  unclear if this would allow for recalc later
*/

/* 
a. all entries need to get normalized and the data structure gets returned
b. changeTimings, changeStyles, totalRunetime are calculated from that
? the should initialize the observerable?
c. keyframes and callbacks get updated on their way to a store, options too but they dont need to be formated
d. set the main as chunks [[elem1, elem2, elem3],  [elem4, elem5, elem6], [elem7, elem8, elem9]]
=> via getters you could get either one representetive of each chunk or all
* adding or removing a member of chunk would only cause a style recalc
? how to keep the info for what matched the chunk? last/first array entry as try, if too difficult => array of objects
* removing a last member of a chunk would cause a full recalc
? since another chunk can not be added or not removed as "full chunk", maybe this could the "init" exception
* updates from the MO could be put in a queue and executed on requestIdleFrame




*/
