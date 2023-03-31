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
			machine.transition("scroll", { scrollAmount, done });
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
			return machine.state();
		},
	};
};
