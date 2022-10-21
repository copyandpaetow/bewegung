/*
case postprocess => remove sec from secondaryElements + recalculate readouts
case mo1 => remove (see above) / add to secondaryElements, get mainElements which would affect the new element, get their options + rootElement and add this combined
for the secondary element
case mo2/3: delete main element => remove from mainELements, recalc runtime, if it is different update keyframes and callbacks, start from secondaryElement calculation
case mo4: add main element => create a selector ElementMap. Get the main elements for each matching selector and copy their values, get their secondary elements and add them,
recalculate
*/

/*
	TODO: moving the animations back to the class

	- it makes more sense to seperate the calculation of the animations and their handling
	- after the calculation is done, we can resolve a promise with the animations and callbacks as result
	- 2 list of animations (main, callbacks) would make sense here

*/

/*
	TODO: style guide
	- adopt folder strucutre to the main 3 function blocks (init, read, watch => they could be named differently)
	- adopt a naming scheme where the props and mappingFn entries somewhat resemble the useCase 
		- AnimationEntry => entry, 
		- mainElements => element (or mainElement when secondaryElements are used as well)
		- readouts => readout / readoutEntry
	
	- try to avoid changing of an object property directly, better update its content
	e.g. const test = {numbers: [1,2,3,4]}	
		- better to do test.numbers.forEach((num, index) => numbers[index] = update(num))
		- instead of test.numbers = test.numbers.map(update)

		or at least research if the later is less performant
*/
