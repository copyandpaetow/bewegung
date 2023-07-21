import {
	MainMessages,
	NormalizedProps,
	Resolvable,
	ResultTransferable,
	WorkerMessages,
} from "../types";
import { Attributes } from "../utils/constants";
import { execute, nextRaf, querySelectorAll } from "../utils/helper";
import { getWorker, useWorker } from "../utils/use-worker";
import { createAnimations, getElementResets } from "./create-animation";
import { recordInitialDom } from "./label-elements";
import { observeDom } from "./observe-dom";
import { getRelativeTimings, getTotalRuntime, separateOverlappingEntries } from "./update-timings";

const workerManager = getWorker();

// const getMotionPreference = (config?: BewegungsConfig) =>
// 	config?.reduceMotion ?? window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

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

/*
- if we say that roots dont spill out, we can simplify the easings quite a bit
=> when creating the domTree we add the easing as parameter in the readout-function and set it like the offset for every element of a certain root
=> only in the case of "several entries with different easings have the same root" we would need to combine them

- we could start sending the trees back one by one and only appliying that related change only
=> we could split the work of creating so many animations

- in case of nested roots, we might need to pass the current calculations down to the other, nested tree
=> as long as there is an overlap in timing
=> depending on who comes first, that might get hard to calculate

- maybe it makes sense to decouple the dom representation from the dimensions
=> get the dom as nested object like before but only consistinng of an id string and a children array (sibilings needed?)
=> get the new dimensions as map like new Map([[id1, {...}], [id2, {...}]])
=> on dom changes, we get only the changed elements and create a new (smaller) dimension map
=> we get the target from the mutationObserver and read the siblings, childrens, and parents until we find an unchanged element
=> only if elements are added, we would need to update the representation


*/

//TODO: maybe this could be done with a generator => every step yields and is either run through with a for of loop or give the user the controll to advance them manually

export const fetchAnimationData = async (
	normalizedProps: NormalizedProps[],
	finishPromise: Resolvable<Map<string, Animation>>
): Promise<Map<string, Animation>> => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	const totalRuntime = getTotalRuntime(normalizedProps);
	const domUpdates = separateOverlappingEntries(getRelativeTimings(normalizedProps, totalRuntime));

	try {
		await recordInitialDom(normalizedProps, worker);
		await observeDom(domUpdates, worker);
		const resets = getElementResets();
		const data = (await worker("animationData").onMessage(
			(result) => result
		)) as ResultTransferable;

		const animations = await createAnimations(data, [], totalRuntime);
		const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

		timekeeper.oncancel = () => {
			restoreElements(resets);
			finishPromise.reject(animations);
		};
		timekeeper.onfinish = () => {
			requestAnimationFrame(() => {
				removeDataAttributes();
				finishPromise.resolve(animations);
			});
		};

		animations.set("timekeeper", timekeeper);
		return animations;
	} catch (error) {
		console.error("something weird happend: ", error);
		const timekeeper = new Animation(new KeyframeEffect(null, null, 1));
		const animations = new Map([["timekeeper", timekeeper]]);
		timekeeper.onfinish = () => {
			[].forEach(execute);
			finishPromise.reject(animations);
		};

		return Promise.resolve(animations);
	}
};
