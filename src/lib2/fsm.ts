import { AllPlayStates, Result, StateMachine } from "./types";

const getFsm = (animations: Animation[], onStart: VoidFunction[]): StateMachine => {
	const executeCallbacks = () => onStart.forEach((cb) => cb());

	return {
		idle: {
			running() {
				animations.forEach((animation) => {
					executeCallbacks();
					animation.play();
				});
			},
			finished() {
				animations.forEach(() => {
					executeCallbacks();
				});
			},
			scrolling() {
				animations.forEach(() => {
					executeCallbacks();
				});
			},
			reversing() {
				animations.forEach((animation) => {
					executeCallbacks();
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
			reversing() {
				animations.forEach((animation) => {
					animation.reverse();
				});
			},
		},
		scrolling: {},
		reversing: {
			paused() {
				animations.forEach((animation) => {
					animation.pause();
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
};

export const createStateMachine = (result: Promise<Result>) => {
	let state: AllPlayStates = "idle";
	let fsm: StateMachine | undefined;
	result.then(({ animations, onStart }) => {
		fsm = getFsm(animations, onStart);
	});

	return {
		current() {
			return state;
		},
		nextState(nextState: AllPlayStates) {
			if (!fsm) {
				return;
			}
			const newState = fsm[state]?.[nextState];

			if (newState) {
				newState();
				state = nextState;
			}
		},
	};
};
