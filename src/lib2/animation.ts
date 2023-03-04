import { getResults } from "./main-thread/create-animations-from-keyframes";
import { getGeneralState } from "./main-thread/find-affected-elements";
import { calculateDomChanges, getStyleChangesOnly } from "./main-thread/read-dom";
import { getMainState } from "./main-thread/update-state";
import { getEmptyResults } from "./shared/object-creators";

import { AnimationFactory, AtomicWorker, CustomKeyframeEffect, Result } from "./types";
/*
TODOS:
 
# performance

#refactor
- no boolean arguments
- how handle properties that are not layout related but cant be animated in a good way? like colors? 

#bugs
- easings are wrong when counter-scaling and need to get calculated
=> parents should dictate the easings for their children
=> if the easing cant be calculated, the keyframes need to be expanded to be explicit. This would also need some additional easing calculation
because just spreading them out would be linear easing

- shrinking elements distort text elements
- the override styles for display: inline are not working correctly. They are intendend for spans

# features
- callbacks 
- allow usage of elements as target which are not currently in the dom. The Element in question will can get appended in the dom (or deleted)
- check for custom properties
- background images
- prefer reduced motion
*/

export const animationFactory = (
	userInput: CustomKeyframeEffect[],
	useWorker: AtomicWorker
): AnimationFactory => {
	const state = getMainState(userInput, useWorker);

	let generalState: null | Promise<number> = null;
	let domChanges: null | Promise<number> = null;
	let result: null | Promise<Result> = null;

	const context = {
		async results() {
			try {
				generalState ??= getGeneralState(useWorker, state);
				domChanges ??= calculateDomChanges(useWorker, state);
				result ??= getResults(useWorker, state);
			} catch (error) {
				result = getEmptyResults();
			} finally {
				return (await result) as Result;
			}
		},
		invalidateDomChanges() {
			domChanges = null;
			result = null;
		},
		invalidateGeneralState() {
			generalState = null;
			context.invalidateDomChanges();
		},
		async styleResultsOnly() {
			return await getStyleChangesOnly(useWorker, state);
		},
	};

	return context;
};
