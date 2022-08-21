import { Chunks } from "./lib/types";

/*
do we want to have their own methods?

*/

const chunkState = () => {
	let map = new Map<symbol, Chunks>();
	let keys = new WeakMap<HTMLElement, symbol[]>();

	return {
		getKeys() {},
		setKeys() {},
	};
};

let state = chunkState();

const getOptions = (element: HTMLElement) => state.getKeys();
const resetState = () => (state = chunkState());

const bigFunction = () => {
	resetState();
};

/*
do we want smaller states or bigger ones

*/

const chunkState2 = () => {
	const chunkMap = new Map<symbol, Chunks>();
	const chunkKeys = new WeakMap<HTMLElement, symbol[]>();
	const state_originalStyle = new WeakMap<HTMLElement, string>();
	const state_mainElements = new Set<HTMLElement>();
	const state_affectedElements = new Set<HTMLElement>();
	const state_dependencyElements = new WeakMap<HTMLElement, Set<HTMLElement>>();
};

/*
if the state would be internal only, all of the caching issues would go away, but reactivity issues would aries...

*/
const calculateAnimation = (normalizedInput) => {
	const elementState = prepare(inputs);
	const chunkState = prepare(inputs);
	const styleState = createStyleState(elementState.getAllElements());
};

class Bewegung2 {
	constructor(...bewegungProps) {
		this.prepareInput(normalize(bewegungProps));
	}

	private input;
	private animation;
	private reactive;

	private playState;
	private currentTime;
	private progressTime;

	private prepareInput(normalizedInput) {
		this.input = normalizedInput;
		this.calculateState();
	}

	private calculateState() {
		this.animation = calculateAnimation(this.input);

		/*
			TODO: the animations are not enough, in the end there is also an "applyStyle" function needed:
			* it needs the element-, style-, afterAnimationCallback-, context-, image-, override-state
			? maybe we try to keep the state local in here as much as possible but move it to the upper scope if needed
			? => if this will impack performance we revert 
			
		*/
		queueMicrotask(() => {
			this.makeReactive();
		});
	}

	private makeReactive() {
		/*
			TODO: the makeReactive function also has some dependcies:
			* it needs the  elementProperties-, mainElements-, affectedElements-, chunk-, dependencyElement-State
			
		*/

		this.reactive.disconnect();
		this.reactive = listenForChange({
			recalcAll: (newInput) => this.prepareInput(newInput),
			recalcAnimations: () => this.calculateState(),
		});
	}
}

/*
	- original style is needed in the restoring the visuals in the reading step and in the methods (cancel)
	- getKeframe (chunks) is needed 
*/
