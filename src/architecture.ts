/*
TODOS:
- improve the queue to use MessageChannel and make it truly global
- figure out how to wait for the data in there. Maybe callbacks or subscribers?
- how to include RAF in there for DOM work?

- record dimensions of all elements at timing 0 and then only filter the elements if they have the current timing 

- use a nested array stucture and keep the relationship for data by their index
- for computed data, a nested map might be better where we could check if calculations for a certain offset are already present and skip if they exists
or we could get all elemenets like new Set(secondaryElements.flat()), calculate them and then assign the calculation back to secondaryStructure


react scheduling system seams to know what kind of work needs to be done instead of filling a queue
maybe there could be a state machine like indicator to work on the part of the code we want like 

? could we calculate the animations for the first step and start animating, while calculating the rest? 
? => For this to work, we need to update the keyframes seamlessly without interrupting the running animation


*/

/*
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



const calculationMap = new Weakmap()
calculate(new Set(secondaryElements.flat())).forEach(({element, calculation}) => {
	calculationMap.set(element, calculation)
})

const calculations = secondaryElements.map((row) => {
	row.map(element => calculationMap.get(element))
})

secondaryStructure.secondary_calculations = calculations



*/
