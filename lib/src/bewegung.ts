import { getAnimations } from "./animation";
import { AllPlayStates, BewegungAPI, BewegungProps, Result, StateMachine } from "./types";

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AllPlayStates = "idle";
	#stateMachine: StateMachine;

	#currentTime = 0;
	#progressTime = 0;
	#unobserve = () => {};

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = getAnimations(...bewegungProps);
		this.#setStateMachine();
		this.#makeReactive();
		this.finished.then(() => {
			this.#unobserve;
			this.#updatePlayState("finished");
		});
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
	}

	async #updatePlayState(newState: AllPlayStates) {
		await this.#state;

		const nextState: VoidFunction | undefined = this.#stateMachine[this.#playState]?.[newState];

		if (nextState) {
			nextState();
			this.#playState = newState;
		}
	}

	async #keepProgress() {
		const state = await this.#state;
		const currentTime = state.timekeeper.currentTime ?? 0;
		if (this.playState === "running") {
			this.#currentTime = performance.now();
			this.#progressTime = currentTime;
		}

		if (this.playState === "paused") {
			this.#currentTime = 0;
			this.#progressTime = currentTime;
		}
	}

	async #makeReactive() {
		const state = await this.#state;

		const before = () => {
			if (this.playState === "idle") {
				return;
			}
			this.#now = Date.now();
			this.#keepProgress();
			state.animations.forEach((animation, element) => {
				animation.cancel();
				state.resetStyle(element);
			});
		};

		const after = () => {
			if (this.playState === "idle") {
				return;
			}
			let progress = this.#progressTime;
			if (this.#currentTime !== 0) {
				progress += Date.now() - this.#currentTime;
			}

			state.animations.forEach((animation, element) => {
				state.onStart(element);
				animation.currentTime = progress;
			});
		};
		setTimeout(() => {
			if (this.playState === "running") {
				return;
			}
			this.#unobserve = state.observe(before, after);
		}, 10);
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
		this.#keepProgress();
		this.#makeReactive();
		this.#updatePlayState("paused");
	}
	scroll(progress: number, done?: boolean) {
		if (done) {
			this.#updatePlayState("finished");
			return;
		}

		const awaitAnimations = async () => {
			const { animations, scroll } = await this.#state;
			const currentFrame = scroll(progress, done);
			this.#updatePlayState("scrolling");
			animations.forEach((animation) => {
				animation.currentTime = currentFrame;
			});

			this.#progressTime = currentFrame;
		};
		return awaitAnimations();
	}
	reverse() {
		this.#updatePlayState("reversing");
	}
	cancel() {
		const awaitAnimations = async () => {
			const { animations } = await this.#state;
			animations.forEach((animation) => {
				animation.cancel();
			});
			this.#unobserve();
		};
		return awaitAnimations();
	}
	finish() {
		this.#updatePlayState("finished");
	}
	commitStyles() {
		const awaitAnimations = async () => {
			const { animations, onEnd, onStart } = await this.#state;
			animations.forEach((animation, element) => {
				animation.cancel();
				onStart(element);
				onEnd(element);
			});
			this.#unobserve();
		};
		return awaitAnimations();
	}
	updatePlaybackRate(rate: number) {
		const awaitAnimations = async () => {
			const { animations } = await this.#state;
			animations.forEach((animation) => {
				animation.updatePlaybackRate(rate);
			});
			this.#unobserve();
		};
		return awaitAnimations();
	}
}
