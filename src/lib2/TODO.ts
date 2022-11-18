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
		* (setting the index is better for performance and for concistentcy => push could lead to bugs)
		- instead of test.numbers = test.numbers.map(update)

		or at least research if the later is less performant for the compiler

		? for readility could the callback return stuff so it would look more like a await syntax?

		const a = scheduleTask(calculateStuff)
		const b = scheduleTask(()=>rework(a))
*/

/*
- performance improvements via filtering
- apply style guide
*/
