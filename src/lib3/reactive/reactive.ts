import { animate } from "../animate/animate";
import { calculate } from "../calculate/calculate";
import { Animate, Chunks, Observerable, Reactive } from "../types";
import { ObserveBrowserResize } from "./browser-resize";
import { ObserveDimensionChange } from "./dimension-changes";
import { ObserveDomMutations } from "./dom-mutations";

export const makeReactive: Reactive = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Progress: Observerable<number>
) => {
	const observeDOM = ObserveDomMutations(Input, (changes: Chunks[]) => {
		Input(changes);
		if (!State().isPaused) {
			return;
		}
		Progress(State().getCurrentTime());
	});

	const observeResize = ObserveBrowserResize(() => {
		//TODO: this might not work if the animation is running
		State((calculate(), animate(Progress)));
	});

	const observeDimensions = ObserveDimensionChange(() => {
		State((calculate(), animate(Progress)));
	});

	const disconnect = () => {
		observeDOM.disconnect();
		observeResize.disconnect();
		observeDimensions.disconnect();
	};

	return { disconnect };
};
