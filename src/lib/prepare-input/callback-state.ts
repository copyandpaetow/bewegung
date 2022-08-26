import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
} from "../set-animations/style-state";
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
			...(isMainElement &&
				filterMatchingStyleFromKeyframes(chunkState.getKeyframes(element)!)),
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

		applyCSSStyles(element, {
			...overrides.existingStyle,
		});
	});
};

export const callbackState = (): CallbackState => {
	const queue = new Set<VoidFunction>();

	return {
		set(allCallbacks: VoidFunction[]) {
			allCallbacks.forEach((callback) => {
				queue.add(callback);
			});
		},
		execute() {
			queue.forEach((callback) => callback());
			queue.clear();
		},
	};
};
