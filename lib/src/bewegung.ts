import { animationsController } from "./client/animations";
import { normalizeArguments } from "./client/props";
import { createTimekeeper } from "./client/timekeeper";
import {
	Bewegung,
	BewegungsArgs,
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	FullBewegungsOption,
} from "./types";
import { workerMessenger } from "./worker/worker-messanger";

let bewegungsWorker: Worker | null = null;

const createWorker = () => {
	bewegungsWorker ??= new Worker(new URL("./worker/worker.ts", import.meta.url), {
		type: "module",
	});
	return bewegungsWorker;
};

window.requestIdleCallback?.(createWorker, { timeout: 2000 }) ?? setTimeout(createWorker, 2000);

export const bewegung: BewegungsArgs = (
	props: VoidFunction | FullBewegungsOption | BewegungsEntry[],
	config?: number | BewegungsOption | BewegungsConfig
): Bewegung => {
	const worker = workerMessenger(bewegungsWorker ?? createWorker());
	const options = normalizeArguments(props, config);
	const timekeeper = createTimekeeper(options, worker);
	const allAnimations = options.map((entry) => animationsController(entry, worker, timekeeper));

	return {
		play() {
			timekeeper.play();
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.play()));
		},
		pause() {
			timekeeper.pause();
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.pause()));
		},
		seek(progress, done) {
			if (done) {
				this.finish();
				return;
			}
			const guardedProgress = Math.max(0.0001, Math.min(0.9999, progress));
			const seekTo = guardedProgress * options[0].totalRuntime;
			timekeeper.currentTime = seekTo;

			allAnimations.forEach((animations) => {
				animations.forEach((entry) => {
					entry.currentTime = seekTo;
				});
			});
		},
		reverse() {
			timekeeper.reverse();
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.reverse()));
		},
		cancel() {
			timekeeper.cancel();
			allAnimations.forEach((animations) => {
				animations.forEach((entry) => entry.cancel());
				animations.clear();
			});
		},
		finish() {
			timekeeper.finish();
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.finish()));
		},
		forceUpdate(index?: number | number[]) {
			const indices = index ? index : options.map((_, index) => index);
			const asArray = Array.isArray(indices) ? indices : [indices];

			asArray.forEach((index) => {
				allAnimations[index].forEach((anim) => anim.cancel());
				allAnimations[index] = animationsController(options[index], worker, timekeeper);
			});
		},
		get finished() {
			return timekeeper.finished;
		},
		get playState() {
			return timekeeper.playState;
		},
	};
};
