import { State } from "../types";

export const setCallbackAnimations = (state: State) => {
	const { animations, callbacks, mainElements, totalRuntime, onStart } = state;
	const allCallbacks = new Map<number, Set<VoidFunction>>();

	mainElements.forEach((element) => {
		const elementCallbacks = callbacks.get(element);

		elementCallbacks?.flat().forEach((currentCallback) => {
			const { offset, callback } = currentCallback;

			const previous = (allCallbacks.get(offset) ?? new Set<VoidFunction>()).add(callback);
			allCallbacks.set(offset, previous);
		});
	});

	const fakeCallbackElement = document.createElement("div");
	const callbackAnimation = new Animation(
		new KeyframeEffect(fakeCallbackElement, null, totalRuntime)
	);
	const sortedCallbackMap = new Map([...allCallbacks].sort((a, b) => a[0] - b[0]));

	function checkTime(animation: Animation, callbackMap: Map<number, Set<VoidFunction>>) {
		const progress = (animation.currentTime ?? 0) / totalRuntime;
		const [offset, callbacks] = callbackMap.entries().next().value as [number, Set<VoidFunction>];

		if (offset <= progress) {
			callbacks.forEach((callback) => callback());
			callbackMap.delete(offset);
		}

		if (animation.playState === "finished") {
			return;
		}

		requestAnimationFrame(() => checkTime(animation, callbackMap));
	}
	onStart.set(fakeCallbackElement, [() => checkTime(callbackAnimation, sortedCallbackMap)]);
	animations.set(fakeCallbackElement, callbackAnimation);
};
