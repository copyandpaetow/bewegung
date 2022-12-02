import { getAffectedElements } from "./normalize/affected-elements";
import { initState } from "./normalize/state";
import { readDom } from "./read/dom";
import {
	BewegungProps,
	DefaultKeyframes,
	ElementReadouts,
	ImageState,
	Result,
	State,
	StyleChangePossibilities,
} from "./types";
import { QueryableWorker } from "./worker/setup";

export const getAnimations = (...props: BewegungProps) =>
	new Promise<Result>((resolve) => {
		const now = performance.now();
		const worker = QueryableWorker("worker.ts");
		const state = initState(worker, ...props);
		const animations = new Map<HTMLElement, Animation>();
		let domWork = new Map<string, StyleChangePossibilities>();

		const readDomFromChanges = () => {
			//!this currently takes 5s
			const domState = readDom(domWork, state);
			console.log(domState);
		};

		getAffectedElements(worker, state);
		console.log(`formatting took ${performance.now() - now}ms`);
		worker.addListener(
			"sendAppliableKeyframes",
			(elementChanges: [Map<string, StyleChangePossibilities>]) => {
				//TODO: currently their RAF overlapps, we need to add a domQueue
				domWork = elementChanges[0];
				readDomFromChanges();
			}
		);

		worker.addListener(
			"sendKeyframes",
			(keyframeMaps: [Map<string, ImageState[]>, Map<string, DefaultKeyframes[]>]) => {
				console.log(keyframeMaps);
				console.log(`worker calculation took ${performance.now() - now}ms`);
			}
		);
		// await keyframe data, override data and totalRoundtime?
		// transform into animations

		// RO + IO => re-apply keyframes and send data
		// MO => re-translate elements and move them to the worker
	});
