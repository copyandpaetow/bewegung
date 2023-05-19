import { AnimationController, MainMessages, ResultTransferable, WorkerMessages } from "../types";
import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { getWorker, useWorker } from "../utils/use-worker";
import { getElementResets, createAnimations } from "./create-animation";
import { observeDom } from "./observe-dom";
import { onDomChange } from "./watch-dom-changes";

const workerManager = getWorker();

const restoreElements = (elementResets: Map<HTMLElement, Map<string, string>>) => {
	elementResets.forEach((attributes, element) => {
		if (element.dataset.bewegungsRemoveable) {
			elementResets.delete(element);
			element.remove();
			return;
		}

		attributes.forEach((value, key) => {
			element.setAttribute(key, value);
		});
	});
};

const removeDataAttributes = () => {
	querySelectorAll(`[${Attributes.key}]`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

export const animationController = (
	callbacks: Map<number, VoidFunction[]>,
	totalRuntime: number,
	timekeeper: Animation
): AnimationController => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	let data: null | ResultTransferable = null;
	let animations: null | Map<string, Animation> = null;
	let resets: null | Promise<Map<HTMLElement, Map<string, string>>> = null;
	let disconnect: null | VoidFunction = null;
	let time = Date.now();

	const getData = async () => {
		if (data) {
			return;
		}
		await nextRaf();
		await observeDom(callbacks, worker);
		await worker("animationData").onMessage((result) => {
			data = result;
		});

		resets = getElementResets();
	};

	const getAnimations = async () => {
		if (animations) {
			return animations;
		}

		try {
			disconnect?.();
			await getData();
			animations = await createAnimations(data!, callbacks, totalRuntime);
			animations.set("timekeeper", timekeeper);
		} catch (error) {
			api.cancel();
		}
		return animations as Map<string, Animation>;
	};

	const reactivity = () => {
		disconnect = onDomChange(() => {
			data = null;
			animations = null;
			disconnect?.();
			disconnect = null;
		});
	};

	const cleanup = () => {
		requestAnimationFrame(removeDataAttributes);
	};

	const api = {
		async preload() {
			await getData();
			reactivity();
		},
		async play() {
			(await getAnimations()).forEach((animation) => animation.play());
			console.log(`calculation took ${Date.now() - time}ms`);
		},
		async scroll(progress, done) {
			(await getAnimations()).forEach((animation) => (animation.currentTime = progress));

			if (done) {
				api.finish();
			}
		},
		async pause() {
			(await getAnimations()).forEach((animation) => animation.pause());
			reactivity();
		},
		async cancel() {
			if (animations) {
				(await getAnimations()).forEach((animation) => animation.cancel());
			}
			restoreElements(await resets!);
			cleanup();
		},

		finish() {
			if (animations) {
				getAnimations().then((allAnimations) => {
					allAnimations.forEach((animation) => animation.finish);
				});
			} else {
				callbacks.get(1)!.forEach((cb) => cb());
			}
			cleanup();
		},
	};

	return api;
};
