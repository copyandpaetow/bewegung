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
- reactivity

- if the first element has a negativ at-value, it will become its delay => the animation starts not at 0
? the last element with a postive at value should it have become its endDelay?

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

	let options = props.map((entry) => normalizeOptions(entry, config?.defaultOptions));
	let totalRuntime = getTotalRuntime(options);
	let statePromise = options.map((option) => create(option, worker));

	const globalTimekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
	// globalTimekeeper.onfinish = () =>
	// 	requestAnimationFrame(() => {
	// 		replaceImagePlaceholders();
	// 		removeElements();
	// 		removeDataAttributes();
	// 	});

	const state = {
		animations: new Map<number, Map<string, Animation>>(),
		index: 0,
		inProgress: false,
		accumulatedTime: 0,
	};

	const getState = async (mode: "seek" | "play" = "play") => {
		if (state.animations.has(state.index)) {
			return;
		}

		read(options[state.index], worker);

		console.time("getState");

		const nextOption = options.at(state.index + 1);

		const localTimekeeper = new Animation(
			new KeyframeEffect(
				null,
				null,
				options[state.index].duration + (nextOption ? nextOption.at : 0)
			)
		);
		const currentAnimations = await statePromise[state.index];

		currentAnimations.set("localTimekeeper", localTimekeeper);
		state.animations.set(state.index, currentAnimations);

		localTimekeeper.onfinish = () => {
			if (!nextOption) {
				return;
			}

			if (mode === "seek") {
				api.seek(0);
				return;
			}
			state.index = state.index + 1;
			api.play();
		};
		console.timeEnd("getState");
	};
	const api: Bewegung = {
		async play() {
			await getState();

			state.animations.get(state.index)?.forEach((animation) => {
				animation.play();
			});
			globalTimekeeper.play();
		},
		async pause() {
			for (let index = state.index; index >= 0; index--) {
				state.animations.get(index)?.forEach((animation) => {
					animation.pause();
				});
			}
			globalTimekeeper.pause();
		},
		async seek(progress, done) {
			if (progress === 1 || state.inProgress) {
				return;
			}

			const relativeProgress =
				(progress * totalRuntime - state.accumulatedTime) / options[state.index].duration;

			if (relativeProgress <= 0) {
				state.index = Math.max(0, state.index - 1);
				state.accumulatedTime = options
					.slice(0, state.index)
					.reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			if (relativeProgress >= 1) {
				state.index = Math.min(options.length - 1, state.index + 1);
				state.accumulatedTime = options
					.slice(0, state.index)
					.reduce((acc, cur) => acc + cur.duration, 0);
				return;
			}
			state.inProgress = true;
			await getState("seek");
			state.inProgress = false;

			state.animations.get(state.index)!.forEach((animation) => {
				animation.currentTime = relativeProgress * options[state.index].duration;
			});

			globalTimekeeper.currentTime = progress * totalRuntime;
		},
		cancel() {
			state.animations.get(state.index)?.forEach((animation) => {
				animation.cancel();
			});
			globalTimekeeper.cancel();
		},
		finish() {
			state.animations.get(state.index)?.forEach((animation) => {
				animation.finish();
			});
			globalTimekeeper.finish();
		},
		get finished() {
			return globalTimekeeper.finished;
		},
		get playState() {
			return globalTimekeeper.playState;
		},
	};
	return api;
};
