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
- callbacks
- apply style guide



*/

/*
iterations

- the play/reverse-methods could get an iterations option 


callbacks

- we would need to recreate the AnimationEntries for the callbacks
- for every main element, we need to get the callbacks and add them in a Map<number, Set<Voidfunction>>
- we get the iteration count and duration from the options
- for every different iteration count we 

function round(value, decimals) {
	return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

const test = () => {
	let kfe = new KeyframeEffect(document.body, null, { duration: 200, iterations: 3 });
	let animation = new Animation(kfe);
	animation.play();
	animation.pause();
	setTimeout(() => {
		animation.play();
	}, 450);

	function checkTime() {
		const progress = round((animation.currentTime ?? 1) / 200, 2);

		if (progress === 0.6) {
			console.log("hello");
		}

		if (animation.playState === "finished") {
			return;
		}
		console.log(progress);

		requestAnimationFrame(checkTime);
	}
	checkTime();
};


*/
