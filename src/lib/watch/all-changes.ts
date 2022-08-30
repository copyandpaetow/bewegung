import { Chunks, ChunkState, ElementState, StyleState } from "../types";
import { ObserveDimensionChange } from "./dimensions";
import { ObserveDomMutations } from "./dom-mutations";
import { ObserveBrowserResize } from "./resizes";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ||= window.requestAnimationFrame;
}

interface ChangeCallbacks {
	recalcInput: (changes: Chunks[]) => void;
	recalcAnimations: VoidFunction;
}

interface WatchChangesProps {
	input: Chunks[];
	chunkState: ChunkState;
	elementState: ElementState;
	styleState: StyleState;
}

export const watchChanges = (
	props: WatchChangesProps,
	callbacks: ChangeCallbacks
): VoidFunction => {
	const { input, chunkState, elementState, styleState } = props;

	let resizeIdleCallback: NodeJS.Timeout | undefined;
	const priorityMap = new Map<
		"recalcInput" | "recalcAnimation",
		VoidFunction
	>();

	const throttledCallback = () => {
		const callback =
			priorityMap.get("recalcInput") ??
			priorityMap.get("recalcAnimation") ??
			(() => undefined);

		resizeIdleCallback && clearTimeout(resizeIdleCallback);
		resizeIdleCallback = setTimeout(() => {
			callback();
			priorityMap.clear();
		}, 100);
	};

	const observeDOM = ObserveDomMutations(input, (changes: Chunks[]) => {
		priorityMap.set("recalcInput", () => callbacks.recalcInput(changes));
		throttledCallback();
	});

	const observeResize = ObserveBrowserResize(
		elementState.getAllElements(),
		() => {
			priorityMap.set("recalcAnimation", callbacks.recalcAnimations);

			throttledCallback();
		}
	);

	const observeDimensions = ObserveDimensionChange(
		chunkState,
		elementState,
		styleState,
		() => {
			priorityMap.set("recalcAnimation", callbacks.recalcAnimations);

			throttledCallback();
		}
	);

	return () => {
		observeDOM?.disconnect();
		observeResize?.disconnect();
		observeDimensions?.disconnect();
	};
};