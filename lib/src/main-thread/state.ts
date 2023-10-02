import { AtomicWorker, NormalizedOptions } from "../types";
import { createAnimations } from "./create-animation";
import { getTotalRuntime } from "./normalize-props";
import { removeDataAttributes, removeElements, replaceImagePlaceholders } from "./resets";
import { getReactivity } from "./watch-dom-changes";

const cleanup = () =>
	requestAnimationFrame(() => {
		replaceImagePlaceholders();
		removeElements();
		removeDataAttributes();
	});

export const deriveSequenceState = (options: NormalizedOptions[], worker: AtomicWorker) => {
	const totalRuntime = getTotalRuntime(options);
	const reactivity = getReactivity(options);

	const globalTimekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	globalTimekeeper.onfinish = globalTimekeeper.oncancel = () => {
		reactivity.disconnect();
		cleanup();
	};

	return {
		reactivity,
		totalRuntime,
		calculations: options.map((option) => createAnimations(option, worker)),
		timer: options.map((_) => 0),
		animations: new Map<number, Map<string, Animation>>(),
		inProgress: false,
		currentTime: 0,
		startTime: 0,
		globalTimekeeper,
	};
};

export const deriveState = (options: NormalizedOptions, worker: AtomicWorker) => {
	const reactivity = getReactivity([options]);

	options.timekeeper.onfinish = options.timekeeper.oncancel = () => {
		reactivity.disconnect();
		cleanup();
	};

	return {
		reactivity,
		caluclations: createAnimations(options, worker),
		animations: new Map<string, Animation>(),
		inProgress: false,
	};
};
