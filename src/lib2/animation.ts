import { createDefaultAnimation } from "./calculate/default-animation";
import { createImageAnimation } from "./calculate/image-animation";
import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { readDom } from "./read/dom";
import {
	BewegungProps,
	DefaultKeyframes,
	ImageState,
	Result,
	StyleChangePossibilities,
} from "./types";
import { QueryableWorker } from "./worker/setup";

export const getAnimations = (...props: BewegungProps) =>
	new Promise<Result>((resolve) => {
		const worker = QueryableWorker("worker.ts");
		const state = initState(worker, ...props);
		const animationState = {
			animations: [],
			onStart: [],
		};

		const stringifiedElementLookup = getAffectedElements(state);
		worker.sendQuery("sendElementLookup", stringifiedElementLookup);

		worker.addListener(
			"sendAppliableKeyframes",
			async (elementChanges: [Map<string, StyleChangePossibilities>]) => {
				//TODO: currently their RAF overlapps, we need to add a domQueue

				const domResult = await readDom(elementChanges[0], state);
				worker.sendQuery("sendReadouts", domResult);
			}
		);

		worker.addListener(
			"sendKeyframes",
			(keyframeResults: [[Map<string, ImageState>, Map<string, DefaultKeyframes>, number]]) => {
				const [imageKeyframes, defaultKeyframes, totalRuntime] = keyframeResults[0];
				createDefaultAnimation(defaultKeyframes, animationState, state, totalRuntime);
				createImageAnimation(
					imageKeyframes,
					animationState,
					state,
					stringifiedElementLookup,
					totalRuntime
				);
				resolve(animationState);
			}
		);

		// RO + IO => re-apply keyframes and send data
		// MO => re-translate elements and move them to the worker
	});
