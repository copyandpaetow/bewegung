import { initialState, initialAnimationState, initialWatchState } from "./initial-states";
import { normalizeProps } from "./normalize/props";
import { computeSecondaryProperties } from "./prepare/affected-elements";
import { updateCallbackOffsets, updateKeyframeOffsets } from "./prepare/offsets";
import { calculateTotalRuntime } from "./prepare/runtime";
import { setState } from "./prepare/state";
import { setCallbackAnimations } from "./read/callbacks";
import { setDefaultCalculations } from "./read/calculations-default";
import { setImageCalculations } from "./read/calculations-image";
import { restoreOriginalStyle } from "./read/apply-styles";
import { setDomReadouts } from "./read/dom";
import { addStyleOverrides } from "./read/overrides";
import { adjustReadoutsForDisplayNone } from "./read/adjust-readouts";
import { scheduleCallback } from "./scheduler";
import { AnimationEntry, BewegungProps, Result } from "./types";
import { observerDimensions } from "./watch/dimensions";
import { observeMutations } from "./watch/mutations";
import { observeResizes } from "./watch/resizes";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ??= window.requestAnimationFrame;
}

export const getAnimations = (...props: BewegungProps) =>
	new Promise<Result>((resolve) => {
		const state = initialState();

		init();

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
				() => setDomReadouts(animationState, state),
				() => adjustReadoutsForDisplayNone(animationState),
				() => addStyleOverrides(animationState, state),
				() => setDefaultCalculations(animationState, state),
				() => setImageCalculations(animationState, state),
				() => setCallbackAnimations(state),
				complete,
			];

			tasks.forEach(scheduleCallback);
		}

		function scroll(progress: number, done?: boolean) {
			return (
				-1 *
				Math.min(Math.max(progress, 0.001), done === undefined ? 1 : 0.999) *
				state.totalRuntime
			);
		}

		function complete() {
			resolve({
				animations: state.animations,
				timekeeper: state.timeKeeper,
				resetStyle: (element) => restoreOriginalStyle(element, state.cssStyleReset.get(element)),
				onStart: (element) => state.onStart.get(element)?.forEach((callback) => callback()),
				onEnd: (element) => state.onEnd.get(element)?.forEach((callback) => callback()),
				observe: (before, after) => watch(before, after),
				scroll,
			});
		}

		function watch(before: VoidFunction, after: VoidFunction) {
			const watchState = initialWatchState();

			let resizeIdleCallback: NodeJS.Timeout | undefined;

			const disconnect: VoidFunction = () => {
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

			const throttledCallback = (callback: VoidFunction) => {
				resizeIdleCallback && clearTimeout(resizeIdleCallback);
				resizeIdleCallback = setTimeout(() => {
					disconnect();
					before();
					callback();
					after();
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

			return disconnect;
		}
	});
