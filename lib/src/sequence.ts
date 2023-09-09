import {
	read,
	removeDataAttributes,
	removeElements,
	replaceImagePlaceholders,
} from "./main-thread/animation-calculator";
import { create } from "./main-thread/create-animation";
import { getTotalRuntime, normalizeOptions } from "./main-thread/normalize-props";
import { BewegungsConfig, BewegungsInputs, MainMessages, WorkerMessages } from "./types";
import { getWorker, useWorker } from "./utils/use-worker";

/*

TODO: 

	- we need a timing engine that can start animations at certain times


- for a more fine-grained controll, we could split the reading and the animation creation into 2 functions
todo: we could try to read overlapping elements after each other and then create the animations (read read create create instead of read create & read create)
todo: or it could be read create read create play play instead of read create play read create play
=> if they are related and the earlier one has the higher root, its functions might need to be executed for the later one as well so the state of the dom is correct
? we know that the lower root function has no effect on the higher root function but will it be enough, if we just combine/add the keyframes 
? for the lower root function?  

- if the first element has a negativ at-value, it will become its delay => the animation starts not at 0
? the last element with a postive at value should it have become its endDelay?

- we need some kind of versioning for the sequence which cant be the root key
=> 2 overlapping animations could have the same root

- we cant await the first create functions because the other might return faster and get lost
=> requesting the data from the main thread would work but adds extra time for traveling and for the worker calculation to finish

- since we also want controll over sheduling some of the Animation creation we might need 3 functions (read, create, flip)
=> since these all need to happen in order async, we could use an array of generators and only advance the functions needed
=> we could also multiple arrays for each step



we want 
[[Animation, Animation, ...], [Animation, Animation, ...], [Animation, Animation, ...]]


intermediate step 2
[[Animation, Animation, ...], [Animation, Animation, ...], [Animation, Animation, ...]]
[callback, callback, callback]
+ overrides

intermediate step 1
[[{transform, offset...}], [{transform, offset...}], [{transform, offset...}]]
+ overrides

we start with
[{delay, from, to...}, {delay, from, to...}, {delay, from, to...}]



*/

const workerManager = getWorker();

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

export const sequence = (props: BewegungsInputs, config?: BewegungsConfig) => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());

	//TODO: how to handle reactivity here?

	let options = props.map((entry) => normalizeOptions(entry, config?.defaultOptions));
	let totalRuntime = getTotalRuntime(options);
	let statePromise = options.map((option) => create(option, worker));

	const globalTimekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	globalTimekeeper.onfinish = () => {
		requestAnimationFrame(() => {
			replaceImagePlaceholders();
			removeElements();
			removeDataAttributes();
			index = 0;
		});
	};

	let state = new Map<number, Map<string, Animation>>();
	let playState: AnimationPlayState = "idle";
	let index = 0;

	let inProgress = false;

	let accumulatedTime = 0;

	const getState = async (mode: "seek" | "play" = "play") => {
		if (state.has(index)) {
			return;
		}

		read(options[index], worker);

		console.time("getState");

		const nextOption = options.at(index + 1);

		const localTimekeeper = new Animation(
			new KeyframeEffect(null, null, options[index].duration + (nextOption ? nextOption.at : 0))
		);
		const currentAnimations = await statePromise[index];

		currentAnimations.set("localTimekeeper", localTimekeeper);
		state.set(index, currentAnimations);

		localTimekeeper.onfinish = () => {
			if (!nextOption) {
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
			console.log(state);
		},
		async pause() {},
		async seek(progress, done) {
			if (progress === 1 || inProgress) {
				return;
			}

			const relativeProgress =
				(progress * totalRuntime - accumulatedTime) / options[index].duration;

			if (relativeProgress <= 0) {
				index = Math.max(0, index - 1);
				accumulatedTime = options.slice(0, index).reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			if (relativeProgress >= 1) {
				index = Math.min(options.length - 1, index + 1);
				accumulatedTime = options.slice(0, index).reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			inProgress = true;
			await getState("seek");
			inProgress = false;

			state.get(index)!.forEach((animation) => {
				animation.currentTime = relativeProgress * options[index].duration;
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
