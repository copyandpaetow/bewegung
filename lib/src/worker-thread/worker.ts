import { MainMessages, Result, TreeElement, TreeRepresentation, WorkerMessages } from "../types";
import {
	changesInScale,
	hasObjectFit,
	isCurrentlyInViewport,
	isEntryVisible,
} from "../utils/predicates";
import { useWorker } from "../utils/use-worker";
import { setImageKeyframes } from "./image-differences";
import { setDefaultKeyframes } from "./keyframes";
import {
	getFromResults,
	setHiddenElementOverrides,
	setParentToRelative,
	updateOverrideStore,
} from "./overrides";
import { transformDomRepresentation } from "./transforms";
import { diffDomTrees } from "./tree-diffing";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const domStore = new Map<string, TreeRepresentation>();
const overrideStore = new Map<string, Partial<CSSStyleDeclaration>>();

const getKeyframes = (oldDom: TreeRepresentation, newDom: TreeRepresentation) => {
	const results = {
		immediate: new Map<string, Result>(),
		delayed: new Map<string, Result>(),
	};

	diffDomTrees(oldDom, newDom, (dimensions, differences, parentDimensions) => {
		const key = dimensions[0].key;
		const isChangingInScale = changesInScale(differences);
		const keyframes =
			isChangingInScale && hasObjectFit(dimensions)
				? setImageKeyframes(differences, dimensions)
				: setDefaultKeyframes(differences, dimensions, isChangingInScale);

		isCurrentlyInViewport(dimensions)
			? results.immediate.set(key, keyframes)
			: results.delayed.set(key, keyframes);

		//if the element is not visible in the end (removed/display: none), we need to override that
		if (!isEntryVisible(dimensions[1])) {
			setHiddenElementOverrides(dimensions[1], parentDimensions?.[1], keyframes);
			setParentToRelative(
				parentDimensions?.[1],
				getFromResults(parentDimensions?.[1].key, results)
			);
		}

		updateOverrideStore(dimensions, keyframes, overrideStore);
	});

	const rootKey = (newDom[0] as TreeElement).key;
	const rootResult = getFromResults(rootKey, results);
	if (rootResult) {
		const overrides = (rootResult[1] ??= {});
		overrides.contain = "layout inline-size";
	}

	return results;
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	const key = domRepresentations.key;
	const dom = transformDomRepresentation(domRepresentations.dom, overrideStore);

	if (!domStore.has(key)) {
		domStore.set(key, dom);
		return;
	}

	const result = getKeyframes(domStore.get(key)!, dom);
	const delayedWorker = workerAtom(`sendDelayedAnimationData-${key}`);

	console.log(result, overrideStore);

	workerAtom(`sendAnimationData-${key}`).reply(`animationData-${key}`, result.immediate);

	workerAtom(`receiveDelayed-${key}`).onMessage(() => {
		result.delayed.forEach((result, resultKey) => {
			delayedWorker.reply(`delayedAnimationData-${key}`, new Map([[resultKey, result]]));
		});
	});
});
