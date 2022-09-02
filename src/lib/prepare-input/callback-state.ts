import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
	applyStyleObject,
} from "../set-animations/read-dom";
import { ChunkState, ElementState, StyleState, CallbackState } from "../types";

export const beforeAnimationCallback = (
	chunkState: ChunkState,
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllElements().forEach((element) => {
		const overrides = styleState.getStyleOverrides(element);
		const isMainElement = elementState.isMainElement(element);

		if (!overrides && !isMainElement) {
			return;
		}

		applyCSSStyles(element, {
			...filterMatchingStyleFromKeyframes(chunkState.getKeyframes(element)!),
			...(overrides && overrides.override),
		});
	});
};

export const afterAnimationCallback = (
	elementState: ElementState,
	styleState: StyleState
) => {
	elementState.getAllElements().forEach((element) => {
		const overrides = styleState.getStyleOverrides(element);

		if (!overrides) {
			return;
		}

		applyStyleObject(element, {
			...overrides.existingStyle,
		});
	});
};

export const getCallbackState = (
	before: VoidFunction[],
	after: VoidFunction[]
): CallbackState => {
	const beforeQueue = new Set<VoidFunction>(before);
	const afterQueue = new Set<VoidFunction>(after);
	return {
		executeBeforeAnimationStart() {
			beforeQueue.forEach((callback) => callback());
			beforeQueue.clear();
		},
		executeAfterAnimationEnds() {
			afterQueue.forEach((callback) => callback());
			afterQueue.clear();
		},
	};
};
