import { DefaultKeyframes, ImageState, WorkerState } from "../types";
import { getDefaultKeyframes } from "./create-default-keyframes";
import { getImageKeyframes } from "./create-image-keyframes";

export const constructKeyframes = (
	workerState: WorkerState
): [Map<string, ImageState>, Map<string, DefaultKeyframes>] => {
	const { readouts, lookup } = workerState;

	const imageReadouts = new Map<string, ImageState>();
	const defaultReadouts = new Map<string, DefaultKeyframes>();

	readouts.forEach((elementReadouts, elementString) => {
		lookup.get(elementString)!.type === "image"
			? imageReadouts.set(
					elementString,
					getImageKeyframes(elementReadouts, elementString, workerState)
			  )
			: defaultReadouts.set(
					elementString,
					getDefaultKeyframes(elementReadouts, elementString, workerState)
			  );
	});

	return [imageReadouts, defaultReadouts];
};
