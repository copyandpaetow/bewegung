const sleep = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

const changes = ["100%", "20%", "50vw"];

const changeSomething: VoidFunction = () => {
	const card = document.querySelector(".card.main") as HTMLElement;
	card.style.width = changes.pop()!;
	if (!changes.length) {
		card.addEventListener("click", () => console.log("hello"));
		card.remove();
	}
};

const updateElement = (element: HTMLElement, saveMap: Map<HTMLElement, DOMRect[]>) => {
	const dimensions = element.getBoundingClientRect();
	const previous = saveMap.get(element) ?? [];

	saveMap.set(element, previous.concat(dimensions));
};

type DomPosition = {
	parent: HTMLElement;
	previousSibling: HTMLElement | null;
	nextSibiling: HTMLElement | null;
};

const saveDomPosition = (element: HTMLElement, saveMap: Map<HTMLElement, DomPosition>) => {
	const domPosition: DomPosition = {
		parent: element.parentElement!,
		previousSibling: (element.previousElementSibling as HTMLElement) ?? null,
		nextSibiling: (element.nextElementSibling as HTMLElement) ?? null,
	};
	saveMap.set(element, domPosition);
};

const saveOriginalStyle = (
	element: HTMLElement,
	saveMap: Map<HTMLElement, Map<string, string>>
) => {
	const attributes = new Map<string, string>();

	element.getAttributeNames().forEach((attribute) => {
		attributes.set(attribute, element.getAttribute(attribute)!);
	});
	if (!attributes.has("style")) {
		attributes.set("style", element.style.cssText);
	}

	saveMap.set(element, attributes);
};

const setObserver = (observer: MutationObserver, rootElement: HTMLElement) => {
	observer.observe(rootElement, {
		childList: true,
		subtree: true,
		attributes: true,
	});
};

const compareDomRects = (dimensionMap: Map<HTMLElement, DOMRect[]>) => {
	dimensionMap.forEach((dimensions, element) => {
		const reference = dimensions.pop()!;
		if (
			dimensions.every(
				(dimension) =>
					dimension.width === reference.width &&
					dimension.height === reference.height &&
					dimension.top === reference.top &&
					dimension.left === reference.left
			)
		) {
			dimensionMap.delete(element);
		}
	});
	console.log(dimensionMap);
};

const resetStyle = (entry: MutationRecord, saveMap: Map<HTMLElement, Map<string, string>>) => {
	const target = entry.target as HTMLElement;
	const savedAttributes = saveMap.get(target)?.get(entry.attributeName!);
	if (entry.attributeName === "style") {
		target.style.cssText = savedAttributes!;
	}
};

const resetElements = (entry: MutationRecord, domPostions: Map<HTMLElement, DomPosition>) => {
	const [target] = entry.removedNodes;
	console.log(target);
	const domPostion = domPostions.get(target as HTMLElement)!;

	domPostion.parent.insertBefore(target, domPostion.nextSibiling);
};

export const testThis = async () => {
	const rootElement = document.querySelector("main") as HTMLElement;
	const children = Array.from(rootElement.querySelectorAll("*")).concat(
		rootElement
	) as HTMLElement[];
	const dimensions = new Map<HTMLElement, DOMRect[]>();
	const attributes = new Map<HTMLElement, Map<string, string>>();
	const domPostions = new Map<HTMLElement, DomPosition>();

	const observer = new MutationObserver((entries, observer) => {
		console.log(entries);
		observer.disconnect();
		children.forEach((element) => updateElement(element, dimensions));
		entries.forEach((entry) => {
			switch (entry.type) {
				case "attributes":
					resetStyle(entry, attributes);
					break;

				case "childList":
					resetElements(entry, domPostions);
					break;

				default:
					break;
			}
		});

		if (changes.length) {
			setObserver(observer, rootElement);
			requestAnimationFrame(changeSomething);
		} else {
			console.timeEnd("MO");
			compareDomRects(dimensions);
		}
	});
	setObserver(observer, rootElement);

	//console.time("attributes");
	children.forEach((element) => saveOriginalStyle(element, attributes));
	children.forEach((element) => updateElement(element, dimensions));
	children.forEach((element) => saveDomPosition(element, domPostions));
	//console.timeEnd("attributes");

	await sleep(3000);

	requestAnimationFrame(() => {
		console.time("MO");
		changeSomething();
	});

	//observer.disconnect();
};

/*
	bewegung(callback, options)
  bewegung([{callback, options}, {callback, options}, {callback, options}])
bewegung({callback: [cb1, cb2, cb3]. options: [op1, op2]})

	bewegung.play(callback, options).play(callback, options)

	maybe to different functions make sense
	- a simple one like element.animate(keyframes, options)
	- a complexer one like new Animation(element, keyframes, options)

	or in one as new Bewegung().play(callback,option)

	or as object?
	bewegung({domChange(){}, duration: 1000, })

*/
