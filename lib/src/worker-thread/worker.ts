import {
	DomRepresentation,
	MainMessages,
	MetaData,
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

const updateDimensions = (domTree: DomRepresentation, dimensionStore: Map<string, TreeEntry>) => {
	const [current, currentChildren] = domTree as DomRepresentation;
	const key = (current as TreeEntry).key;

	dimensionStore.set(key, current as TreeEntry);

	(currentChildren as DomRepresentation).forEach((child) =>
		updateDimensions(child as DomRepresentation, dimensionStore)
	);
};

const calculateDifferences = (
	current: TreeEntry[],
	parent: TreeEntry[] | undefined,
	metaData: MetaData
) => {
	const isRoot = !Boolean(parent);

	if (isRoot) {
		return current.map((entry) =>
			calculateRootDifferences({
				current: entry,
				reference: current.at(-1)!,
				metaData,
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

const calculateWrapperData = (current: TreeEntry[], parent: TreeEntry[] | undefined) => {
	const lastReadout = current.at(-1)!;
	const lastParentReadout = parent ? parent.at(-1) : undefined;
	const imageData = getImageData(current as TreeMedia[]);
	const keyframes = getWrapperKeyframes(current as TreeMedia[], parent, imageData);

	const overrides = {
		position: "absolute",
		left: lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px",
		top: lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px",
		height: `${imageData.maxHeight}px`,
		width: `${imageData.maxWidth}px`,
		pointerEvents: "none",
		overflow: "hidden",
		gridArea: "1/1/2/2", //if the parent element is a grid element, it will be absolutly positioned from its dedicated area and not from the edge of the element
	};

	return { keyframes, overrides };
};

const getKeyframes = (
	tree: DomRepresentation,
	metaData: MetaData,
	dimensionStore: Map<string, TreeEntry>
) => {
	const keyframeStore = new Map<string, Keyframe[]>();
	const imageKeyframeStore = new Map<string, Keyframe[]>();
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

		const differences = calculateDifferences(dimensions, parentDimensions, metaData);

		//if the element doesnt really change in the animation, we just skip it and continue with the children
		//we cant skip the whole tree because a decendent could still shrink
		if (differences.every(isElementUnchanged)) {
			(children as DomRepresentation[]).forEach((entry) => {
				updateStore(entry, parentNode);
			});
		}

		//if the element is a changedImage we put it in a different store
		const isImage = Boolean(currentDimensions.hasOwnProperty("ratio"));
		const isChangingInScale = changesInScale(differences);

		if (isChangingInScale && isImage) {
			const { keyframes, overrides } = calculateWrapperData(dimensions, parentDimensions);
			imageKeyframeStore.set(key, calculateImageDifferences(dimensions as TreeMedia[]));
			imageKeyframeStore.set(`${key}-wrapper`, keyframes);
			overrideStore.set(`${key}-wrapper`, overrides);

			overrideStore.set(`${key}-placeholder`, {
				height: currentDimensions.unsaveHeight + "px",
				width: currentDimensions.unsaveWidth + "px",
			});
		} else {
			keyframeStore.set(key, setDefaultKeyframes(differences, dimensions, isChangingInScale));
		}

		if (!isEntryVisible(currentDimensions)) {
			setOverrides(currentDimensions, parentDimensions?.at(-1), overrideStore);
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

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	if (dimensionStore.size === 0) {
		updateDimensions(domRepresentations.domTree, dimensionStore);
		return;
	}

	getKeyframes(domRepresentations.domTree, domRepresentations.metaData, dimensionStore);

	dimensionStore.clear();
});
