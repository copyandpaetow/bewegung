import { fetchAnimationData } from "./main-thread/animation-calculator";
import { filterProps, normalize } from "./main-thread/normalize-props";
import { getReactivity } from "./main-thread/watch-dom-changes";
import { BewegungsConfig, BewegungsInputs } from "./types";
import { resolvable } from "./utils/helper";

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Map<string, Animation>>;
	playState: AnimationPlayState;
};

const preferesReducedMotion =
	window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

const getMotionPreference = (config?: BewegungsConfig) =>
	config?.reduceMotion ?? preferesReducedMotion;

export const bewegung = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
	const finishedResolvable = resolvable<Map<string, Animation>>();
	const reactivity = getReactivity();
	const reduceMotion = getMotionPreference(config);

	let normalizedProps = normalize(props, config);
	let state: Map<string, Animation> | null = null;
	let playState: AnimationPlayState = "idle";

	const enableReactivity = () => {
		reactivity.observe(() => {
			reactivity.disconnect();
			normalizedProps = filterProps(normalize(props, config));
			state = null;
		});
	};

	const getState = async () => {
		if (reduceMotion && !state) {
			//todo: set another state
		}

		state ??= await fetchAnimationData(normalizedProps, finishedResolvable);
	};

	const api: Bewegung = {
		async play() {
			console.time("play");
			await getState();
			console.timeEnd("play");
			state!.forEach((animation) => animation.play());
			playState = "running";
		},
		async pause() {
			await getState();
			state!.forEach((animation) => animation.pause());
			playState = "paused";
			enableReactivity();
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
			return finishedResolvable.promise;
		},
		get playState() {
			return playState ?? "idle";
		},
	};

	return api;
};
