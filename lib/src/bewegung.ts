import { getAnimationController } from "./main-thread/animation-controller";
import { normalize } from "./main-thread/normalize-props";
import { BewegungsConfig, BewegungsInputs } from "./types";

export type Bewegung = {
	play(): void;
	pause(): void;
	seek(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AnimationPlayState;
};

export const bewegung = (props: BewegungsInputs, config?: BewegungsConfig): Bewegung => {
	const normalizedProps = normalize(props, config);
	const controller = getAnimationController(normalizedProps);

	return {
		play() {
			controller.queue("play");
		},
		pause() {
			controller.queue("pause");
		},
		seek(amount, done) {
			controller.queue("seek", { amount, done });
		},
		cancel() {
			controller.queue("cancel");
		},
		finish() {
			controller.queue("cancel");
		},
		get finished() {
			return controller.finished();
		},
		get playState() {
			return controller.playState();
		},
	};
};
