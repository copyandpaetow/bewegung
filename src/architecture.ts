/*
jobs to be done

the animations need an 1) element, 2) keyframes, and 3) options

1) all elements <= (traverse dom) = input elements 
2) totalRuntime + timings* + changes* <= input options
2) keyframes <= (calc tweens) = dom differences <= elements + timings + keyframes (incl all changes)
3

*maybe not needed


before the dom changes we need to know

- all affected elements (which need to be recorded)
- all timings and all changed properties
- which keyframes are applied at what time 



look out for: 
- minimize reading of DOM properties, it still causes layout recalcs
	- checkForTextNode
	- getBorderRadius
	- emptyCalculatedProperties






- does it makes sense to do the dom reading in small steps?
=> in a requestAnimationFrame apply one change timing, read the dom and restore the original again

Problem here would be the time. On a 60hz display, each step would take 16ms. 

requestIdleCallback queue (could even be its own small component)

Good info: within a RIC, a requestAnimationFrame can be ordered but it will execute at a different time


Reading the DOM:
For Each Timing, get which main elements need to change styles and which other elements are affected and put it on a runable Queue as tasks
Run the queue afterwards
=> we likely need a inital reading of the dom

MainElement is not based on the element. Several Keys could have the same dom element target



*/

// const key1 = {
// 	dependencies: ["id1", "id2"],
// 	tagName: "div",
// 	parent: {},
// 	root: {},
// };

interface MainElement {
	id: string;
	domElement: HTMLElement;
	secondaryElements: Set<HTMLElement>;
	keyframes: {
		offset: number;
		height: string;
	}[];
	options: {};
	styleReset?: {};
	calculations: Queue;
}

interface AffectedElement {
	domElement: HTMLElement;
	dependendOnElements: Set<string>;
	styleReset: string;
	calculations: Queue;
}

const makeAffectedElement = (element: HTMLElement) => {
	return {
		domElement: element,
		dependendOnElements: new Set<string>(),
		override: {},
		styleReset: element.style.cssText,
		calculations: Queue,
	};
};

const ElementState = (
	allAffectedElements: Map<HTMLElement, MainElement | AffectedElement>,
	mainElements: MainElement[]
) => {
	mainElements.forEach((element) => {
		allAffectedElements.set(element.domElement, element);
		element.secondaryElements.forEach((secondaryElement) => {
			if (!allAffectedElements.has(secondaryElement)) {
				allAffectedElements.set(
					secondaryElement,
					makeAffectedElement(secondaryElement)
				);
			}
			allAffectedElements
				.get(secondaryElement)!
				.dependendOnElements.add(element.id);
		});
	});

	return (mainElement: MainElement, timing: number, analyizer: Function) => {
		[mainElement.domElement, ...mainElement.secondaryElements].forEach(
			(element) => {
				const calculations = allAffectedElements.get(element)?.calculations;
				if (!calculations) {
					throw Error("why");
				}

				calculations.queue(timing, () => analyizer(element));
			}
		);
	};
};

const mainElements: MainElement[] = [MainElement1, MainElement2];
const allAffectedElements = new Map<
	HTMLElement,
	MainElement | AffectedElement
>();

const Queue: VoidFunction[] = [];
const store = ElementState(allAffectedElements, mainElements);
const context = { timings: [0, 4, 1] };

Queue.push(() => {
	requestAnimationFrame(() => {
		mainElements.forEach((mainElement) => {
			store(mainElement, 0, read);
		});
	});
});

context.timings.forEach((timing) => {
	const relevantMainElements = mainElements.filter((mainElement) =>
		mainElement.keyframes.some((frame) => frame.offset === timing)
	);

	if (relevantMainElements.length === 0) {
		return;
	}

	Queue.push(() => {
		requestAnimationFrame(() => {
			relevantMainElements.forEach((mainElement) => {
				applyCSS(mainElement.domElement, mainElement.keyframes[timings]);
			});
			relevantMainElements.forEach((mainElement) => {
				store(mainElement, timing, read);
			});
			//maybe restore so they are independet
		});
	});
});

Queue.push(() => {
	requestAnimationFrame(() => {
		mainElements.forEach((mainElement) => {
			restoreCSS(mainElement.domElement);
		});
	});
});

Queue.run();
await Queue.finished();

const makeKeyframes = (
	allAffectedElements: Map<HTMLElement, MainElement | AffectedElement>
) => {};
