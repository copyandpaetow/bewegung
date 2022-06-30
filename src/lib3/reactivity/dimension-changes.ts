import { state_elementProperties } from "../calculate/state";
import { Elements } from "../elements/getters";
import { topLevelElement } from "./state";

let state_intersectionObserver = new WeakMap<
	HTMLElement,
	IntersectionObserver
>();

// get all elements
// get initial dimensions
// set the rootMargin to that
//set the intersectionObserver for all elements
const buffer = 5;
let resizeIdleCallback;

const IOcallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => {
		callback();
	}, 100);
};

export const ObserveDimensionChange = (callback: () => void) => {
	const { all } = Elements;
	const { offsetWidth, offsetHeight } = topLevelElement;

	all.forEach((element) => {
		state_intersectionObserver.get(element)?.disconnect();
		const { dimensions } = state_elementProperties.get(element)![0];

		const rootMargins = [
			dimensions.top - buffer,
			offsetWidth - (dimensions.left + buffer + dimensions.width),
			offsetHeight - (dimensions.top + buffer + dimensions.height),
			dimensions.left - buffer,
		];

		const rootMargin = rootMargins
			.map((px) => `${-1 * Math.floor(px)}px`)
			.join(" ");

		let firstTime = true;
		const observer = new IntersectionObserver(
			() => {
				if (firstTime) {
					firstTime = false;
					return;
				}
				IOcallback(callback);
			},
			{
				root: topLevelElement,
				threshold: 1,
				rootMargin,
			}
		);

		observer.observe(element);
		state_intersectionObserver.set(element, observer);
	});

	return {
		disconnect: () => {
			all.forEach((element) => {
				state_intersectionObserver.get(element)?.disconnect();
			});
			state_intersectionObserver = new WeakMap<
				HTMLElement,
				IntersectionObserver
			>();
		},
	};
};
