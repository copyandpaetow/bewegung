import { Result, TreeElement, TreeRepresentation } from "../types";
import { isEntryVisible } from "../utils/helper";
import { WorkerMessanger } from "../utils/worker-messanger";
import { setImageKeyframes, setKeyframes } from "./keyframes";
import {
	getFromResults,
	setHiddenElementOverrides,
	setParentToRelative,
	updateOverrideStore,
} from "./overrides";
import { parseDomRepresentation } from "./parse";
import { diffDomTrees } from "./tree-diffing";
import {
	changesAspectRatio,
	containRootChanges,
	hasObjectFit,
	isCurrentlyInViewport,
} from "./worker-helper";

//@ts-expect-error
const itself = self as Worker;
const messanger = new WorkerMessanger(itself);

const domStore = new Map<string, TreeRepresentation>();
const overrideStore = new Map<string, Partial<CSSStyleDeclaration>>();
const delayedResultStore = new Map<string, Map<string, Result>>();

const getKeyframeResults = (oldDom: TreeRepresentation, newDom: TreeRepresentation) => {
	const results = {
		immediate: new Map<string, Result>(),
		delayed: new Map<string, Result>(),
	};

	diffDomTrees(oldDom, newDom, (dimensions, differences, parentDimensions) => {
		const key = dimensions[0].key;
		const hasChangedAspectRatio = changesAspectRatio(dimensions, differences);
		const keyframes =
			hasObjectFit(dimensions) && hasChangedAspectRatio
				? setImageKeyframes(differences, dimensions)
				: setKeyframes(differences, dimensions, hasChangedAspectRatio);

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

	containRootChanges(getFromResults((newDom[0] as TreeElement).key, results));

	return results;
};

messanger.on("domChanges", ({ data, error }) => {
	if (error) {
		console.error(error);
		return;
	}
	const [key, dom] = data!;
	const paresdDom = parseDomRepresentation(dom!, overrideStore);

	if (!domStore.has(key)) {
		domStore.set(key, paresdDom);
		return;
	}

	const { delayed, immediate } = getKeyframeResults(domStore.get(key)!, paresdDom);

	messanger.send(`animationData-${key}`, immediate);
	delayedResultStore.set(key, delayed);
});

messanger.on("startDelayed", ({ data: key }) => {
	if (!key || !delayedResultStore.has(key)) {
		return;
	}

	delayedResultStore.get(key)!.forEach((result, resultKey) => {
		messanger.send(`delayedAnimationData-${key}`, new Map([[resultKey, result]]));
	});
	delayedResultStore.delete(key);
});
