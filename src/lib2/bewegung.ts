import { getAnimations } from "./animation";
import { BewegungAPI, BewegungProps, Result } from "./types";

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AnimationPlayState = "idle";

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = getAnimations(bewegungProps);
	}

	get playState() {
		return this.#playState;
	}

	get finished() {
		return Promise.resolve();
	}

	play() {
		const awaitAnimations = async () => {
			const { animations, onStart } = await this.#state;
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
