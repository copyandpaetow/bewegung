import { fetchAnimationData } from "../main-thread/animation-calculator";
import {
	BewegungsConfig,
	BewegungsInputs,
	MainMessages,
	NormalizedOptions,
	WorkerMessages,
} from "../types";
import { getWorker, useWorker } from "../utils/use-worker";
import { normalize } from "./manage-props";
import {
	getRelativeTimings,
	getTotalRuntime,
	revertToAbsoluteTiming,
	separateOverlappingEntries,
} from "./update-timings";

/*

TODO: 

	- reversing the sequence is not perfect yet => could be a setup issue
	- the code is unoptimized, especially the prop handling for the sequence
	but we have several places with very similar functions
	=> the prop splitting doesnt need the functions from preveious entries anymore
	- reactivity needs to be added
	- cleanup is still missing

 ? it would make sense to optimize the reading of the elements
 => if 2 animations have the same root / are nested, the second animation reads the dom unessescarily   

*/

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

const workerManager = getWorker();

export const sequence = (props: BewegungsInputs, config?: BewegungsConfig) => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	let normalizedProps = normalize(props, config);
	let totalRuntime = getTotalRuntime(normalizedProps);
	let domUpdates = revertToAbsoluteTiming(
		separateOverlappingEntries(getRelativeTimings(normalizedProps, totalRuntime)),
		totalRuntime
	);
	const globalTimekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	let state = new Map<number, Map<string, Animation>>();
	let playState: AnimationPlayState = "idle";
	let index = 0;

	let inProgress = false;

	let accumulatedTime = 0;

	const getState = async (mode: "seek" | "play" = "play") => {
		if (state.has(index)) {
			return;
		}

		console.time("getState");

		const localTimekeeper = new Animation(
			new KeyframeEffect(null, null, domUpdates[index].duration)
		);
		const currentAnimations = await fetchAnimationData({
			options: domUpdates[index],
			timekeeper: localTimekeeper,
			worker,
			needsInitalReadout: true,
		});

		state.set(index, currentAnimations);

		localTimekeeper.onfinish = () => {
			if (domUpdates.length - 1 === index) {
				return;
			}

			if (mode === "seek") {
				api.seek(0);
				return;
			}
			index += 1;
			api.play();
		};
		console.timeEnd("getState");
	};
	const api: Bewegung = {
		async play() {
			await getState();

			state.get(index)!.forEach((animation) => {
				animation.play();
			});
		},
		async pause() {},
		async seek(progress, done) {
			if (progress === 1 || inProgress) {
				return;
			}

			const relativeProgress =
				(progress * totalRuntime - accumulatedTime) / domUpdates[index].duration;

			if (relativeProgress <= 0) {
				index = Math.max(0, index - 1);
				accumulatedTime = domUpdates.slice(0, index).reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			if (relativeProgress >= 1) {
				index = Math.min(domUpdates.length - 1, index + 1);
				accumulatedTime = domUpdates.slice(0, index).reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			inProgress = true;
			await getState("seek");
			inProgress = false;

			state.get(index)!.forEach((animation) => {
				animation.currentTime = relativeProgress * domUpdates[index].duration;
			});
		},
		cancel() {},
		finish() {},
		get finished() {
			return globalTimekeeper.finished;
		},
		get playState() {
			return playState;
		},
	};
	return api;
};
