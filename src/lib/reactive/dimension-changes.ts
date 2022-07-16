import { state_elementProperties } from "../calculate/calculate";
import { rootElement } from "../constants";
import { state_mainElements, state_affectedElements } from "../prepare/prepare";

let state_intersectionObserver = new WeakMap<
	HTMLElement,
	IntersectionObserver
>();

const calculateRootMargin = (
	rootElement: HTMLElement,
	element: HTMLElement
) => {
	const { clientWidth, clientHeight } = rootElement;
	const { dimensions } = state_elementProperties.get(element)![0];
	const buffer = 5;

	const rootMargins = [
		dimensions.top,
		clientWidth - dimensions.right,
		clientHeight - dimensions.bottom,
		dimensions.left,
	];

	return rootMargins.map((px) => `${-1 * Math.floor(px - buffer)}px`).join(" ");
};

export const ObserveDimensionChange = (callback: () => void) => {
	const allElements = new Set([
		...state_mainElements,
		...state_affectedElements,
	]);

	allElements.forEach((element) => {
		state_intersectionObserver.get(element)?.disconnect();

		let firstTime = true;
		const observer = new IntersectionObserver(
			() => {
				if (firstTime) {
					firstTime = false;
					return;
				}
				callback();
			},
			{
				root: rootElement,
				threshold: [0.2, 0.4, 0.6, 0.8, 1],
				rootMargin: calculateRootMargin(rootElement, element),
			}
		);

		observer.observe(element);
		state_intersectionObserver.set(element, observer);
	});

	return {
		disconnect: () => {
			allElements.forEach((element) => {
				state_intersectionObserver.get(element)?.disconnect();
			});
			state_intersectionObserver = new WeakMap<
				HTMLElement,
				IntersectionObserver
			>();
		},
	};
};
