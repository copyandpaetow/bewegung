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
import { deferred, task } from "./shared/utils";
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
- bigger functions can be split by adding a task between 
? how does this behave on lower fps?

# coding style
- unify the names of state entries
- unify the order of function parameters, especially the state, should it be first or last?
- no boolean arguments

#refactor
- no boolean arguments
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- ratio doesnt need to be send, when there is no information (0) included, this could just be the fallback
- try to put the image wrapper etc directly where the real image is, since we need to make them a relative element anyways 
=> in that case we wouldnt need the rootMap in the worker
? if new image wrapper/placeholder are added and reactivity wise, the animation gets calculated again, how will they be treated
? should we have the readouts in the state and another imageReadout entry as well? They could get filtered and switched around instead of creating 2 Maps out of the readouts


#bugs
- sometimes the readouts for every offset are identical
? is something wroong with the readout?
- if an animation which added images is paused and another animation is called, these images will get included and will have more images created for it
=> animations should have an ID, or a data-key to prevent double usage
- all the main elements are also included in the affectedElement State
? it would make sense that even main elements are affected by other easings but should their easing take priority?
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore
- formatArraySyntax procudes wrong values when properties have mixed middle offsets but the same start and end values


# features
- callbacks 
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
			const keyedProps = replaceTargetInputWithKeys(state, initialProps);
			reply("receiveMainState", keyedProps);
			setElementRelatedState(state, keyedProps);
			await task();
			reply("receiveGeneralState", getGeneralTransferObject(state));
		},
		async receiveAppliableKeyframes({ reply }, appliableKeyframes) {
			const readouts = await readDom(appliableKeyframes, state);
			reply("receiveReadouts", readouts);
		},
		receiveConstructedKeyframes(_, resultTransferable) {
			done.resolve(createAnimationsFromKeyframes(state, resultTransferable));
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
					removeElementsFromTranslation(state, removedElements);
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
