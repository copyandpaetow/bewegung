import { getAnimationStateMachine } from "./animation";
import { createContext } from "./normalize-props";
import { AllPlayStates, BewegungsBlock, BewegungsConfig } from "./types";

export type Bewegung = {
	play(): void;
	pause(): void;
	scroll(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<void>;
	playState: AllPlayStates;
};

/*
TODO:

- the animation callbacks need to be stacked e.g. if there is a sequence with 3 callbacks
=> they need to be in the order of 1, 1+2, 1+2+3, because we restore the individual callbacks (and not 1, 2, 3)


*/

export const bewegung2 = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Bewegung => {
	const context = createContext(props, globalConfig);
	const machine = getAnimationStateMachine(context);

	return {
		play() {
			machine.transition("play");
		},
		pause() {
			machine.transition("pause");
		},
		scroll(scrollAmount: number, done = false) {
			machine.transition("load", { scrollAmount, done, nextPlayState: "scroll" });
		},
		cancel() {
			machine.transition("cancel");
		},
		finish() {
			machine.transition("finish");
		},
		get finished() {
			return context.finishPromise;
		},
		get playState() {
			return machine.get();
		},
	};
};
