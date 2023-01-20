import { Animations } from "./animation";
import { unifyPropStructure } from "./main-thread/normalize-props";
import { AllPlayStates, BewegungAPI, BewegungProps, Result } from "./types";

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: { results: () => Promise<Result> };
	#playState: {
		current(): AllPlayStates;
		nextState(nextState: AllPlayStates): void;
	};

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = Animations(unifyPropStructure(bewegungProps));
		//this.#playState = createStateMachine(this.#state.getResults());
	}

	get playState() {
		// if (["scrolling", "reversing"].includes(this.#playState.current())) {
		// 	return "running";
		// }
		// if (["running", "finished", "paused"].includes(this.#playState.current())) {
		// 	return this.#playState.current() as AnimationPlayState;
		// }

		return "idle" as AnimationPlayState;
	}

	get finished() {
		return Promise.resolve();
	}

	play() {
		const awaitAnimations = async () => {
			const { animations, onStart } = await this.#state.results();

			onStart.forEach((cb) => cb());
			animations.forEach((animation) => {
				animation.play();
				animation.pause();
			});
			console.log(`it took ${Date.now() - this.#now}ms`);
		};
		awaitAnimations();
		return;
	}
	pause() {}
	scroll(progress: number, done?: boolean) {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate(rate: number) {}
}
