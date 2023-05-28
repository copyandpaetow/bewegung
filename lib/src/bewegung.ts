import { animationController } from "./main-thread/animation-controller";
import { normalizeProps } from "./main-thread/normalize-props";
import { BewegungsConfig, BewegungsInputs } from "./types";
import { emptyApi } from "./utils/constants";
import { transformProgress } from "./utils/helper";

export type Bewegung = {
	play(): void;
	pause(): void;
	scroll(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	prefetch(): Promise<void>;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

export const bewegung = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
	const { callbacks, totalRuntime } = normalizeProps(props, config);
	const timekeeper = new Animation(new KeyframeEffect(null, null, totalRuntime));
	const controller = animationController(callbacks, totalRuntime, timekeeper);

	const reduceMotion =
		config?.reduceMotion ?? window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

	if (reduceMotion) {
		timekeeper.finish();
		return emptyApi();
	}

	return {
		play() {
			controller.play();
		},
		pause() {
			controller.pause();
		},
		scroll(scrollAmount: number, done = false) {
			controller.scroll(transformProgress(totalRuntime, scrollAmount, done), done);
		},
		cancel() {
			controller.cancel();
		},
		finish() {
			controller.finish();
		},
		async prefetch() {
			await controller.prefetch();
		},
		get finished() {
			return timekeeper.finished;
		},
		get playState() {
			return timekeeper.playState;
		},
	};
};
