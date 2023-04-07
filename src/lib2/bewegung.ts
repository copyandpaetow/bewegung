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
=> both need position: absolute and custom layouting, which involes the readout and the parent readout
=> removed elements should be fine but added elements get new dom elements and need their animation "reapplied"
=> these two should get their own readout state like the images have

 ? For some reason the callback order and the key numbering added latest do not match the ones from before. If in the user function other functions are called 
 ? as well, we get more mutationRecords
 => how can this be less fragile?
 => maybe we could use the microtask queue as well as the mutation observer callback 
 => other options would serializing the html element, so the key should stay the same
 => use .sameNode() or can we use the insertion order as key? 

 => we could wrapp the user function into another function that sets a state or something 

? would it be easier to store the added elements instead of deleting them and updating the key again? We would need some kind of key for this

* we can use the old value for the attributes and may not need to restore all elements

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
