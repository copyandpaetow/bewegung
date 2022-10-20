import { defaultOptions } from "./constants";
import { computeSecondaryElements } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { calculateTotalRuntime, runtime } from "./prepare/runtime";
import { fillMainElements, fillResets, fillState } from "./prepare/state";
import { scheduleCallback } from "./scheduler";
import {
	AnimationEntry,
	AnimationsAPI,
	BewegungsOptions,
	Callbacks,
	CustomKeyframe,
	DimensionalDifferences,
	ElementReadouts,
	Overrides,
} from "./types";
import { map } from "./utils";

export const getAnimations = (props: AnimationEntry[]): AnimationsAPI => {
	let now = performance.now();

	//TODO: maybe the props normalization needs to be in here as well or changed to use the scheduleCallback

	const mainElements = new Set<HTMLElement>();
	const keyframes = new WeakMap<HTMLElement, CustomKeyframe[][]>();
	const callbacks = new WeakMap<HTMLElement, Callbacks[][]>();
	const options = new WeakMap<HTMLElement, BewegungsOptions[]>();
	const selectors = new WeakMap<HTMLElement, string[]>();

	const rootElement = new WeakMap<HTMLElement, HTMLElement>();
	const secondaryElements = new Set<HTMLElement>();
	const totalRuntime = runtime(defaultOptions.duration as number);
	const cssStyleReset = new WeakMap<HTMLElement, Map<string, string>>();

	function init() {
		const tasks = [
			() => fillMainElements(mainElements, props),
			() => fillState(keyframes, "keyframes", props),
			() => fillState(callbacks, "callbacks", props),
			() => fillState(options, "options", props),
			() => fillState(selectors, "selector", props),
			computeRemainingState,
		];

		tasks.forEach(scheduleCallback);
	}

	function computeRemainingState() {
		let didTheRuntimeChange = true;
		const tasks = [
			() => computeSecondaryElements(secondaryElements, mainElements, options, rootElement),
			() =>
				(didTheRuntimeChange = calculateTotalRuntime(
					map(mainElements, (element) => options.get(element)!),
					totalRuntime
				)),
			() =>
				didTheRuntimeChange &&
				updateKeyframeOffsets(keyframes, mainElements, options, totalRuntime()),
			() =>
				didTheRuntimeChange &&
				updateCallbackOffsets(callbacks, mainElements, options, totalRuntime()),
			() => fillResets(cssStyleReset, mainElements),
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
			// () =>
			// 	fillReadouts(
			// 		readouts,
			// 		{ main: mainElements, secondary: secondaryElements },
			// 		{ keyframes: state.keyframes, resets: cssStyleReset }
			// 	),
			// //() => filterReadouts(readouts, (element) => secondaryElements.delete(element)),
			// () => adjustForDisplayNone(readouts),
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
