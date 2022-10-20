import { normalizeProps } from "./normalize/structure";
import { initialState, setState } from "./prepare/state";
import { fillReadouts } from "./read/dom";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import {
	AnimationEntry,
	AnimationsAPI,
	BewegungProps,
	DimensionalDifferences,
	ElementReadouts,
	Overrides,
} from "./types";

export const getAnimations = (...props: BewegungProps): AnimationsAPI => {
	let now = performance.now();

	//TODO: maybe the props normalization needs to use the scheduleCallback
	//?: currently the functions all have a lot of arguments, maybe it makes more sense to nest the state? Maybe State, Elements, Context?
	//?: Maybe extends the Sets/Maps/WeakMaps to have better functionality

	const state = initialState();

	function init() {
		const animtionEntries: AnimationEntry[] = [];
		const tasks = [
			() => normalizeProps(animtionEntries, ...props),
			() => setState(state, animtionEntries),
			read,
		];

		tasks.forEach(scheduleCallback);
	}

	function read() {
		const readouts = new Map<HTMLElement, ElementReadouts[]>();
		const defaultCalculations = new Map<HTMLElement, DimensionalDifferences[]>();
		const imageCalculations = new Map<HTMLElement, DimensionalDifferences[]>();
		const overrides = new WeakMap<HTMLElement, Overrides>();

		const tasks = [
			() => fillReadouts(readouts, state),
			//() => filterReadouts(readouts, (element) => secondaryElements.delete(element)),
			() => adjustForDisplayNone(readouts),
			// //TODO this only needs to happen for the non-image elements,
			// () => fillCalculations(defaultCalculations, readouts),
		];

		tasks.forEach(scheduleCallback);
	}
	init();

	scheduleCallback(() =>
		console.log({
			duration: performance.now() - now,
		})
	);

	return {
		play() {},
		playState: "idle",
		finished: Promise.resolve(),
	};
};
