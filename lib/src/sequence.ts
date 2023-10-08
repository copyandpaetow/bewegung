import { calculateStartTime, normalizeOptions } from "./main-thread/normalize-props";
import { Bewegung, BewegungsConfig, BewegungsInputs, MainMessages, WorkerMessages } from "./types";
import { getDebounce, nextRaf, saveSeek } from "./utils/helper";
import { getWorker, useWorker } from "./utils/use-worker";
import { deriveSequenceState } from "./main-thread/state";
import { observeDom } from "./main-thread/observe-dom";

const workerManager = getWorker();

export const sequence = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());
	const debounce = getDebounce();

	let options = props
		.map((entry) => normalizeOptions(entry, config?.defaultOptions))
		.map(calculateStartTime)
		.sort((a, b) => a.startTime - b.startTime);

	let state = deriveSequenceState(options, worker);

	const enableReactivity = () =>
		state.reactivity.observe(async () => {
			state.reactivity.disconnect();

			const loadedAnimations = options
				.filter((entry) => state.currentTime > entry.startTime)
				.map((entry) => entry.key);

			options = options
				.filter((entry) => entry.root.isConnected)
				.map(calculateStartTime)
				.sort((a, b) => a.startTime - b.startTime);
			state = deriveSequenceState(options, worker);

			for (let index = 0; index < loadedAnimations.length; index++) {
				const optionIndex = options.findIndex((entry) => entry.key === loadedAnimations[index]);
				if (optionIndex === -1) {
					return;
				}

				await getState(optionIndex, api.play);
			}
		});

	const getState = async (index: number, callback: () => Promise<void>) => {
		if (state.animations.has(index)) {
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
			observeDom(options[index], worker);
			state.animations.set(index, await state.calculations[index]);
			state.inProgress = false;
			console.timeEnd("calculation");
		} catch (error) {
			state.globalTimekeeper.cancel();
		}
	};

	const api: Bewegung = {
		async play() {
			state.startTime = Date.now() - state.currentTime;
			state.reactivity.disconnect();
			options.forEach((entry, index) => {
				if (state.currentTime > entry.startTime) {
					return;
				}

				state.timer[index] = window.setTimeout(async () => {
					await getState(index, api.play);
					state.animations.get(index)?.forEach((animation) => animation.play());
					state.globalTimekeeper.play();
				}, entry.startTime - state.currentTime);
			});

			state.animations.forEach((animations) => {
				animations.forEach((animation) => {
					if (animation.playState !== "paused") {
						return;
					}
					animation.play();
				});
			});
		},
		async pause() {
			state.currentTime = Date.now() - state.startTime;
			state.timer.forEach((entry) => clearTimeout(entry));

			state.animations.forEach((animations) => {
				animations.forEach((animation) => animation.pause());
			});
			state.globalTimekeeper.pause();
			enableReactivity();
		},
		async seek(progress, done) {
			state.reactivity.disconnect();

			if (done) {
				state.globalTimekeeper.finish();
				return;
			}

			options.forEach(async (entry, index) => {
				const activeTime = entry.delay + entry.duration + entry.endDelay;
				const localProgress = (progress * state.totalRuntime - entry.startTime) / activeTime;

				if (localProgress > 1 || localProgress < 0) {
					return;
				}

				await getState(index, () => api.seek(progress, done));

				state.animations.get(index)?.forEach((animation) => {
					animation.currentTime = saveSeek(localProgress) * activeTime;
				});
			});
			state.globalTimekeeper.currentTime = saveSeek(progress) * state.totalRuntime;
			debounce(enableReactivity);
		},
		cancel() {
			state.animations.forEach((animations) => {
				animations.forEach((animation) => animation.cancel());
			});
			state.globalTimekeeper.cancel();
			worker("terminate").terminate();
		},
		finish() {
			options.forEach((entry, index) => {
				if (state.animations.has(index)) {
					state.animations.get(index)!.forEach((animation) => animation.finish());
					return;
				}
				entry.from?.();
				entry.to?.();
			});

			state.globalTimekeeper.finish();
		},
		get finished() {
			return state.globalTimekeeper.finished;
		},
		get playState() {
			return state.globalTimekeeper.playState;
		},
	};
	return api;
};
