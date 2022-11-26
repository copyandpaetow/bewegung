import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { readDom } from "./read/dom";
import { BewegungProps, Result, StyleChangePossibilities } from "./types";
import { QueryableWorker } from "./worker/setup";

export const getAnimations = (...props: BewegungProps) =>
	new Promise<Result>((resolve) => {
		const now = performance.now();
		const worker = QueryableWorker("worker.ts");
		const state = initState(worker, ...props);

		getAffectedElements(worker, state);

		worker.addListener(
			"sendAppliableKeyframes",
			(elementChanges: Map<string, StyleChangePossibilities>) => {
				worker.sendQuery("sendReadouts", readDom(elementChanges, state));
			}
		);
		// apply keyframes, read the dom, revert the dom, send data + round?

		// await keyframe data, override data and totalRoundtime?
		// transform into animations

		// RO + IO => re-apply keyframes and send data
		// MO => re-translate elements and move them to the worker
		console.log(`it took ${performance.now() - now}ms`);
	});
