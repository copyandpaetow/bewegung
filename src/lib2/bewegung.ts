import { getAnimations } from "./animation";
import { BewegungAPI, BewegungProps, Result } from "./types";

type ExtendedPlayStates = "scrolling" | "reversing";
type AllPlayStates = AnimationPlayState | ExtendedPlayStates;
type StateMachine = Record<AllPlayStates, Partial<Record<AllPlayStates, VoidFunction>>>;

export class bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AllPlayStates = "idle";
	#stateMachine: StateMachine;

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#state = getAnimations(...bewegungProps);
		this.#setStateMachine();
		this.finished.then(() => this.#updatePlayState("finished"));
	}

	async #setStateMachine() {
		const { animations, onStart, onEnd } = await this.#state;
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
		//TODO: maybe there is a better way to await the readyness of the library
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
