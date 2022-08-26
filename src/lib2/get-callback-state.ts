import {
	StyleState,
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
} from "./calculate-dom-changes";
import { ChunkState } from "./get-chunk-state";
import { ElementState } from "./get-element-state";

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

export interface CallbackState {
	set(allCallbacks: VoidFunction[]): void;
	execute(): void;
}

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
