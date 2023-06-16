import { AnimationController, NormalizedProps } from "../types";
import { resolvable } from "../utils/helper";
import { fetchAnimationData } from "./animation-calculator";
import { getReactivity } from "./watch-dom-changes";

const filterProps = (normalizedProps: NormalizedProps[]): NormalizedProps[] => {
	return normalizedProps.filter((entry) => entry.root.isConnected);
};

export const getAnimationController = (props: NormalizedProps[]): AnimationController => {
	let allAnimations: Promise<Map<string, Animation>> | null = null;
	let playState: AnimationPlayState = "idle";
	const finishedResolvable = resolvable<Animation>();
	let time = Date.now();
	let allowNextTick = true;
	const reactivity = getReactivity();

	const methods = {
		async play() {
			(await allAnimations)?.forEach((anim) => anim.play());
			console.log(`calculation took ${Date.now() - time}ms`);
		},
		async pause() {
			(await allAnimations)?.forEach((animation) => animation.pause());
			const progress = ((await allAnimations)?.get("timekeeper")?.currentTime ?? 0) as number;
			reactivity.observe(() => {
				allAnimations = fetchAnimationData(filterProps(props));
				methods.seek({ progress, done: false });
			});
		},
		async seek(payload: { progress: number; done: boolean }) {
			if (!allowNextTick) {
				return;
			}
			allowNextTick = false;
			(await allAnimations)?.forEach((animation) => (animation.currentTime = payload.progress));
			allowNextTick = true;
			if (payload.done) {
				methods.finish();
				allowNextTick = false;
			}
		},
		async cancel() {
			(await allAnimations)?.forEach((animation) => animation.cancel());
		},
		finish() {
			if (allAnimations) {
				allAnimations.then((allAnimations) => {
					allAnimations.forEach((animation) => animation.finish());
				});
				return;
			}
		},
	};

	return {
		queue(method, payload) {
			if (!allAnimations) {
				allAnimations = fetchAnimationData(props);
			}
			//todo: queuing system needed
			methods[method](payload);
		},
		finished() {
			return finishedResolvable.promise;
		},
		playState() {
			return playState;
		},
	};
};
