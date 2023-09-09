import { DomRepresentation, MainMessages, TreeEntry, TreeMedia, WorkerMessages } from "../types";
import { isElementUnchanged, isEntryVisible, changesInScale, isImage } from "../utils/predicates";
import { useWorker } from "../utils/use-worker";
import { getDimensions, getParentDimensions, updateDimensions } from "./dimensions";
import { setImageKeyframes } from "./image-keyframes";
import { calculateDifferences, setDefaultKeyframes } from "./keyframes";
import { setOverrides } from "./overrides";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const dimensionStore = new Map<string, Map<string, TreeEntry>>();

const getKeyframes = (dom: DomRepresentation, dimensionStore: Map<string, TreeEntry>) => {
	const keyframeStore = new Map<string, Keyframe[]>();
	const imageKeyframeStore = new Map<string, Keyframe[]>();
	const overrideStore = new Map<string, Partial<CSSStyleDeclaration>>();

	const updateStore = (currentNode: DomRepresentation, parentNode?: DomRepresentation) => {
		const [current, children] = currentNode as DomRepresentation;
		const key = (current as TreeEntry).key;
		const dimensions = getDimensions(current as TreeEntry, dimensionStore);

		//if both entries are hidden the element was hidden in general and doesnt need any animations as well as their children
		if (dimensions.every((entry) => !isEntryVisible(entry))) {
			return;
		}

		const parentDimensions = getParentDimensions(parentNode, dimensionStore);
		const differences = calculateDifferences(dimensions, parentDimensions);

		//if the element doesnt really change in the animation, we just skip it and continue with the children
		//we cant skip the whole tree because a decendent could still shrink
		if (differences.every(isElementUnchanged)) {
			(children as DomRepresentation[]).forEach((entry) => {
				updateStore(entry, parentNode);
			});
			return;
		}

		//if the element is a changedImage we put it in a different store
		const isChangingInScale = changesInScale(differences);

		if (isChangingInScale && isImage(dimensions)) {
			setImageKeyframes(
				dimensions as [TreeMedia, TreeMedia],
				parentDimensions as [TreeMedia, TreeMedia] | undefined,
				imageKeyframeStore,
				overrideStore
			);
		} else {
			keyframeStore.set(key, setDefaultKeyframes(differences, dimensions, isChangingInScale));
		}

		//if the element is not visible in the end (removed/display: none), we need to override that
		if (!isEntryVisible(dimensions[1])) {
			setOverrides(dimensions[1], parentDimensions?.[1], overrideStore);
		}

		(children as DomRepresentation[]).forEach((entry) => {
			updateStore(entry, currentNode);
		});
	};

	// overrideStore.set((dom[0] as TreeEntry).key, { contain: "layout inline-size" });
	// (dom[1] as DomRepresentation[]).forEach((child) => {
	// 	updateStore(child);
	// });

	//!we currently dont animate the root, maybe this leads to issues
	updateStore(dom);

	return {
		keyframeStore,
		imageKeyframeStore,
		overrideStore,
	};
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	if (!dimensionStore.has(domRepresentations.key)) {
		dimensionStore.set(domRepresentations.key, updateDimensions(domRepresentations.dom));
		return;
	}

	workerAtom(`sendAnimationData-${domRepresentations.key}`).reply(
		`animationData-${domRepresentations.key}`,
		getKeyframes(domRepresentations.dom, dimensionStore.get(domRepresentations.key)!)
	);
});
