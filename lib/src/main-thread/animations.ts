import { Attributes, Messenger, NormalizedOptions, ResultTransferable } from "../types";
import { applyCSSStyles, nextRaf } from "../utils/helper";
import { addKeyToNewlyAddedElement, observeDom, readdRemovedNodes } from "./observe-dom";
import { iterateAddedElements, iterateRemovedElements, observe } from "./observer-helper";

const extractAnimationOptions = (options: NormalizedOptions): KeyframeEffectOptions => ({
	duration: options.duration,
	delay: options.startTime,
	endDelay: options.totalRuntime - options.endTime,
	easing: options.easing,
	composite: "add",
});

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

class CheckPointAnimation extends Animation {
	#endTime = 0;
	#startTime = 0;

	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super(effect, timeline);
		if (!effect) {
			return;
		}

		const computedTiming = effect.getTiming();

		this.#startTime = computedTiming.delay as number;
		this.#endTime = this.#startTime + (computedTiming.duration as number);
	}

	play() {
		super.effect?.updateTiming({ duration: 0, delay: this.#startTime, endDelay: 0 });
		super.play();
	}
	reverse() {
		super.effect?.updateTiming({ duration: 0, delay: 0, endDelay: this.#endTime });
		super.reverse();
	}

	set currentTime(time: number) {
		super.currentTime = time;

		if (time >= this.#startTime && time <= this.#endTime) {
			this.finish();
		}
	}
}

const alignWithTimekeeper = (current: Animation, timekeeper: Animation) => {
	current.startTime = timekeeper.startTime;
	current.currentTime = timekeeper.currentTime ?? 0;
	current.playbackRate = timekeeper.playbackRate;

	return current;
};

export const animationsController = (
	options: NormalizedOptions,
	worker: Messenger,
	timekeeper: Animation
) => {
	const animations = new Map<string, Animation>();
	const animationOptions = extractAnimationOptions(options);
	const checkpoint = new CheckPointAnimation(new KeyframeEffect(null, null, animationOptions));
	animations.set("checkpoint", checkpoint);

	checkpoint.addEventListener(
		"finish",
		() => {
			animations.delete("checkpoint");
			observeDom(options, worker);
		},
		{ once: true }
	);

	animations.set("checkpoint", alignWithTimekeeper(checkpoint, timekeeper));

	worker.on(`animationData-${options.key}`, async ({ data, error }) => {
		if (error) {
			timekeeper.cancel();
			console.error(error);
			return;
		}

		const observerCallback: MutationCallback = (entries, observer) => {
			observer.disconnect();

			iterateRemovedElements(entries, readdRemovedNodes);
			iterateAddedElements(entries, addKeyToNewlyAddedElement);

			setAnimations(data as ResultTransferable, animationOptions).forEach((anim, key) => {
				animations.set(key, alignWithTimekeeper(anim, timekeeper));
			});

			worker.send("startDelayed", options.key);
		};

		await nextRaf();
		observe(new MutationObserver(observerCallback));
		options.from?.();
		options.to?.();
	});

	worker.on(`delayedAnimationData-${options.key}`, ({ data, error }) => {
		if (error) {
			timekeeper.cancel();
			console.error(error);
			return;
		}

		setAnimations(data as ResultTransferable, animationOptions).forEach((anim, key) => {
			animations.set(key, alignWithTimekeeper(anim, timekeeper));
		});
	});

	return animations;
};
