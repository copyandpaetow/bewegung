import { type } from "os";
import { getAnimations } from "./animation";
import { normalizeProps } from "./normalize/structure";
import { AnimationsAPI, BewegungAPI, BewegungProps, Result } from "./types";

type ExtendedPlayStates = "scrolling" | "reversing";
type AllPlayStates = AnimationPlayState | ExtendedPlayStates;

export class bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AnimationPlayState = "idle";

	constructor(...bewegungProps: BewegungProps) {
		this.#now = performance.now();
		this.#state = getAnimations(...bewegungProps);
		this.#setOnAnimationEnd();
	}

	async #setOnAnimationEnd() {
		const { animations, onEnd } = await this.#state;
		console.log(`calculation took ${performance.now() - this.#now}ms`);

		animations.forEach((animation, element) => (animation.onfinish = () => onEnd(element)));
	}

	async #updatePlayState(newState: AllPlayStates) {
		const { animations, onStart } = await this.#state;

		switch (this.#playState) {
			case "idle":
				switch (newState) {
					case "running":
						this.#playState = "running";
						animations.forEach((animation, element) => {
							onStart(element);
							animation.play();
							animation.pause();
						});
						break;
					case "reversing":
						animations.forEach((animation, element) => {
							onStart(element);
							animation.reverse();
						});

					default:
						break;
				}
				break;

			case "paused":
				switch (newState) {
					case "running":
						this.#playState = "paused";
						animations.forEach((animation) => {
							animation.pause();
						});
						break;

					default:
						break;
				}
				break;

			default:
				break;
		}
	}

	get playState() {
		return this.#playState;
	}

	get finished() {
		const awaitAnimations = async () => {
			const state = await this.#state;
			await Promise.all(
				Array.from(state.animations.values()).map((animation) => animation.finished)
			);
			return;
		};
		return awaitAnimations();
	}

	play() {
		this.#updatePlayState("running");
	}
	pause() {}
	scroll() {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate() {}
}
