import {
	AtomicWorker,
	MainMessages,
	NormalizedProps,
	PropsWithRelativeTiming,
	ResultTransferable,
	TimelineEntry,
	WorkerMessages,
} from "../types";
import { Attributes } from "../utils/constants";
import { execute, nextRaf, querySelectorAll } from "../utils/helper";
import { getWorker, useWorker } from "../utils/use-worker";
import { createAnimations, getElementResets } from "./create-animation";
import { labelRootElements } from "./label-elements";
import { observeDom } from "./observe-dom";
import { computeCallbacks, getRelativeTimings, getTotalRuntime } from "./update-timings";

const workerManager = getWorker();

const restoreElements = async (elementResets: Promise<Map<HTMLElement, Map<string, string>>>) => {
	const resets = await elementResets;
	await nextRaf();
	querySelectorAll(`[${Attributes.removable}], [${Attributes.key}*="added"]`).forEach((element) => {
		resets.delete(element);
		element.remove();
	});

	resets.forEach((attributes, element) => {
		attributes.forEach((value, key) => {
			element.setAttribute(key, value);
		});
	});
};

export const removeDataAttributes = () => {
	querySelectorAll(`[${Attributes.key}*='_']`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

const getEasingsFromData = (data: PropsWithRelativeTiming[]) => {
	const easings = new Map<string, TimelineEntry[]>();

	data.forEach((entry) => {
		const { start, end, easing, root } = entry;
		const key = root.dataset.bewegungsKey!;
		easings.set(key, (easings.get(key) ?? []).concat({ start, end, easing }));
	});
	return easings;
};

const sendMetaData = (data: PropsWithRelativeTiming[], worker: AtomicWorker) => {
	const { reply } = worker("metaData");

	const metaData = {
		allOffsets: data.map((entry) => entry.end),
		easings: getEasingsFromData(data),
	};

	reply("sendMetaData", metaData);
};

// const getMotionPreference = (config?: BewegungsConfig) =>
// 	config?.reduceMotion ?? window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

//TODO: maybe this could be done with a generator => every step yields and is either run through with a for of loop or give the user the controll to advance them manually
export const fetchAnimationData = async (
	normalizedProps: NormalizedProps[]
): Promise<Map<string, Animation>> => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	const totalRuntime = getTotalRuntime(normalizedProps);
	const dataWithRelativeTimings = getRelativeTimings(normalizedProps, totalRuntime);
	const callbacks = computeCallbacks(dataWithRelativeTimings);

	try {
		await labelRootElements(normalizedProps);
		sendMetaData(dataWithRelativeTimings, worker);
		await observeDom(callbacks, worker);
		const resets = getElementResets();
		const data = (await worker("animationData").onMessage(
			(result) => result
		)) as ResultTransferable;
		console.log(data);

		const animations = await createAnimations(data, callbacks, totalRuntime);
		const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

		timekeeper.oncancel = () => restoreElements(resets);
		timekeeper.onfinish = () => {
			requestAnimationFrame(() => {
				removeDataAttributes();
			});
		};

		animations.set("timekeeper", timekeeper);
		return animations;
	} catch (error) {
		console.warn("something weird happend");
		const timekeeper = new Animation(new KeyframeEffect(null, null, 1));
		timekeeper.onfinish = () => callbacks.get(1)!.forEach(execute);

		return Promise.resolve(new Map([["timekeeper", timekeeper]]));
	}
};
