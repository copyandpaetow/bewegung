import { MainMessages, Result, TreeElement, TreeRepresentation, WorkerMessages } from "../types";
import { changesInScale, isElementUnchanged, isEntryVisible, isImage } from "../utils/predicates";
import { useWorker } from "../utils/use-worker";
import {
	getDimensions,
	getParentDimensions,
	setDelayedStatus,
	updateDimensions,
} from "./dimensions";
import { calculateImageDifferences } from "./image-differences";
import { calculateWrapperData } from "./image-keyframes";
import { calculateDifferences, setDefaultKeyframes } from "./keyframes";
import { setOverrides, setParentToRelative } from "./overrides";
import { transformDomRepresentation } from "./transforms";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const dimensionStore = new Map<string, Map<string, TreeElement>>();
const delayedStore = new Set<string>();

const getKeyframes = (dom: TreeRepresentation, dimensionStore: Map<string, TreeElement>) => {
	const results = new Map<string, Result>();

	const updateStore = (currentNode: TreeRepresentation, parentNode?: TreeRepresentation) => {
		const current = currentNode[0] as TreeElement;
		const children = currentNode[1] as TreeRepresentation[];
		const key = current.key;
		const dimensions = getDimensions(current, dimensionStore);

		//if both entries are hidden the element was hidden in general and doesnt need any animations as well as their children
		if (dimensions.every((entry) => !isEntryVisible(entry))) {
			return;
		}

		const parentDimensions = getParentDimensions(parentNode, dimensionStore);
		const differences = calculateDifferences(dimensions, parentDimensions);

		//if the element doesnt really change in the animation, we just skip it and continue with the children
		//we cant skip the whole tree because a decendent could still shrink
		if (differences.every(isElementUnchanged)) {
			children.forEach((entry) => {
				updateStore(entry, parentNode);
			});
			return;
		}

		//if the element is a changedImage we put it in a different store
		const isChangingInScale = changesInScale(differences);

		if (isChangingInScale && isImage(dimensions)) {
			results.set(`${key}-wrapper`, calculateWrapperData(dimensions, parentDimensions));
			results.set(key, [calculateImageDifferences(dimensions)]);
			setParentToRelative(parentDimensions?.at(-1), results);
		} else {
			results.set(key, [setDefaultKeyframes(differences, dimensions, isChangingInScale)]);
		}
		setDelayedStatus(dimensions, delayedStore);

		//if the element is not visible in the end (removed/display: none), we need to override that
		if (!isEntryVisible(dimensions[1])) {
			setOverrides(dimensions[1], parentDimensions?.[1], results.get(key)!);
			setParentToRelative(parentDimensions?.at(-1), results);
		}

		children.forEach((entry) => {
			updateStore(entry, currentNode);
		});
	};

	updateStore(dom);

	const rootKey = (dom[0] as TreeElement).key;
	if (results.has(rootKey)) {
		const overrides = (results.get(rootKey)![1] ??= {});
		overrides.contain = "layout inline-size";
	}

	return results;
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	const key = domRepresentations.key;
	const dom = transformDomRepresentation(domRepresentations.dom);

	if (!dimensionStore.has(key)) {
		dimensionStore.set(key, updateDimensions(dom));
		return;
	}

	const immediate = new Map<string, Result>();
	const delayed = new Map<string, Result>();

	getKeyframes(dom, dimensionStore.get(key)!).forEach((result, key) => {
		console.log(key, result);

		if (delayedStore.has(key)) {
			delayed.set(key, result);
			return;
		}
		immediate.set(key, result);
	});

	workerAtom(`sendAnimationData-${key}`).reply(`animationData-${key}`, immediate);

	dimensionStore.clear();
	delayedStore.clear();

	const delayedWorker = workerAtom(`sendDelayedAnimationData-${key}`);

	workerAtom(`receiveDelayed-${key}`).onMessage(() => {
		delayed.forEach((result, resultKey) => {
			delayedWorker.reply(`delayedAnimationData-${key}`, new Map([[resultKey, result]]));
		});
	});
});
