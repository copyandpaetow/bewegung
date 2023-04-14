import { getNextParent } from "../default/keyframes";
import { setOverrides } from "../default/overrides";
import { refillPartialKeyframes } from "../default/refill-keyframes";
import { ImageState, ImageTransferable, WorkerState } from "../types";
import { defaultImageStyles } from "../utils/constants";
import {
	calculateImageKeyframes,
	getWrapperKeyframes,
	getWrapperStyle,
	highestNumber,
} from "./calculate-differences";

export const isTransformUnchanged = (keyframe: Keyframe) =>
	keyframe.transform === "translate(0px, 0px) scale(1, 1)";

export const createImageKeyframes = (state: WorkerState): ImageTransferable => {
	const { imageReadouts, timings, easings, parents, defaultReadouts } = state;

	const placeholders = new Map<string, string>();
	const wrappers = new Map<string, string>();
	const keyframes = new Map<string, Keyframe[]>();
	const partialElementKeyframes = refillPartialKeyframes(imageReadouts, timings);
	const overrides = setOverrides(imageReadouts, partialElementKeyframes, state);

	imageReadouts.forEach((readouts, elementID) => {
		const placeholder = `${elementID}-placeholder`;
		const wrapper = `${elementID}-wrapper`;
		const parentKey = getNextParent(elementID, parents, defaultReadouts);
		const parentReadouts = defaultReadouts.get(parentKey)!;

		const imageState: ImageState = {
			easing: easings.get(elementID)!,
			readouts,
			parentReadouts,
			maxHeight: highestNumber(readouts.map((entry) => entry.currentHeight)),
			maxWidth: highestNumber(readouts.map((entry) => entry.currentWidth)),
		};

		const wrapperKeyframes = getWrapperKeyframes(imageState);

		if (wrapperKeyframes.every(isTransformUnchanged)) {
			imageReadouts.delete(elementID);
			return;
		}

		overrides.set(placeholder, {
			height: readouts.at(-1)!.unsaveHeight + "px",
			width: readouts.at(-1)!.unsaveWidth + "px",
		});

		if (partialElementKeyframes.has(elementID)) {
			partialElementKeyframes.set(wrapper, wrapperKeyframes);
			partialElementKeyframes.set(placeholder, []);
			partialElementKeyframes.set(elementID, calculateImageKeyframes(imageState));
		} else {
			keyframes.set(wrapper, wrapperKeyframes);
			keyframes.set(placeholder, []);
			keyframes.set(elementID, calculateImageKeyframes(imageState));
		}

		wrappers.set(wrapper, elementID);
		placeholders.set(placeholder, elementID);
		overrides.set(wrapper, getWrapperStyle(imageState));
		overrides.set(elementID, {
			...(overrides.get(elementID) ?? {}),
			...defaultImageStyles,
		});
	});

	return {
		overrides,
		placeholders,
		wrappers,
		keyframes,
		partialElements: partialElementKeyframes,
	};
};
