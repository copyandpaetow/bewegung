import { animationsController } from "./main-thread/create-animation";
import { normalizeArguments } from "./main-thread/normalize-props";
import { cleanup } from "./main-thread/resets";
import {
	Bewegung,
	BewegungsArgs,
	BewegungsConfig,
	BewegungsEntry,
	BewegungsOption,
	Direction,
	FullBewegungsOption,
	MainMessages,
	WorkerMessages,
} from "./types";
import { saveSeek } from "./utils/helper";
import { DelayedWorker, useWorker } from "./utils/use-worker";

const webworker = new DelayedWorker();

export const bewegung: BewegungsArgs = (
	props: VoidFunction | FullBewegungsOption | BewegungsEntry[],
	config?: number | BewegungsOption | BewegungsConfig
): Bewegung => {
	const worker = useWorker<MainMessages, WorkerMessages>(webworker.worker);

	const options = normalizeArguments(props, config);
	const totalRuntime = options[0].totalRuntime;
	const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));

	timekeeper.onfinish = timekeeper.oncancel = cleanup;

	const direction: Direction = { current: "forward" };

	const allAnimations = options.map((entry) =>
		animationsController(entry, worker, timekeeper, direction)
	);

	return {
		async play() {
			timekeeper.play();
			direction.current = "forward";
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.play()));
			console.log({ allAnimations });
		},
		async pause() {
			timekeeper.pause();
			allAnimations.forEach((animations) => animations.forEach((entry) => entry.pause()));
		},
		async seek(progress, done) {
			if (done) {
				timekeeper.finish();
				return;
			}
			const currentTime = timekeeper.currentTime as number;
			const seekTo = saveSeek(progress) * totalRuntime;
			direction.current = seekTo >= currentTime ? "forward" : "backward";
			timekeeper.currentTime = seekTo;

			allAnimations.forEach((animations) =>
				animations.forEach((entry) => (entry.currentTime = seekTo))
			);
		},
		cancel() {},
		finish() {},
		_forceUpdate(index?: number | number[]) {
			const indices = index ? index : options.map((_, index) => index);
			const asArray = Array.isArray(indices) ? indices : [indices];

			asArray.forEach((index) => {
				allAnimations[index].forEach((anim) => anim.cancel());

				allAnimations[index] = animationsController(options[index], worker, timekeeper, direction);
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
