import { DefaultKeyframes, ElementReadouts, ImageState, WorkerState } from "../types";
import { getDefaultKeyframes } from "./default-keyframes";
import { getImageKeyframes } from "./image-keyframes";

export const constructKeyframes = (
	workerState: WorkerState
): [Map<string, ImageState[]>, Map<string, DefaultKeyframes[]>] => {
	const { readouts, lookup } = workerState;

	const imageReadouts = new Map<string, ImageState[]>();
	const defaultReadouts = new Map<string, DefaultKeyframes[]>();

	readouts.forEach((elementReadouts, elementString) => {
		lookup.get(elementString)!.type === "image"
			? imageReadouts.set(
					elementString,
					(imageReadouts.get(elementString) ?? []).concat(
						getImageKeyframes(elementReadouts, elementString, workerState)
					)
			  )
			: defaultReadouts.set(
					elementString,
					(defaultReadouts.get(elementString) ?? []).concat(
						getDefaultKeyframes(elementReadouts, elementString, workerState)
					)
			  );
	});

	return [imageReadouts, defaultReadouts];
};
