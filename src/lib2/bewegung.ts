import { getAnimations } from "./animation";
import { AllPlayStates, BewegungAPI, BewegungProps, Result, StateMachine } from "./types";

export class bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AllPlayStates = "idle";
	#stateMachine: StateMachine;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = getAnimations(...bewegungProps);
		this.#setStateMachine();
		this.finished.then(() => this.#updatePlayState("finished"));
	}

	async #setStateMachine() {
		const { animations, onStart, onEnd } = await this.#state;
		console.log(`calculation took ${Date.now() - this.#now}ms`);
		this.#stateMachine = {
			idle: {
				running() {
					animations.forEach((animation, element) => {
						onStart(element);
						animation.play();
					});
				},
				finished() {
					animations.forEach((_, element) => {
						onEnd(element);
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
			},
			scrolling: {},
			reversing: {},
			finished: {},
		};
	}

	async #updatePlayState(newState: AllPlayStates) {
		await this.#state;

		const nextState: VoidFunction | undefined = this.#stateMachine[this.#playState]?.[newState];

		if (nextState) {
			nextState();
			this.#playState = newState;
		}
	}

	get playState() {
		if (["scrolling", "reversing"].includes(this.#playState)) {
			return "running";
		}
		if (["running", "finished", "paused"].includes(this.#playState)) {
			return this.#playState as AnimationPlayState;
		}

		return "idle";
	}

	get finished() {
		const awaitAnimations = async () => {
			const { animations } = await this.#state;
			await Promise.all(Array.from(animations.values()).map((animation) => animation.finished));
		};
		return awaitAnimations();
	}

	play() {
		this.#updatePlayState("running");
	}
	pause() {
		this.#updatePlayState("paused");
	}
	scroll() {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate() {}
}
