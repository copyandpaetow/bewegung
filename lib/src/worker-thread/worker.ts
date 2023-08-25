import {
	DimensionalDifferences,
	DomRepresentation,
	MainMessages,
	TreeEntry,
	TreeMedia,
	WorkerMessages,
} from "../types";
import { isElementUnchanged, isEntryVisible } from "../utils/predicates";
import { useWorker } from "../utils/use-worker";
import { calculateDimensionDifferences, calculateRootDifferences } from "./calculate-differences";
import { calculateImageDifferences, getWrapperKeyframes } from "./calculate-image-differences";
import { changesInScale, getImageData, setDefaultKeyframes } from "./get-keyframes";
import { setOverrides } from "./set-overrides";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const dimensionStore = new Map<string, TreeEntry>();

const updateDimensions = (
	currentTree: DomRepresentation,
	dimensionStore: Map<string, TreeEntry>
) => {
	const [current, currentChildren] = currentTree as DomRepresentation;
	const key = (current as TreeEntry).key;

	dimensionStore.set(key, current as TreeEntry);

	(currentChildren as DomRepresentation).forEach((child) =>
		updateDimensions(child as DomRepresentation, dimensionStore)
	);
};

/*
todo: images require a lot of work downstream
maybe we can calculate the image like other elements and when their dimensions change, we redo the calculation?

*/
const calculateDifferences = (current: TreeEntry[], parent: TreeEntry[] | undefined) => {
	const isRoot = !Boolean(parent);

	if (isRoot) {
		return current.map((entry) =>
			calculateRootDifferences({
				current: entry,
				reference: current.at(-1)!,
			})
		);
	}

	return current.map((entry, index) =>
		calculateDimensionDifferences({
			current: entry,
			reference: current.at(-1)!,
			parent: parent![index],
			parentReference: parent!.at(-1)!,
		})
	);
};

const calculateKeyframes = (
	current: TreeEntry[],
	parent: TreeEntry[] | undefined,
	differences: DimensionalDifferences[],
	keyframeStore: Map<string, Keyframe[]>,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const isImage = Boolean(current[0].hasOwnProperty("ratio"));
	const isChangingInScale = changesInScale(differences);

	if (isImage && isChangingInScale) {
		const key = current[0].key;
		const lastReadout = current.at(-1)!;
		const lastParentReadout = parent ? parent.at(-1) : undefined;
		const imageData = getImageData(current as TreeMedia[]);
		const wrapperKeyframes = getWrapperKeyframes(current as TreeMedia[], parent, imageData);
		keyframeStore.set(key + "-wrapper", wrapperKeyframes);

		overrideStore.set(`${key}-wrapper`, {
			position: "absolute",
			left: lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
			top: lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
			height: `${imageData.maxHeight}px`,
			width: `${imageData.maxWidth}px`,
			pointerEvents: "none",
			overflow: "hidden",
			gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
		});

		overrideStore.set(`${key}-placeholder`, {
			height: lastReadout.unsaveHeight + "px",
			width: lastReadout.unsaveWidth + "px",
		});
	}

	return setDefaultKeyframes(differences, current, isChangingInScale);
};

const getKeyframes = (tree: DomRepresentation, dimensionStore: Map<string, TreeEntry>) => {
	const keyframeStore = new Map<string, Keyframe[]>();
	const overrideStore = new Map<string, Partial<CSSStyleDeclaration>>();

	const updateStore = (currentNode: DomRepresentation, parentNode?: DomRepresentation) => {
		const [current, children] = currentNode as DomRepresentation;
		const key = (current as TreeEntry).key;
		const parentKey = parentNode ? (parentNode[0] as TreeEntry).key : undefined;
		//if a previous input is not there the element was newly added
		const previousDimensions =
			dimensionStore.get(key) ??
			({
				...current,
				unsaveHeight: 0,
				unsaveWidth: 0,
				offset: 0,
			} as TreeEntry);

		const currentDimensions = isEntryVisible(current as TreeEntry)
			? (current as TreeEntry)
			: ({
					...previousDimensions,
					unsaveHeight: 0,
					unsaveWidth: 0,
					offset: 1,
			  } as TreeEntry);

		const dimensions = [previousDimensions, currentDimensions];

		//if both entries are hidden the element was hidden in general and doesnt need any animations as well as their children
		if (dimensions.every((entry) => !isEntryVisible(entry))) {
			return;
		}

		const previousParentDimensions = parentKey ? dimensionStore.get(parentKey) : undefined;

		const parentDimensions =
			previousParentDimensions && parentNode
				? [previousParentDimensions, parentNode[0] as TreeEntry]
				: undefined;

		const differences = calculateDifferences(dimensions, parentDimensions);
		const keyframes = calculateKeyframes(
			dimensions,
			parentDimensions,
			differences,
			keyframeStore,
			overrideStore
		);

		const isUnchanged = differences.every(isElementUnchanged);

		if (!isUnchanged) {
			keyframeStore.set(key, keyframes);
		}

		if (!isEntryVisible(dimensions.at(-1)!)) {
			setOverrides(
				dimensions.at(0)!,
				parentNode ? (parentNode[0] as TreeEntry) : undefined,
				overrideStore
			);
		}

		if (!dimensionStore.has(key)) {
			//if the element is newly added, we dont need nested animations
			return;
		}

		(children as DomRepresentation[]).forEach((entry) => {
			updateStore(entry, isUnchanged ? parentNode : currentNode);
		});
	};

	updateStore(tree);

	return { keyframeStore, overrideStore };
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	if (dimensionStore.size === 0) {
		updateDimensions(domRepresentations, dimensionStore);
		return;
	}

	const result = getKeyframes(domRepresentations, dimensionStore);
	console.log({ result, domRepresentations, dimensionStore });
	workerAtom("sendAnimationData").reply("animationData", result);

	dimensionStore.clear();
});
