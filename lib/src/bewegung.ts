import { normalizeOptions, toBewegungsEntry } from "./main-thread/normalize-props";
import { observeDom } from "./main-thread/observe-dom";
import { deriveState } from "./main-thread/state";
import {
	Bewegung,
	BewegungsArgs,
	BewegungsCallback,
	BewegungsOption,
	FullBewegungsOption,
	MainMessages,
	WorkerMessages,
} from "./types";
import { getDebounce, nextRaf, saveSeek } from "./utils/helper";
import { getWorker, useWorker } from "./utils/use-worker";

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
		if (state.animations.size > 1) {
			return;
		}

		if (state.inProgress) {
			await nextRaf();
			await callback();
			return;
		}

		try {
			console.time("calculation");
			state.inProgress = true;
			observeDom(options, worker);
			state.animations = await state.caluclations;
			state.inProgress = false;
			console.timeEnd("calculation");
		} catch (error) {
			options.timekeeper.cancel();
		}
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
			state.animations.forEach(
				(animation) => (animation.currentTime = saveSeek(progress) * state.totalRuntime)
			);

			debounce(enableReactivity);
		},
		cancel() {
			state.animations.forEach((animation) => animation.cancel());
			worker("terminate").terminate();
		},
		finish() {
			state.animations.forEach((animation) => animation.finish());

			if (state.animations.size <= 1) {
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
