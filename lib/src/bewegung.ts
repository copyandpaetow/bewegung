import {
	read,
	removeDataAttributes,
	removeElements,
	replaceImagePlaceholders,
} from "./main-thread/animation-calculator";
import { create } from "./main-thread/create-animation";
import {
	extractAnimationOptions,
	normalizeOptions,
	toBewegungsEntry,
} from "./main-thread/normalize-props";
import {
	BewegungsCallback,
	BewegungsOption,
	FullBewegungsOption,
	MainMessages,
	WorkerMessages,
} from "./types";
import { getWorker, useWorker } from "./utils/use-worker";

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

export type BewegungsArgs = {
	(props: BewegungsCallback): Bewegung;
	(props: BewegungsCallback, options: number): Bewegung;
	(props: BewegungsCallback, options: BewegungsOption): Bewegung;
	(props: FullBewegungsOption): Bewegung;
};

const workerManager = getWorker();

export const bewegung: BewegungsArgs = (
	props: BewegungsCallback | FullBewegungsOption,
	config?: BewegungsOption | number
): Bewegung => {
	//	const reactivity = getReactivity();

	const options = normalizeOptions(toBewegungsEntry(props, config));
	let state: Map<string, Animation> | null = null;
	let playState: AnimationPlayState = "idle";

	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());
	const timekeeper = new Animation(
		new KeyframeEffect(null, null, extractAnimationOptions(options))
	);

	timekeeper.onfinish = () => {
		requestAnimationFrame(() => {
			replaceImagePlaceholders();
			removeElements();
			removeDataAttributes();
		});
	};

	//TODO: enable reactivity
	// how should this be different compared to the sequence?
	// const enableReactivity = () => {
	// 	reactivity.observe(() => {
	// 		reactivity.disconnect();
	// 		state = null;
	// 	});
	// };

	const getState = async () => {
		if (state) {
			return;
		}

		read(options, worker);
		state = await create(options, worker);
		state.set("timekeeper", timekeeper);
	};

	const api: Bewegung = {
		async play() {
			console.time("play");
			await getState();
			console.timeEnd("play");
			state!.forEach((animation) => {
				animation.play();
			});
			playState = "running";
		},
		async pause() {
			await getState();
			state!.forEach((animation) => animation.pause());
			playState = "paused";
			// enableReactivity();
		},
		async seek(progress, done) {
			await getState();
			state!.forEach((animation) => (animation.currentTime = progress));

			//todo: reactivity should be enabled after some time if seeking is used
			if (done) {
				api.finish();
			}
		},
		cancel() {
			if (state) {
				state.forEach((animation) => animation.cancel());
				playState = "finished";
			}
		},
		finish() {
			if (state) {
				state.forEach((animation) => animation.finish());
				playState = "finished";
			}
		},
		get finished() {
			return timekeeper.finished;
		},
		get playState() {
			return playState ?? "idle";
		},
	};

	return api;
};
