import { normalizeOptions, toBewegungsEntry } from "./main-thread/normalize-props";
import { readDom } from "./main-thread/observe-dom";
import { deriveState } from "./main-thread/state";
import {
	BewegungsCallback,
	BewegungsOption,
	FullBewegungsOption,
	MainMessages,
	WorkerMessages,
} from "./types";
import { getDebounce, nextRaf } from "./utils/helper";
import { getWorker, useWorker } from "./utils/use-worker";

export type Bewegung = {
	play(): Promise<void>;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): Promise<void>;
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
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());
	const debounce = getDebounce();
	const options = normalizeOptions(toBewegungsEntry(props, config));

	let state = deriveState(options, worker);

	const enableReactivity = () => {
		state.reactivity.observe(() => {
			state.reactivity.disconnect();
			state = deriveState(options, worker);
			getState(api.play);
		});
	};

	const getState = async (callback: () => Promise<void>) => {
		if (state.animations.size) {
			return;
		}

		if (state.inProgress) {
			await nextRaf();
			await callback();
			return;
		}
		console.time("calculation");
		state.inProgress = true;
		readDom(options, worker);
		state.animations = await state.caluclations;
		state.inProgress = false;
		console.timeEnd("calculation");
	};

	const api: Bewegung = {
		async play() {
			await getState(api.play);
			state.animations.forEach((animation) => {
				animation.play();
			});
		},
		pause() {
			state.animations.forEach((animation) => animation.pause());
			enableReactivity();
		},
		async seek(progress, done) {
			if (done) {
				api.finish();
				state.reactivity.disconnect();
			}

			await getState(() => api.seek(progress, done));
			state.animations.forEach((animation) => (animation.currentTime = progress));

			debounce(enableReactivity);
		},
		cancel() {
			state.animations.forEach((animation) => animation.cancel());
			worker("terminate").terminate();
		},
		finish() {
			state.animations.forEach((animation) => animation.finish());

			if (state.animations.size === 0) {
				options.from?.();
				options.to?.();
			}
		},
		get finished() {
			return options.timekeeper.finished;
		},
		get playState() {
			return options.timekeeper.playState;
		},
	};

	return api;
};
