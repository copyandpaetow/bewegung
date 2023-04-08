import { getAnimationStateMachine } from "./animation";
import { createState } from "./normalize-props";
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

- iterations need to be included in the calculations
- "at" needs to be more refined
- options need to be rechecked. Should more be included? 

- added and removed elements need to get special treatment
=> we might need to readd the height and unsaveHeight
=> these two should get their own readout state as well as images
=> currently they are treated as default if they dont change in scale, in that case we could delete the readout

- there are some tasks we dont have to do upfront
=> element resets
=> setting up the timekeeper

- try to avoid if statements in loops, better filter before
- there are a lot of similarities between the MOs, that could be unified

*/

export const bewegung2 = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Bewegung => {
	const state = createState(props, globalConfig);
	const machine = getAnimationStateMachine(state);

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
			return state.finishPromise;
		},
		get playState() {
			return machine.state();
		},
	};
};
