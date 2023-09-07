import { fetchAnimationData } from "../main-thread/animation-calculator";
import { normalizeOptions } from "../main-thread/normalize-props";
import { BewegungsConfig, BewegungsInputs, MainMessages, WorkerMessages } from "../types";
import { getWorker, useWorker } from "../utils/use-worker";
import {
	getRelativeTimings,
	getTotalRuntime,
	revertToAbsoluteTiming,
	separateOverlappingEntries,
} from "./update-timings";

/*

TODO: 

	- we need a timing engine that can start animations at certain times
	- when iterating the element tree, we need to pause the animations shortly for the readout and move them to the time the animation finishes 
! => this creates visual stutter even without throttling  
! => we cant read the dom while another animation is running

- for a more fine-grained controll, we could split the reading and the animation creation into 2 functions
todo: we could try to read overlapping elements after each other and then create the animations (read read create create instead of read create & read create)
todo: or it could be read create read create play play instead of read create play read create play
=> if they are related and the earlier one has the higher root, its functions might need to be executed for the later one as well so the state of the dom is correct
? we know that the lower root function has no effect on the higher root function but will it be enough, if we just combine/add the keyframes 
? for the lower root function?  

- using at will have a downstream effect on the elements before and after the current one
=> negative at will overlap with the previous animation and adjust all following animations
? should a positive at overlap with the following animations then as well? 
* if they want to have gaps, they can use delay/endDelay

- if the first element has a negativ at-value, it will become its delay => the animation starts not at 0
? the last element with a postive at value should it have become its endDelay?





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

	//TODO: how to handle reactivity here?

	//* we could stop some of the reverting after each animations like keys, deleting elements etc

	let normalizedProps = props.map((entry) => normalizeOptions(entry, config?.defaultOptions));
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
