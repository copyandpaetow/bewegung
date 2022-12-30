import { getAnimations } from "./animation";
import { createStateMachine } from "./fsm";
import { AllPlayStates, BewegungAPI, BewegungProps, Result, StateMachine } from "./types";

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: { getResults: () => Promise<Result> };
	#playState: {
		current(): AllPlayStates;
		nextState(nextState: AllPlayStates): void;
	};

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = getAnimations(bewegungProps);
		this.#playState = createStateMachine(this.#state.getResults());
	}

	get playState() {
		if (["scrolling", "reversing"].includes(this.#playState.current())) {
			return "running";
		}
		if (["running", "finished", "paused"].includes(this.#playState.current())) {
			return this.#playState.current() as AnimationPlayState;
		}

		return "idle";
	}

	get finished() {
		return Promise.resolve();
	}

	play() {
		const awaitAnimations = async () => {
			const { animations, onStart } = await this.#state.getResults();
			onStart.forEach((cb) => cb());
			animations.forEach((animation) => {
				animation.play();
				//animation.pause();
			});
			console.log(`it took ${Date.now() - this.#now}ms`);
		};
		return awaitAnimations();
	}
	pause() {}
	scroll(progress: number, done?: boolean) {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate(rate: number) {}
}
