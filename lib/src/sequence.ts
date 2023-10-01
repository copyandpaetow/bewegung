import {
	read,
	removeDataAttributes,
	removeElements,
	replaceImagePlaceholders,
} from "./main-thread/animation-calculator";
import { animationCreator } from "./main-thread/create-animation";
import {
	calculateStartTime,
	getTotalRuntime,
	normalizeOptions,
} from "./main-thread/normalize-props";
import { BewegungsConfig, BewegungsInputs, MainMessages, WorkerMessages } from "./types";
import { getWorker, useWorker } from "./utils/use-worker";

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

	let options = props
		.map((entry) => normalizeOptions(entry, config?.defaultOptions))
		.map(calculateStartTime)
		.sort((a, b) => a.startTime - b.startTime);

	let totalRuntime = getTotalRuntime(options);
	let calculations = options.map((option) => animationCreator(option, worker));
	let timer = options.map((_) => 0);
	let animations = new Map<number, Map<string, Animation>>();
	let inProgress = false;
	let currentTime = 0;
	let startTime = 0;

	const globalTimekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
	globalTimekeeper.onfinish = globalTimekeeper.oncancel = () =>
		requestAnimationFrame(() => {
			replaceImagePlaceholders();
			removeElements();
			removeDataAttributes();
		});

	const api: Bewegung = {
		async play() {
			startTime = Date.now() - currentTime;
			options.forEach((entry, index) => {
				if (currentTime > entry.startTime) {
					return;
				}

				timer[index] = window.setTimeout(async () => {
					read(entry, worker);
					const localAnimations = await calculations[index];
					animations.set(index, localAnimations);

					localAnimations.forEach((animation) => animation.play());
					globalTimekeeper.play();
				}, entry.startTime - currentTime);
			});

			animations.forEach((animations) => {
				animations.forEach((animation) => {
					if (animation.playState !== "paused") {
						return;
					}
					animation.play();
				});
			});
		},
		async pause() {
			currentTime = Date.now() - startTime;
			timer.forEach((entry) => clearTimeout(entry));

			animations.forEach((animations) => {
				animations.forEach((animation) => animation.pause());
			});
			globalTimekeeper.pause();
		},
		async seek(progress, done) {
			if (done) {
				globalTimekeeper.finish();
				return;
			}

			options.forEach(async (entry, index) => {
				const activeTime = entry.delay + entry.duration + entry.endDelay;
				const localProgress = (progress * totalRuntime - entry.startTime) / activeTime;

				if (inProgress || localProgress > 1 || localProgress < 0) {
					return;
				}

				if (!animations.has(index)) {
					inProgress = true;
					read(entry, worker);
					animations.set(index, await calculations[index]);
					inProgress = false;
				}

				animations.get(index)!.forEach((animation) => {
					animation.currentTime = localProgress * activeTime;
				});

				globalTimekeeper.currentTime = progress * totalRuntime;
			});
		},
		cancel() {
			animations.forEach((animations) => {
				animations.forEach((animation) => animation.cancel());
			});
			globalTimekeeper.cancel();
			worker("terminate").terminate();
		},
		finish() {
			options.forEach((entry, index) => {
				if (animations.has(index)) {
					animations.get(index)!.forEach((animation) => animation.finish());
					return;
				}
				entry.from?.();
				entry.to?.();
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
