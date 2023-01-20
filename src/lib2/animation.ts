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
	Result,
	WorkerMessages,
} from "./types";
/*
TODOS:
 
# performance
- maybe a "task" message loop could help to break up larger functions (only on the main thread)
- rethink filtering. Maybe remove elements with all the same keyframes? Or all the elements are "translate(0,0) scale(0,0)"
? because some elements dont change but are affected from their parents and therefor influence their children
* in that case we would need to get their parents.parents... to help with the scale

#refactor
- rethink the offset structure for the style entries. Finding entries with certain offsets is tedious.
- check for custom properties
- background images
- prefer reduced motion

#bugs
- if an animation which added images is paused and another animation is called, these images will get included and will have more images created for it
- all the main elements are also included in the GTO
- if we scroll down far enough the translate values are wrong
- a starting delay combined with a value that changes on offset 0 behaves wrongly => the change should be instantiously but it is a transition
- shrinking elements distort text elements
- clip-path for display none images doesnt show the border radius anymore
- the store.ts store is not perfectly typed
- the MO callback needs to be throtteled differently => their callback arguments would need to be saved somewhere or they are lost
- formatArraySyntax procudes wrong values when properties have mixed middle offsets but the same start and end values


# features
- callbacks 
- allow usage of elements as target which are not currently in the dom. The Element in question will can get appended in the dom (or deleted)

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
		initState({ reply }, initialProps) {
			const keyedProps = replaceTargetInputWithKeys(state, initialProps);
			reply("receiveMainState", keyedProps);
			setElementRelatedState(state, keyedProps);
			reply("receiveGeneralState", getGeneralTransferObject(state));
		},
		async receiveAppliableKeyframes({ reply }, appliableKeyframes) {
			const { changeProperties, keyframes } = appliableKeyframes;
			const readouts = await readDom(keyframes, changeProperties, state);
			reply("receiveReadouts", readouts);
		},
		receiveConstructedKeyframes(_, constructedKeyframes) {
			done.resolve(createAnimationsFromKeyframes(state, constructedKeyframes));
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
