/*
- no hidden ifs like "isActive"
=> use Arrays for this: one Active Array and one Inactive one => move elements accordingly

- have data only and functions to operate on them. Each combination creates new data that other system can work on

- maybe it would be good to have an internal function/class that just passes the data from the api class
=> only the outside facing methods are in there (play, pause, scroll...) these point to the inner function who access the state
=> in there we wouldnt need to use classes at all

*/

const el1 = document.createElement("div");
const el2 = document.createElement("div");
const el3 = document.createElement("div");
const el4 = document.createElement("div");

const ela = document.createElement("div");
const elb = document.createElement("div");
const elc = document.createElement("div");
const eld = document.createElement("div");
const ele = document.createElement("div");
const elf = document.createElement("div");
const elg = document.createElement("div");
const elh = document.createElement("div");

[
	[
		el1,
		{ width: ["30%", "100%", "55%"], height: ["50vh", "25vh", "65vh"] },
		{ duration: 4000, easing: "ease" },
	],
	[
		[el1, el2, el3, el4],
		{ width: "", height: "" },
		{ duration: 4000, easing: "ease-in" },
	],
];

//pre-refined structure
const primaryStructure = {
	target: [new Set([el1]), new Set([el1, el2, el3, el4])],
	keyframes: [
		[{}, {}],
		[{}, {}],
	],
	callbacks: [
		[{}, {}],
		[{}, {}],
	],
	Options: [{}, {}],
	selector: ["el1", "all-elements"],
};
const totalRuntime = getTotalRuntime(Options);

const Queue: VoidFunction[] = [];

Queue.push(() => updateKeyframes(primaryStructure.keyframes, totalRuntime));
Queue.push(() => updateKeyframes(primaryStructure.callbacks, totalRuntime));

//...

const secondaryStructure = {
	secondaryElements: [
		[ela, elb, elc, eld, elg, elh],
		[ela, elb, elc, eld, ele, elf, elg, elh],
	],
	cssStyleReset: [[], []],
	main_calculations: [[], []],
	secondary_calculations: [[], []],
	overrides: [[], []],
};
Queue.push(() =>
	getSecondaryElements(
		primaryStructure.target,
		secondaryStructure.secondaryElements
	)
);

//either a runable queue and we wait until that is done
await Queue.run();
nextStep();
//or we push the next step into the queue as well
Queue.push(nextStep);

//Queue2 could be the RAF Queue
const Queue2: VoidFunction[] = [];

/*
easiest: have a lot of doubled calculations and hope they get cached
! this could scale up fast of closely related elements especially
? maybe an element cache would help here => new WeakMap<HTMLElement, Calculation[]>


* we could get all elemenets like new Set(secondaryElements.flat()), calculate them and then assign the calculation back to secondaryStructure

const calculationMap = new Weakmap()
calculate(new Set(secondaryElements.flat())).forEach(({element, calculation}) => {
	calculationMap.set(element, calculation)
})
secondaryElements.forEach((row, index) => {
	row.forEach(element => {
		secondary_calculations[index].push(calculationMap.get(element))
	})
})

or
const calculations = secondaryElements.map((row) => {
	row.map(element => calculationMap.get(element))
})

secondaryStructure.secondary_calculations = calculations


*/
