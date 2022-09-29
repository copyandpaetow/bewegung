interface MainElement2 {
	id: ElementKey2;

	keyframes: {
		offset: number;
		height: string;
	}[];
	options: {};
}
type ElementKey2 = {
	domElement: HTMLElement;
};

const mainElements2: MainElement2[] = [MainElement1, MainElement2];

const makeState = () => ({
	ElementKeyTranslation: new WeakMap<ElementKey2, HTMLElement>(),
	secondaryElements: new WeakMap<ElementKey2, Set<ElementKey2>>(),
	DependendOnElements: new WeakMap<ElementKey2, Set<ElementKey2>>(),
	StyleResets: new WeakMap<ElementKey2, string | Map<string, string>>(),
	Calculations: new WeakMap<ElementKey2, Queue>(),
	Overrides: new WeakMap<ElementKey2, {}>(),
});

const State = makeState();
const Queue: VoidFunction[] = [];
const context = { timings: [0, 4, 1] };

Queue.push(() => {
	requestAnimationFrame(() => {
		mainElements2.forEach((mainElement) => {
			State.StyleResets.set(
				mainElement.id,
				saveStyle(mainElement.id.domElement)
			);
		});
	});
});

context.timings.forEach((timing) => {
	const relevantMainElements = mainElements2.filter((mainElement) =>
		mainElement.keyframes.some((frame) => frame.offset === timing)
	);

	if (relevantMainElements.length === 0) {
		return;
	}

	Queue.push(() => {
		requestAnimationFrame(() => {
			relevantMainElements.forEach((mainElement) => {
				applyCSS(mainElement.id.domElement, mainElement.keyframes[timings]);
			});
			relevantMainElements.forEach((mainElement) => {
				State.Calculations.get(mainElement.id).enqueue(
					mainElement,
					timing,
					read
				);

				State.secondaryElements.get(mainElement)?.forEach((affectedElement) => {
					State.Calculations.get(mainElement.id).enqueue(
						affectedElement,
						timing,
						read
					);
				});
			});
			//maybe restore so they are independet
		});
	});
});
