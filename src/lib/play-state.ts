import { AllPlayStates, AnimationFactory, InternalPayload, PlayStateManager } from "./types";

const stateDefinition = {
	idle: {
		async running(animationFactory: AnimationFactory, payload: InternalPayload) {
			const { onStart, animations, timeKeeper } = await animationFactory.results();
			onStart.forEach((cb) => cb());
			animations.forEach((animation) => {
				animation.play();
			});
			timeKeeper.onfinish = payload.onEnd;
		},
		async finished(animationFactory: AnimationFactory, payload: InternalPayload) {
			const { onStart } = await animationFactory.results();
			onStart.forEach((cb) => cb());
			payload.onEnd();
		},
		async scrolling(
			animationFactory: AnimationFactory,
			payload: { onEnd: VoidFunction; done: boolean; progress: number }
		) {
			const { onStart, animations, timeKeeper, totalRuntime } = await animationFactory.results();

			onStart.forEach((cb) => cb());
			timeKeeper.onfinish = payload.onEnd;

			if (payload.done) {
				animations.forEach((animation) => {
					animation.finish();
				});
				return;
			}
			const currentFrame =
				-1 *
				Math.min(Math.max(payload.progress, 0.001), payload.done === undefined ? 1 : 0.999) *
				totalRuntime;

			animations.forEach((animation) => {
				animation.currentTime = currentFrame;
			});
		},
		async reversing(animationFactory: AnimationFactory, payload: InternalPayload) {
			const { onStart, animations, timeKeeper } = await animationFactory.results();
			onStart.forEach((cb) => cb());
			animations.forEach((animation) => {
				animation.reverse();
			});
			timeKeeper.onfinish = payload.onEnd;
		},
	},
	running: {
		async paused(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.pause();
			});
		},
		async finished(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.finish();
			});
		},
		async reversing(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.reverse();
			});
		},
	},
	paused: {
		async running(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.play();
			});
		},
		async finished(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.finish();
			});
		},
		async reversing(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.reverse();
			});
		},
	},
	scrolling: {
		finished() {},
	},
	reversing: {
		async paused(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.pause();
			});
		},
		async running(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.play();
			});
		},
		async finished(animationFactory: AnimationFactory) {
			const { animations } = await animationFactory.results();

			animations.forEach((animation) => {
				animation.finish();
			});
		},
	},
	finished: {},
};

export const getPlayState = (animationFactory: AnimationFactory): PlayStateManager => {
	let playState: AllPlayStates = "idle";

	const internalPayload = {
		onEnd() {
			methods.next("finished");
		},
	};

	const methods = {
		current() {
			if (["scrolling", "reversing"].includes(playState)) {
				return "running";
			}
			if (["running", "finished", "paused"].includes(playState)) {
				return playState as AnimationPlayState;
			}

			return "idle" as AnimationPlayState;
		},

		async next(newState: AllPlayStates, payload?: { progress: number; done: boolean }) {
			//@ts-expect-error
			const nextState = await stateDefinition[playState]?.[newState];

			if (!nextState) {
				return playState;
			}

			nextState(animationFactory, { ...payload, ...internalPayload });
			playState = newState;
			return playState;
		},
	};

	return methods;
};
