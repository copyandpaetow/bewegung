import { animationsController } from "./main-thread/animations";
import { normalizeArguments } from "./main-thread/props";
import { createTimekeeper } from "./main-thread/timekeeper";
import {
	Bewegung,
	BewegungsArgs,
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	FullBewegungsOption,
} from "./types";
import { saveSeek } from "./utils/helper";
import { WorkerMessanger, DelayedWorker } from "./utils/worker-messanger";

export const Webworker = new DelayedWorker();

export const bewegung: BewegungsArgs = (
	props: VoidFunction | FullBewegungsOption | BewegungsEntry[],
	config?: number | BewegungsOption | BewegungsConfig
): Bewegung => {
	const worker = new WorkerMessanger(Webworker.worker);
	const options = normalizeArguments(props, config);
	const timekeeper = createTimekeeper(options, Webworker);

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

			const seekTo = saveSeek(progress) * options[0].totalRuntime;
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
