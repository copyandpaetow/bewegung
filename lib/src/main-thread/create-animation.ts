import { AtomicWorker, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes } from "../utils/constants";
import { applyCSSStyles, nextRaf } from "../utils/helper";
import { extractAnimationOptions } from "./normalize-props";
import { addKeyToNewlyAddedElement, readdRemovedNodes } from "./observe-dom";
import { iterateAddedElements, iterateRemovedElements, observe } from "./observer-helper";

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

const alignAnimations = (animation: Animation, timekeeper: Animation) => {
	animation.currentTime = timekeeper.currentTime;

	switch (timekeeper.playState) {
		case "running":
			animation.play();
			break;
		case "paused":
			animation.pause();
			break;
		case "finished":
			animation.finish();
			break;

		default:
			break;
	}
};

export const createAnimations = (options: NormalizedOptions, worker: AtomicWorker) => {
	const animations = new Map([["timekeeper", options.timekeeper]]);
	const resultWorker = worker(`animationData-${options.key}`);
	const delayedWorker = worker(`delayedAnimationData-${options.key}`);
	const animationOptions = extractAnimationOptions(options);

	const receiveAnimation = new Promise<Map<string, Animation>>((resolve) => {
		resultWorker.onMessage(async (results) => {
			const observerCallback: MutationCallback = (entries, observer) => {
				observer.disconnect();

				iterateRemovedElements(entries, readdRemovedNodes);
				iterateAddedElements(entries, addKeyToNewlyAddedElement);

				setAnimations(results, animationOptions).forEach((anim, key) => {
					alignAnimations(anim, options.timekeeper);
					animations.set(key, anim);
				});

				worker(`startDelayed-${options.key}`).reply(`receiveDelayed-${options.key}`);
				resolve(animations);
			};

			await nextRaf();
			observe(new MutationObserver(observerCallback));
			options.from?.();
			options.to?.();
		});
	});
	delayedWorker.onMessage((results) => {
		setAnimations(results, animationOptions).forEach((anim, key) => {
			alignAnimations(anim, options.timekeeper);
			animations.set(key, anim);
		});
	});

	return receiveAnimation;
};
