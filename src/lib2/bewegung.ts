import { getAnimationStateMachine } from "./animation";
import { normalizeProps } from "./normalize-props";
import {
	AllPlayStates,
	BewegungsBlock,
	BewegungsConfig,
	MainMessages,
	WorkerMessages,
} from "./types";
import { getWorker, useWorker } from "./utils/use-worker";

export type Bewegung = {
	play(): void;
	pause(): void;
	scroll(scrollAmount: number, done?: boolean): void;
	cancel(): void;
	finish(): void;
	finished: Promise<Animation>;
	playState: AllPlayStates;
};

/*
TODO:

- iterations need to be included in the calculations
- "at" needs to be more refined
- options need to be rechecked. Should more be included? 

if there is an overlap within the sequence, it will create additional easings
? should these be used in the keyframes? Should there be another readout for that timing?

? if a root element is removed, should it be removed from the props as well? => it could get readded

? for all animated properties like clipPath or transform: what happens if the element already has some?

*/
const workerManager = getWorker();

export const bewegung2 = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): Bewegung => {
	const normalizedProps = normalizeProps(props, globalConfig);
	const timekeeper = new Animation(new KeyframeEffect(null, null, normalizedProps.totalRuntime));
	const worker = useWorker<MainMessages, WorkerMessages>(workerManager.current());
	const machine = getAnimationStateMachine(normalizedProps, timekeeper, worker);

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
			return timekeeper.finished;
		},
		get playState() {
			return machine.state();
		},
	};
};
