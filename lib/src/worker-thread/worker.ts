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

const dimensionStore = new Map<string, TreeEntry>();

const getKeyframes = (tree: DomRepresentation, dimensionStore: Map<string, TreeEntry>) => {
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

		if (!isEntryVisible(dimensions[1])) {
			setOverrides(dimensions[1], parentDimensions?.[1], overrideStore);
		}

		(children as DomRepresentation[]).forEach((entry) => {
			updateStore(entry, currentNode);
		});
	};

	updateStore(tree);

	workerAtom("sendAnimationData").reply("animationData", {
		keyframeStore,
		imageKeyframeStore,
		overrideStore,
	});
};

//TODO: maybe it would make more sense to split this into 2
workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	if (dimensionStore.size === 0) {
		updateDimensions(domRepresentations, dimensionStore);
		return;
	}

	getKeyframes(domRepresentations, dimensionStore);

	dimensionStore.clear();
});
