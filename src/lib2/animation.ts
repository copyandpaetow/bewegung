import { createAnimationsFromKeyframes } from "./main-thread/create-animations-from-keyframes";
import { getGeneralTransferObject } from "./main-thread/find-affected-elements";
import { readDom } from "./main-thread/read-dom";
import {
	getSelectors,
	replaceTargetInputWithKeys,
	setElementRelatedState,
} from "./main-thread/update-state";
import { removeElementsFromTranslation, watchForChanges } from "./main-thread/watch-changes";
import { BidirectionalMap } from "./shared/element-translations";
import { createMessageStore, getWorker } from "./shared/store";
import { deferred } from "./shared/utils";
import {
	CustomKeyframeEffect,
	MainMessages,
	MainState,
	ReactivityCallbacks,
	WorkerMessages,
} from "./types";
/*
TODOS:
 
# performance
- if the general state takes to long, we already get a keyframe-request before the GS is done
=> if we split the getGeneralTransferObject function it works, but the tasks takes a lot of time (like 10ms)

#refactor
- the affectedElements need to be calculated differently
=> do we need one root or can they be multiple? If so, we could remove a lot of calculations there
=> for the affectedElements, they can be the root.querySelectorAll(*)
=> we would need to calculate if an element is related to the main Element (decendent, ancestor, sibling)
- no boolean arguments
- how handle properties that are not layout related but cant be animated in a good way? like colors? 

#bugs
- all the main elements are also included in the affectedElement State
? it would make sense that even main elements are affected by other easings but should their easing take priority?

- easings are wrong when counter-scaling and need to get calculated
=> parents should dictate the easings for their children
=> if the easing cant be calculated, the keyframes need to be expanded to be explicit. This would also need some additional easing calculation
because just spreading them out would be linear easing

- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- formatArraySyntax procudes wrong values when properties have mixed middle offsets but the same start and end values
- the override styles for display: inline are not working correctly. They are intendend for spans
- maybe rounding the input values could reduce the unsharpness

# features
- callbacks 
- maybe we can send the keyframes one by one and create the animation on the fly. They will get synchronized with their own timeline
=> this could also be usefull for reactivty, when restoreing the currentTime
- allow usage of elements as target which are not currently in the dom. The Element in question will can get appended in the dom (or deleted)
- check for custom properties
- background images
- prefer reduced motion
*/

const initMainState = (): MainState => ({
	root: new Map<HTMLElement, HTMLElement>(),
	resets: new Map<HTMLElement, Map<string, string>>(),
	translation: new BidirectionalMap<string, HTMLElement>(),
});

const allWorker = getWorker();

export const Animations = (props: CustomKeyframeEffect[]) => {
	let state = initMainState();
	let done = deferred();

	const messageStore = createMessageStore<MainMessages, WorkerMessages>(allWorker.current(), {
		async initState({ reply }, initialProps) {
			const keyedProps = replaceTargetInputWithKeys(initialProps, state);
			reply("receiveMainState", keyedProps);
			setElementRelatedState(keyedProps, state);
			reply("receiveGeneralState", await getGeneralTransferObject(state));
		},
		async receiveAppliableKeyframes({ reply }, appliableKeyframes) {
			const readouts = await readDom(appliableKeyframes, state);
			reply("receiveReadouts", readouts);
		},
		receiveConstructedKeyframes(_, resultTransferable) {
			done.resolve(createAnimationsFromKeyframes(resultTransferable, state));
		},
	});

	messageStore.send("initState", props);

	return {
		results() {
			return done.promise;
		},
		observe(before: VoidFunction, after: VoidFunction) {
			const callbacks: ReactivityCallbacks = {
				onMainElementChange() {
					state = initMainState();
					done = deferred();
					messageStore.send("initState", props);
				},
				onSecondaryElementChange(removedElements: HTMLElement[]) {
					done = deferred();
					removeElementsFromTranslation(removedElements, state);
					messageStore.reply("receiveGeneralState", getGeneralTransferObject(state));
				},
				onDimensionOrPositionChange() {
					done = deferred();
					messageStore.reply("receiveKeyframeRequest");
				},
				before,
				after,
			};

			return watchForChanges(state, callbacks, getSelectors(props), done);
		},
		finish() {
			messageStore.terminate();
		},
	};
};
