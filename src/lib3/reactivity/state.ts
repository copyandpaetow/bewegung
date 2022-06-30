import { Animate, animate } from "../animate/state";
import { calculate } from "../calculate/state";
import {
	STOP_TRAVERSING_CLASS,
	traverseDomDown,
} from "../elements/find-affected";
import { Chunks } from "../types";
import { ObserveElementDimensionChanges } from "./dimension-changes";
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

	const observeDimensions = ObserveElementDimensionChanges(() => {
		//TODO: this might not work if the animation is running
		State((calculate(), animate(Progress)));
	});

	const disconnect = () => {
		observeDOM.disconnect();
		observeDimensions.disconnect();
	};

	return { disconnect };
};
