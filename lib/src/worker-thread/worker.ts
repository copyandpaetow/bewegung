import { MainMessages, TreeStyle, WorkerMessages, WorkerState } from "../types";
import { useWorker } from "../utils/use-worker";
import { updateKeyframes } from "./calculate-animation-tree";
import { getOffset, updateReadouts } from "./set-readouts";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);
let state: WorkerState | null = null;

workerAtom("sendMetaData").onMessage((metaData) => {
	state = Object.freeze({
		readouts: new Map<string, Map<number, TreeStyle>>(),
		keyframes: new Map<string, Keyframe[]>(),
		overrides: new Map<string, Partial<CSSStyleDeclaration>>(),
		lastReadout: new Map<string, string>(),
		easings: metaData.easings,
		pastOffsets: [],
	});
});

workerAtom("sendDOMRects").onMessage((domTrees) => {
	const offset = getOffset(domTrees);

	domTrees.forEach((tree) => {
		updateReadouts(tree, state!);
	});

	if (offset === 1) {
		domTrees.forEach((tree) => {
			updateKeyframes(tree, state!, state!.lastReadout.get(tree.parentRoot));
		});

		workerAtom("sendAnimationData").reply("animationData", {
			keyframes: state!.keyframes,
			overrides: state!.overrides,
		});
	}

	state?.pastOffsets.push(offset);
});

/*


- we could read the dimensions everywhere once and then read only from the root of the current function and mark the rest as "unchanged"
=> we would need a Weakmapn of the rootElements and a Map of the changeFunctions for the given offset
=> or should it instead of only the changeFunctions be an object with easings, changeFunction and maybe more
=> elements should get a type like "added", "removed", or "hidden" to indicate why they are not complete (for refilling them later)
=> in the case of nested Root elements, how can avoid double readings but also spilling out of root containers?
==> we should not merge function calls that happen at the same time and we need to stop reading the dom if we encounter a nested root

- if we say that roots dont spill out, we can simplify the easings quite a bit
=> when creating the domTree we add the easing as parameter in the readout-function and set it like the offset for every element of a certain root
=> only in the case of "several entries with different easings have the same root" we would need to combine them


- after receiving the last offset, we need to normalize the readouts
=> if elements got added, removed, or hidden they dont have a full set of readouts

- after normalizing, we need to determine if the element will take part in the animation
=> unchanged or completely hidden items dont need to get animated
=> these elements should still be available but marked
=> for the calculations the parent element (which will get animated, so maybe not the direct parent) data needs to be available
=> maybe we could pass it down to the child and if the element is unchanged, we keep passing it on. Otherwise the current Child will pass its data to its respective children
=> but maybe the direct parent is required, then we need to do it differently
=> the top most element needs a special treatment since it has no parent data. Maybe empty values for them are easier? 
=> we might need to create 2 different keyframes for the root element, which we will set on play (based on the scroll position)

- we will store these differences in a map etc and iterate over them to create keyframes and send them back to the main thread
=> easing and border radius need to be calculated here
=> images (that scale) need a special treatment
=> it would be nicer to send an additional map for images to avoid conditionals

*/

/*
* second step

- we might need to send a metaData/context message first, which would create the state 
=> another call would be more explicit but could also introduce timing issues
=> maybe we can keep it as it is and then try to improve the readability / flow?
=> in that way we can test performance better



*/
