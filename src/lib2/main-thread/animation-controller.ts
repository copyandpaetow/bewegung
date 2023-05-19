import { AnimationController, MainMessages, ResultTransferable, WorkerMessages } from "../types";
import { Attributes } from "../utils/constants";
import { nextRaf, querySelectorAll } from "../utils/helper";
import { getWorker, useWorker } from "../utils/use-worker";
import { getElementResets, createAnimations } from "./create-animation";
import { observeDom } from "./observe-dom";
import { onDomChange } from "./watch-dom-changes";

const workerManager = getWorker();

const restoreElements = (elementResets: Map<HTMLElement, Map<string, string>>) => {
	querySelectorAll(`[${Attributes.removable}], [${Attributes.key}*="added"]`).forEach((element) => {
		console.log("remove element: ", element);
		elementResets.delete(element);
		element.remove();
	});

	elementResets.forEach((attributes, element) => {
		attributes.forEach((value, key) => {
			element.setAttribute(key, value);
		});
	});
};

export const removeDataAttributes = () => {
	querySelectorAll(`[${Attributes.key}]`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

const setAnimationProgress = (animations: Map<string, Animation>, progress: null | number) => {
	if (!progress) {
		return;
	}

	animations.forEach((animation) => (animation.currentTime = progress));
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
	let progress: null | number = null;

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
			timekeeper.onfinish = () =>
				requestAnimationFrame(() => {
					removeDataAttributes();
					progress = null;
				});
			setAnimationProgress(animations, progress);
		} catch (error) {
			api.cancel();
		}
		return animations as Map<string, Animation>;
	};

	const watchDomForChanges = () => {
		disconnect = onDomChange(async () => {
			disconnect?.();
			disconnect = null;
			data = null;
			if (animations) {
				progress = timekeeper.currentTime;
				await api.cancel();
				animations = null;

				await nextRaf();
				//api.pause();
			}
		});
	};

	const api = {
		async prefetch() {
			await getData();
			watchDomForChanges();
		},
		async play() {
			(await getAnimations()).forEach((animation) => animation.play());
			console.log(`calculation took ${Date.now() - time}ms`);
		},
		async scroll(progress: number, done: boolean) {
			(await getAnimations()).forEach((animation) => (animation.currentTime = progress));

			if (done) {
				api.finish();
			}
		},
		async pause() {
			(await getAnimations()).forEach((animation) => animation.pause());
			requestAnimationFrame(watchDomForChanges);
		},
		async cancel() {
			if (animations) {
				(await getAnimations()).forEach((animation) => animation.cancel());
			}
			restoreElements(await resets!);
		},

		finish() {
			if (animations) {
				getAnimations().then((allAnimations) => {
					allAnimations.forEach((animation) => animation.finish());
				});
				return;
			}
			callbacks.get(1)!.forEach((cb) => cb());
		},
	};

	return api;
};
