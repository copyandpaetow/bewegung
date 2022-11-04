import { normalizeProps } from "./normalize/structure";
import { computeSecondaryProperties } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { calculateTotalRuntime } from "./prepare/runtime";
import { initialState, setState, initialWatchState } from "./prepare/state";
import { setCallbackAnimations } from "./read/animation-callbacks";
import { setDefaultCalculations } from "./read/animation-default";
import { setImageCalculations } from "./read/animation-image";
import { restoreOriginalStyle } from "./read/apply-styles";
import { initialAnimationState, setReadouts } from "./read/dom";
import { addStyleCallback } from "./read/style-callback";
import { adjustForDisplayNone } from "./read/update-calculations";
import { scheduleCallback } from "./scheduler";
import { AnimationEntry, BewegungProps, Result } from "./types";
import { observerDimensions } from "./watch/dimensions";
import { observeMutations } from "./watch/mutations";
import { observeResizes } from "./watch/resizes";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ||= window.requestAnimationFrame;
}

export const getAnimations = (...props: BewegungProps) =>
	new Promise<Result>((resolve, reject) => {
		const state = initialState();

		function init() {
			const animtionEntries: AnimationEntry[] = [];
			const tasks = [
				() => normalizeProps(animtionEntries, ...props),
				() => setState(state, animtionEntries),
				prepare,
			];

			tasks.forEach(scheduleCallback);
		}

		//TODO: put these code blocks into try catch blocks and try to come up with a fallback like animation with only applying styles
		//TODO: this could then also work for prefer reduced motion
		function prepare() {
			const { totalRuntime } = state;

			const tasks = [
				() => computeSecondaryProperties(state),
				() => calculateTotalRuntime(state),
				() => updateKeyframeOffsets(state, totalRuntime),
				() => updateCallbackOffsets(state, totalRuntime),
				read,
			];

			tasks.forEach(scheduleCallback);
		}

		function read() {
			const animationState = initialAnimationState();

			//if we are reacting and calculate entries again, we need to replace instead of push
			const tasks = [
				() => setReadouts(animationState, state),
				() => adjustForDisplayNone(animationState),
				() => addStyleCallback(animationState, state),
				() => setDefaultCalculations(animationState, state),
				() => setImageCalculations(animationState, state),
				() => setCallbackAnimations(state),
				() => console.log({ animationState, state }),
				complete,
			];

			tasks.forEach(scheduleCallback);
		}

		function complete() {
			resolve({
				animations: state.animations,
				callbackAnimations: state.animations,
				resetStyle: (element: HTMLElement) =>
					restoreOriginalStyle(element, state.cssStyleReset.get(element)!),
				onStart: (element: HTMLElement) =>
					state.onStart.get(element)?.forEach((callback) => callback()),
				onEnd: (element: HTMLElement) =>
					state.onEnd.get(element)?.forEach((callback) => callback()),
				observe: (playState: AnimationPlayState) => watch(playState),
			});
		}

		function watch(playState: AnimationPlayState) {
			if (playState !== "idle" && playState !== "paused") {
				return () => {};
			}
			const watchState = initialWatchState();

			let resizeIdleCallback: NodeJS.Timeout | undefined;

			const throttledCallback = (callback: VoidFunction) => {
				resizeIdleCallback && clearTimeout(resizeIdleCallback);
				resizeIdleCallback = setTimeout(() => {
					callback();
				}, 100);
			};

			const tasks = [
				() =>
					observeMutations(watchState, state, {
						partial: () => throttledCallback(read),
						full: () => throttledCallback(prepare),
					}),
				() => observeResizes(watchState, state, () => throttledCallback(read)),
				() => observerDimensions(watchState, state, () => throttledCallback(read)),
			];

			tasks.forEach(scheduleCallback);

			return () => {
				const { MO, RO, IO } = watchState;
				const { mainElements, secondaryElements } = state;
				MO?.disconnect();
				mainElements.forEach((element) => {
					IO.get(element)?.disconnect();
					RO.get(element)?.disconnect();
				});
				secondaryElements.forEach((element) => {
					IO.get(element)?.disconnect();
					RO.get(element)?.disconnect();
				});
			};
		}

		init();
	});
