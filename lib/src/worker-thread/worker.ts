import {
	DimensionalDifferences,
	DomLabel,
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
import { getImageData, setDefaultKeyframes } from "./get-keyframes";
import { setOverrides } from "./set-overrides";
import { normalizeReadouts } from "./set-readouts";

//@ts-expect-error typescript doesnt
const worker = self as Worker;
const workerAtom = useWorker<WorkerMessages, MainMessages>(worker);

const dimensionStore = new Map<string, TreeEntry[]>();
const domTreeStore = new Map<string, DomLabel>();
const relatedRootStore = new Map<string, string>();
const overrideStore = new Map<string, Partial<CSSStyleDeclaration>>();
const allOffsets: number[] = [];

workerAtom("sendInitialDOMRepresentation").onMessage((domLabel) => {
	dimensionStore.clear();
	domTreeStore.clear();
	relatedRootStore.clear();
	overrideStore.clear();
	allOffsets.length = 0;

	const updateStore = (currentTree: DomLabel, root: string) => {
		const [current, children] = currentTree;
		relatedRootStore.set(current as string, root);

		if (children.length === 0) {
			return;
		}
		(children as DomLabel).forEach((entry) => updateStore(entry as DomLabel, root));
	};

	domLabel.forEach((labelTree) => {
		const id = labelTree[0] as string;
		updateStore(labelTree, id);
		domTreeStore.set(id, labelTree);
	});
});

const getNestedTree = (key: string) => {
	const root = relatedRootStore.get(key)!;
	const rootTree = domTreeStore.get(root)!;
	let result: DomLabel = [];

	const findNode = (currentTree: DomLabel) => {
		const [current, children] = currentTree as DomLabel;

		if (current === key) {
			result = currentTree;
			return;
		}
		return (children as DomLabel[]).forEach(findNode);
	};

	findNode(rootTree);
	return result;
};

const updateTree = (currentTree: DomRepresentation, dimensionStore: Map<string, TreeEntry[]>) => {
	const [current, currentChildren] = currentTree as DomRepresentation;
	const key = (current as TreeEntry).key;

	dimensionStore.set(key, (dimensionStore.get(key) ?? []).concat(current as TreeEntry));

	(currentChildren as DomRepresentation).forEach((child) =>
		updateTree(child as DomRepresentation, dimensionStore)
	);
};

workerAtom("sendTreeUpdate").onMessage((treeUpdate) => {
	treeUpdate.forEach((labels, key) => {
		(getNestedTree(key)[1] as DomLabel).push(labels);
	});
});

const calculateDifferences = (current: TreeEntry[], parent: TreeEntry[] | undefined) => {
	const isRoot = !Boolean(parent);
	const isImage = Boolean(current[0].hasOwnProperty("ratio"));

	if (isRoot) {
		return current.map((entry) =>
			calculateRootDifferences({
				current: entry,
				reference: current.at(-1)!,
			})
		);
	}

	if (isImage) {
		return calculateImageDifferences(current as TreeMedia[]);
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
	if (current[0].hasOwnProperty("ratio")) {
		console.log({ current, parent });
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

	return setDefaultKeyframes(differences, current);
};

const getKeyframes = (
	domTreeStore: Map<string, DomLabel>,
	dimensionStore: Map<string, TreeEntry[]>
) => {
	const keyframeStore = new Map<string, Keyframe[]>();

	const updateStore = (currentTree: DomLabel, parentKey?: string) => {
		const [current, children] = currentTree as DomLabel;
		const key = current as string;

		const dimensions = normalizeReadouts(dimensionStore.get(key)!, allOffsets);
		const parentDimensions = parentKey ? dimensionStore.get(parentKey) : undefined;

		const differences = calculateDifferences(dimensions, parentDimensions);
		const keyframes = calculateKeyframes(
			dimensions,
			parentDimensions,
			differences,
			keyframeStore,
			overrideStore
		);

		dimensionStore.set(key, dimensions);
		keyframeStore.set(key, keyframes);

		if (dimensions.every((entry) => !isEntryVisible(entry))) {
			keyframeStore.delete(key);
			return;
		}
		const isUnchanged = differences.every(isElementUnchanged);

		if (isUnchanged) {
			keyframeStore.delete(key);
		}

		if (!isEntryVisible(dimensions.at(-1)!)) {
			setOverrides(key, parentKey, overrideStore, dimensionStore);
		}

		(children as DomLabel[]).forEach((entry) => {
			updateStore(entry, isUnchanged ? parentKey : key);
		});
	};

	domTreeStore.forEach((tree) => {
		const key = tree[0] as string;
		dimensionStore.set(key, normalizeReadouts(dimensionStore.get(key)!, allOffsets));
		updateStore(tree);
	});

	return { keyframeStore, overrideStore };
};

workerAtom("sendDOMRepresentation").onMessage((domRepresentations) => {
	const offset = (domRepresentations[0][0] as TreeEntry).offset;
	allOffsets.push(offset);
	domRepresentations.forEach((domTree) => {
		updateTree(domTree, dimensionStore);
	});
	if (offset === 1) {
		const result = getKeyframes(domTreeStore, dimensionStore);
		console.log({ domRepresentations, domTreeStore, result });

		workerAtom("sendAnimationData").reply("animationData", result);
	}
});
