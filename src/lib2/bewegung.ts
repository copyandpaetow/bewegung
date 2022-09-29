import { getAnimations } from "./animation";
import { AnimationsAPI, BewegungAPI, BewegungProps } from "./types";
import { normalizeProps } from "./normalize";

export class bewegung implements BewegungAPI {
	#animation: AnimationsAPI;

	constructor(...bewegungProps: BewegungProps) {
		this.#animation = getAnimations(normalizeProps(...bewegungProps));
	}

	get playState() {
		return this.#animation.playState;
	}

	get finished() {
		return this.#animation.finished;
	}

	play() {
		this.#animation.play();
	}
	pause() {}
	scroll() {}
	reverse() {}
	cancel() {}
	finish() {}
	commitStyles() {}
	updatePlaybackRate() {}
}
