import { fetchAnimationData } from "./main-thread/animation-calculator";
import { extractAnimationOptions, normalizeOptions } from "./main-thread/normalize-props";
import { BewegungsCallback, BewegungsOption, MainMessages, WorkerMessages } from "./types";
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

export type BewegungsArgs = {
	(props: BewegungsCallback): Bewegung;
	(props: BewegungsCallback, duration: number): Bewegung;
	(props: BewegungsOption): Bewegung;
};

export const bewegung: BewegungsArgs = (
	props: BewegungsCallback | BewegungsOption,
	duration?: number
): Bewegung => {
	//	const reactivity = getReactivity();

	const { options, preferesReducedMotion } = normalizeOptions(props, duration);
	let state: Map<string, Animation> | null = null;
	let playState: AnimationPlayState = "idle";

	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());
	const timekeeper = new Animation(
		new KeyframeEffect(null, null, extractAnimationOptions(options))
	);

	//TODO: enable reactivity
	// how should this be different compared to the sequence?
	// const enableReactivity = () => {
	// 	reactivity.observe(() => {
	// 		reactivity.disconnect();
	// 		normalizedProps = filterProps(normalize(props, config));
	// 		state = null;
	// 	});
	// };

	const getState = async () => {
		if (state) {
			return;
		}

		if (preferesReducedMotion) {
			//todo: set another empty state
		}

		state = await fetchAnimationData({
			options,
			timekeeper,
			worker,
		});
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
