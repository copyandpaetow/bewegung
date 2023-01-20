import { MainState } from "../types";

const calculateRootMargin = (rootElement: HTMLElement, mainElement: HTMLElement) => {
	const { clientWidth, clientHeight } = rootElement;
	const dimensions = mainElement.getBoundingClientRect();
	const buffer = 5;

	const rootMargins = [
		dimensions.top,
		clientWidth - dimensions.right,
		clientHeight - dimensions.bottom,
		dimensions.left,
	];

	return rootMargins.map((px) => `${-1 * Math.floor(px - buffer)}px`).join(" ");
};

export const observerDimensions = (state: MainState, callback: VoidFunction) => {
	const { translation, root } = state;
	const IO = new WeakMap<HTMLElement, IntersectionObserver>();

	translation.forEach((element) => {
		IO.get(element)?.disconnect();
		const rootElement = root.get(element)!;

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
		IO.set(element, observer);
	});
	return () =>
		state.translation.forEach((element) => {
			IO.get(element)?.disconnect();
		});
};
