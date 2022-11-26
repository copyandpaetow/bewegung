import { getAnimations } from "./animation";
import { BewegungAPI, BewegungProps, Result } from "./types";

export class Bewegung implements BewegungAPI {
	#now: number;
	#state: Promise<Result>;
	#playState: AnimationPlayState = "idle";

	constructor(...bewegungProps: BewegungProps) {
		this.#now = Date.now();
		this.#state = getAnimations(...bewegungProps);
	}

	get playState() {
		return this.#playState;
	}

	get finished() {
		return Promise.resolve();
	}

	play() {}
	pause() {}
	scroll(progress: number, done?: boolean) {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate(rate: number) {}
}
