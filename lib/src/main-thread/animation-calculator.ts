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
import { filterPrimaryRoots, labelElements } from "./label-elements";
import { observeDom } from "./observe-dom";
import {
	getRelativeTimings,
	getTotalRuntime,
	separateOverlappingEntries,
	sortRoots,
} from "./update-timings";

export const restoreElements = async (resets: Map<HTMLElement, Map<string, string>>) => {
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
	querySelectorAll(`[${Attributes.removable}]`).forEach((element) => {
		element.remove();
	});
	querySelectorAll(`[${Attributes.key}*='_']`).forEach((element) => {
		Object.keys(element.dataset).forEach((attributeName) => {
			if (attributeName.includes("bewegung")) {
				delete element.dataset[attributeName];
			}
		});
	});
};

export type Queue = { next(callback: () => Promise<any>): void };

export const createQueue = (): Queue => {
	let currentPromise: Promise<any> = Promise.resolve();

	return {
		next(callback: () => Promise<any>) {
			currentPromise = currentPromise.then(callback);
		},
	};
};

const getDomUpdates = (props: NormalizedProps[], totalRuntime: number) => {
	const withRelativeTiming = getRelativeTimings(props, totalRuntime);
	const withSeperatedOverlappingEntries = separateOverlappingEntries(withRelativeTiming);

	//we need the inital dimensions from all participating elements so we just say there is something at time 0 (if there isnt)
	const initalRead = withSeperatedOverlappingEntries
		.sort(sortRoots)
		.filter(filterPrimaryRoots)
		.map((root) => {
			if (root.end === 0) {
				return root;
			}

			return {
				...root,
				callback: new Set<VoidFunction>(),
				end: 0,
				start: 0,
			};
		});

	const withMergedEntryWithSameTiming = new Map([[0, initalRead]]);
	//some entries could happen at the same time, but in different places in the dom
	//it might make sense to group them
	withSeperatedOverlappingEntries.forEach((entry) => {
		const offset = entry.end;
		const existing = withMergedEntryWithSameTiming.get(offset) ?? [];

		withMergedEntryWithSameTiming.set(offset, existing.concat(entry));
	});

	return withMergedEntryWithSameTiming;
};

const workerManager = getWorker();

//?generator as performance tool?
export const fetchAnimationData = async (
	normalizedProps: NormalizedProps[],
	finishPromise: Resolvable<Map<string, Animation>>
): Promise<Map<string, Animation>> => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	const totalRuntime = getTotalRuntime(normalizedProps);
	const domUpdates = getDomUpdates(normalizedProps, totalRuntime);
	const callbacks = normalizedProps.flatMap((entry) => entry.callback);

	try {
		await labelElements(normalizedProps, worker);
		await observeDom(domUpdates, worker);
		const resets = getElementResets();
		const data = (await worker("animationData").onMessage(
			(result) => result
		)) as ResultTransferable;

		const animations = await createAnimations(data, callbacks, totalRuntime);
		const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

		timekeeper.oncancel = async () => {
			const awaitedResets = await resets;
			restoreElements(awaitedResets);
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
			callbacks.forEach(execute);
			finishPromise.reject(animations);
		};

		return Promise.resolve(animations);
	}
};
