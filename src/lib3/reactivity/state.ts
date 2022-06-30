import { Animate, animate } from "../animate/state";
import { calculate } from "../calculate/state";
import { STOP_TRAVERSING_CLASS } from "../elements/find-affected";
import { Chunks } from "../types";
import { ObserveBrowserResize } from "./browser-resize";
import { ObserveDimensionChange } from "./dimension-changes";
import { ObserveDomMutations } from "./dom-mutations";
import { Observerable } from "./observable";

export const topLevelElement = (document.querySelector(
	`.${STOP_TRAVERSING_CLASS}`
)?.parentElement ?? document.body) as HTMLElement;

export type Observer = { disconnect: () => void };

type Reactivity = (
	Input: Observerable<Chunks[]>,
	State: Observerable<Animate>,
	Progress: Observerable<number>
) => Observer;

export const reactivity: Reactivity = (
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
