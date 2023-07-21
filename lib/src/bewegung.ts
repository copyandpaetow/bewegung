import { fetchAnimationData } from "./main-thread/animation-calculator";
import { filterProps, normalize } from "./main-thread/normalize-props";
import { getReactivity } from "./main-thread/watch-dom-changes";
import { BewegungsConfig, BewegungsInputs } from "./types";
import { queue, resolvable } from "./utils/helper";

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Map<string, Animation>>;
	playState: AnimationPlayState;
};

export const bewegung = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
	const finishedResolvable = resolvable<Map<string, Animation>>();
	const normalizedProps = normalize(props, config);
	const reactivity = getReactivity();
	let time = Date.now();

	let animationQueue = queue(() => fetchAnimationData(normalizedProps, finishedResolvable));
	let playState: AnimationPlayState = "idle";

	const methods = {
		play(animations: Map<string, Animation>) {
			console.log(`calculation time: ${Date.now() - time}ms`);
			animations.forEach((animation) => animation.play());
			animations.forEach((animation) => animation.pause());
			playState = "running";
		},
		pause(animations: Map<string, Animation>) {
			animations.forEach((animation) => animation.pause());
			playState = "paused";

			const progress = (animations.get("timekeeper")?.currentTime ?? 0) as number;
			reactivity.observe(() => {
				animationQueue = queue(() =>
					fetchAnimationData(filterProps(normalizedProps), finishedResolvable)
				);
				methods.seek(animations, { progress, done: false });
			});
		},
		seek(animations: Map<string, Animation>, payload: { progress: number; done: boolean }) {
			animations.forEach((animation) => (animation.currentTime = payload.progress));
			playState = "running";

			//todo: reactivity should be enabled after some time if seeking is used
			if (payload.done) {
				methods.finish(animations);
				playState = "finished";
			}
		},
		cancel(animations: Map<string, Animation>) {
			animations.forEach((animation) => animation.cancel());
			playState = "finished";
		},
		finish(animations: Map<string, Animation>) {
			animations.forEach((animation) => animation.finish());
			playState = "finished";
		},
	};

	return {
		play() {
			time = Date.now();
			animationQueue.next(methods.play);
		},
		pause() {
			animationQueue.next(methods.pause);
		},
		seek(progress, done) {
			animationQueue.next((animations) => {
				methods.seek(animations, { progress, done: done ?? false });
			});
		},
		cancel() {
			animationQueue.next(methods.cancel);
		},
		finish() {
			animationQueue.next(methods.finish);
		},
		get finished() {
			return finishedResolvable.promise;
		},
		get playState() {
			return playState;
		},
	};
};
