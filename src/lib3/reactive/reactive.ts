import { calculate } from "../calculate/calculate";
import { Animate, Chunks, Context, Observerable, Reactive } from "../types";
import { ObserveBrowserResize } from "./browser-resize";
import { ObserveDimensionChange } from "./dimension-changes";
import { ObserveDomMutations } from "./dom-mutations";

export const makeReactive: Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Context: Observerable<Context>
) => {
	const observeDOM = ObserveDomMutations(Input, (changes: Chunks[]) => {
		Input(changes);
		if (!State().isPaused) {
			return;
		}
		const newContext = { ...Context(), progress: State().getCurrentTime() };
		Context(newContext);
	});

	const observeResize = ObserveBrowserResize(() => {
		//TODO: this might not work if the animation is running
		State(calculate(Context));
	});

	const observeDimensions = ObserveDimensionChange(() => {
		State(calculate(Context));
	});

	const disconnect = () => {
		observeDOM.disconnect();
		observeResize.disconnect();
		observeDimensions.disconnect();
	};

	return { disconnect };
};
