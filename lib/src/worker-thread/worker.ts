import { MainMessages, Result, TreeElement, TreeRepresentation, WorkerMessages } from "../types";
import { changesInScale, isEntryVisible, isImage } from "../utils/predicates";
import { useWorker } from "../utils/use-worker";
import { setDelayedStatus } from "./dimensions";
import { calculateImageDifferences } from "./image-differences";
import { calculateWrapperData } from "./image-keyframes";
import { setDefaultKeyframes } from "./keyframes";
import { setOverrides, setParentToRelative } from "./overrides";
import { transformDomRepresentation } from "./transforms";
import { diffDomTrees } from "./tree-diffing";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const domStore = new Map<string, TreeRepresentation>();
const delayedStore = new Set<string>();

const getKeyframes = (oldDom: TreeRepresentation, newDom: TreeRepresentation) => {
	const results = new Map<string, Result>();

	diffDomTrees(oldDom, newDom, (dimensions, differences, parentDimensions) => {
		const key = dimensions[0].key;
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
	});

	const rootKey = (newDom[0] as TreeElement).key;
	if (results.has(rootKey)) {
		const overrides = (results.get(rootKey)![1] ??= {});
		overrides.contain = "layout inline-size";
	}

	return results;
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	const key = domRepresentations.key;
	const dom = transformDomRepresentation(domRepresentations.dom);

	if (!domStore.has(key)) {
		domStore.set(key, dom);
		return;
	}

	const immediate = new Map<string, Result>();
	const delayed = new Map<string, Result>();

	getKeyframes(domStore.get(key)!, dom).forEach((result, key) => {
		if (delayedStore.has(key)) {
			delayed.set(key, result);
			return;
		}
		immediate.set(key, result);
	});

	workerAtom(`sendAnimationData-${key}`).reply(`animationData-${key}`, immediate);

	domStore.clear();
	delayedStore.clear();

	const delayedWorker = workerAtom(`sendDelayedAnimationData-${key}`);

	workerAtom(`receiveDelayed-${key}`).onMessage(() => {
		delayed.forEach((result, resultKey) => {
			delayedWorker.reply(`delayedAnimationData-${key}`, new Map([[resultKey, result]]));
		});
	});
});
