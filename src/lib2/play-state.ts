import { AllPlayStates, AnimationFactory } from "./types";

const stateDefinition = {
	idle: {
		async running(animationFactory: AnimationFactory, payload: { onEnd: VoidFunction }) {
			const { onStart, animations, timeKeeper } = await animationFactory.results();
			onStart.forEach((cb) => cb());
			animations.forEach((animation) => {
				animation.play();
			});
			timeKeeper.onfinish = payload.onEnd;
		},
		finished() {
			animations.forEach((_, element) => {
				onStart(element);
				onEnd(element);
			});
		},
		scrolling() {
			animations.forEach((_, element) => {
				onStart(element);
			});
		},
		reversing() {
			animations.forEach((animation, element) => {
				onStart(element);
				animation.reverse();
			});
		},
	},
	running: {
		paused() {
			animations.forEach((animation) => {
				animation.pause();
			});
		},
		finished() {
			animations.forEach((_, element) => {
				onEnd(element);
			});
		},
		reversing() {
			animations.forEach((animation) => {
				animation.reverse();
			});
		},
	},
	paused: {
		running() {
			animations.forEach((animation) => {
				animation.play();
			});
		},
		finished() {
			animations.forEach((_, element) => {
				onEnd(element);
			});
		},
		reversing() {
			animations.forEach((animation) => {
				animation.reverse();
			});
		},
	},
	scrolling: {
		finished() {
			animations.forEach((_, element) => {
				onEnd(element);
			});
		},
	},
	reversing: {
		paused() {
			animations.forEach((animation) => {
				animation.pause();
			});
		},
		finished() {
			animations.forEach((_, element) => {
				onEnd(element);
			});
		},
		running() {
			animations.forEach((animation) => {
				animation.play();
			});
		},
	},
	finished: {},
};

export const getPlayState = (animationFactory: AnimationFactory) => {
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

		next(newState: AllPlayStates, payload?: {}) {
			const nextState = stateDefinition[playState]?.[newState];

			if (!nextState) {
				return playState;
			}

			nextState(animationFactory, { ...payload, ...internalPayload });
			playState = newState;
		},
	};

	return methods;
};
