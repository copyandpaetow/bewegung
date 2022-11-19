import { State } from "../types";

export const setCallbackAnimations = (state: State) => {
	const { animations, callbacks, mainElements, totalRuntime, onStart, timeKeeper } = state;
	const allCallbacks = new Map<number, Set<VoidFunction>>();
	//@ts-expect-error
	const target = timeKeeper.effect.target as HTMLElement;

	mainElements.forEach((element) => {
		const elementCallbacks = callbacks.get(element);

		elementCallbacks?.flat().forEach((currentCallback) => {
			const { offset, callback } = currentCallback;

			const previous = (allCallbacks.get(offset) ?? new Set<VoidFunction>()).add(callback);
			allCallbacks.set(offset, previous);
		});
	});

	const sortedCallbackMap = new Map([...allCallbacks].sort((a, b) => a[0] - b[0]));

	function checkTime(animation: Animation, callbackMap: Map<number, Set<VoidFunction>>) {
		const progress = (animation.currentTime ?? 0) / totalRuntime;
		const { done, value } = callbackMap.entries().next();
		if (done) {
			return;
		}

		const [offset, callbacks] = value as [number, Set<VoidFunction>];

		if (offset <= progress) {
			callbacks?.forEach((callback) => callback());
			callbackMap?.delete(offset);
		}

		if (animation.playState === "finished") {
			return;
		}

		requestAnimationFrame(() => checkTime(animation, callbackMap));
	}
	onStart.set(target, [() => checkTime(timeKeeper, sortedCallbackMap)]);
	animations.set(target, timeKeeper);
};
