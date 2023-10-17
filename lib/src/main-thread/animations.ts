import { AtomicWorker, Direction, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes } from "../utils/constants";
import { applyCSSStyles, nextRaf } from "../utils/helper";
import { addKeyToNewlyAddedElement, observeDom, readdRemovedNodes } from "./observe-dom";
import { iterateAddedElements, iterateRemovedElements, observe } from "./observer-helper";

const extractAnimationOptions = (options: NormalizedOptions): KeyframeEffectOptions => {
	return {
		duration: options.duration,
		delay: options.startTime,
		endDelay: options.totalRuntime - options.endTime,
		easing: options.easing,
		composite: "add",
	};
};

const setAnimations = (results: ResultTransferable, options: KeyframeEffectOptions) => {
	const animations = new Map<string, Animation>();

	results.forEach(([keyframes, overrides], key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));

		if (overrides) {
			element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
			applyCSSStyles(element, overrides);
		}
	});

	return animations;
};

const createAnimationsWithCheckpoints = (
	options: NormalizedOptions,
	worker: AtomicWorker,
	direction: Direction
) => {
	const animations = new Map<string, Animation>();
	const forwardCheckpoint = new Animation(
		new KeyframeEffect(null, null, {
			delay: options.startTime,
			duration: 0,
		})
	);

	const backwardCheckpoint = new Animation(
		new KeyframeEffect(null, null, {
			endDelay: options.totalRuntime - options.endTime,
			duration: 0,
		})
	);

	const callback = [
		() => {
			observeDom(options, worker);
			animations.forEach((anim) => anim.cancel());
			animations.clear();
		},
	];

	forwardCheckpoint.addEventListener("finish", () => {
		if (direction.current === "backward") {
			return;
		}

		callback.pop()?.();
	});

	backwardCheckpoint.addEventListener("finish", () => {
		if (direction.current === "forward") {
			return;
		}
		callback.pop()?.();
	});

	animations.set("forward", forwardCheckpoint);
	animations.set("backward", backwardCheckpoint);

	return animations;
};

const alignAnimationWithTimekeeper = (
	from: Map<string, Animation>,
	to: Map<string, Animation>,
	timekeeper: Animation
) => {
	from.forEach((anim, key) => {
		anim.startTime = timekeeper.startTime;
		anim.currentTime = timekeeper.currentTime;
		anim.playbackRate = timekeeper.playbackRate;
		to.set(key, anim);
	});
};

export const animationsController = (
	options: NormalizedOptions,
	worker: AtomicWorker,
	timekeeper: Animation,
	direction: Direction
) => {
	const animations = new Map<string, Animation>();
	const animationOptions = extractAnimationOptions(options);

	alignAnimationWithTimekeeper(
		createAnimationsWithCheckpoints(options, worker, direction),
		animations,
		timekeeper
	);
	worker(`animationData-${options.key}`).onMessage(async (results) => {
		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();

			iterateRemovedElements(entries, readdRemovedNodes);
			iterateAddedElements(entries, addKeyToNewlyAddedElement);

			alignAnimationWithTimekeeper(
				setAnimations(results, animationOptions),
				animations,
				timekeeper
			);

			worker(`startDelayed-${options.key}`).reply(`receiveDelayed-${options.key}`);
		};

		await nextRaf();
		observe(new MutationObserver(observerCallback));
		options.from?.();
		options.to?.();
	});

	worker(`delayedAnimationData-${options.key}`).onMessage((results) => {
		alignAnimationWithTimekeeper(setAnimations(results, animationOptions), animations, timekeeper);
	});

	return animations;
};
