/*

queue: a runable Function runner with requestIdleCallback and maybe another one with requestAnimationFrame

SoA: State should be a structure of arrays modeled after the input arguments

1. format inputs
2. create SoA struccture with empty arrays for future calculations
3. calculate global values like totalRuntime
4. transform inputs with values from #3
5. get all relevant elements and calculate their dimensions (all for the first round)
6. postprocess data per entry (recalc display:none and generate overrides) 
7. delete unchanged elements
8. generate keyframes and animation

reactivity
RO: start from 5
IO:


does it make sense to group them or just to have every one of then seperate? 

at least the target should be singular, because we can do stuff like this 

shape(target)(previousValue, mappingFn)

*/

interface Queue {
	run: Promise<void>;
	enqueue: (fn: VoidFunction) => void;
}

interface State {
	target: Set<HTMLElement>[];
	keyframes: ComputedKeyframe[][];
	callbacks: VoidFunction[];
	Options: ComputedEffectTiming[];
	selector: string[];
}

interface ComputedState {
	calculations: DOMRect[][];
	override: CSSStyleDeclaration[][];
	resets: Map<string, string>[];
	animations: Animation[][];
}

interface SecondaryState {
	affectedElements: HTMLElement[][];
	calculations: DOMRect[][];
	override: CSSStyleDeclaration[][];
	animations: Animation[][];
}

//alternative

interface State2 {
	target: HTMLElement[][];
	keyframes: ComputedKeyframe[][];
	callbacks: VoidFunction[];
	Options: ComputedEffectTiming[];
	selector: string[];
	affectedElements: HTMLElement[][];
	override: CSSStyleDeclaration[][];
	affectedElements_override: CSSStyleDeclaration[][];
}

interface Calulations {
	calculations: DOMRect[][];
	affectedElements_calculations: DOMRect[][];
}

interface Animations {
	animations: Animation[][];
	affectedElements_animations: Animation[][];
}

// alternative 2

interface Shape1 {
	target: HTMLElement[][];
}

interface ShapeValues {
	keyframes: ComputedKeyframe[][];
	callbacks: VoidFunction[];
	Options: ComputedEffectTiming[];
	selector: string[];
	affectedElements: HTMLElement[][];
	//
	override: CSSStyleDeclaration[][];
	calculations: DOMRect[][];
	animations: Animation[][];
}

interface AffectedShapeValues {
	affectedElements_override: CSSStyleDeclaration[][];
	affectedElements_calculations: DOMRect[][];
	affectedElements_animations: Animation[][];
}
