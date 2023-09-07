import { Reactivity } from "../types";
import { Attributes } from "../utils/constants";
import { querySelectorAll } from "../utils/helper";
import { isHTMLElement } from "../utils/predicates";
import { observe } from "./observer-helper";

const isChildOfAnimationElement = (element: HTMLElement) =>
	Boolean(element.parentElement?.dataset.bewegungsKey);
const isAnimationElement = (element: HTMLElement) => Boolean(element.dataset.bewegungsKey);

const watchForDomMutations = (callback: VoidFunction) => {
	const observer = new MutationObserver((mutations: MutationRecord[]) => {
		const wasDomChanged = mutations
			.flatMap((entry) => [...entry.addedNodes, ...entry.removedNodes])
			.filter(isHTMLElement)
			//@ts-expect-error ts doesnt know
			.some((element) => isAnimationElement(element) || isChildOfAnimationElement(element));

		if (!wasDomChanged) {
			return;
		}

		callback();
	});
	observe(observer);

	return observer;
};

const watchForResizes = (animationElements: HTMLElement[], callback: VoidFunction) => {
	const resizeObservers = new WeakMap<HTMLElement, ResizeObserver>();

	animationElements.forEach((element) => {
		resizeObservers.get(element)?.disconnect();
		let isInitialCallback = true;
		const observer = new ResizeObserver(() => {
			if (isInitialCallback) {
				isInitialCallback = false;
				return;
			}
			callback();
		});
		observer.observe(element);
		resizeObservers.set(element, observer);
	});

	return {
		disconnect() {
			animationElements.forEach((element) => {
				resizeObservers.get(element)?.disconnect();
			});
		},
	};
};

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

const watchForPositionChanges = (animationElements: HTMLElement[], callback: VoidFunction) => {
	const intersectionObservers = new WeakMap<HTMLElement, IntersectionObserver>();

	animationElements.forEach((element) => {
		intersectionObservers.get(element)?.disconnect();
		const rootElement = element.closest(`[${Attributes.root}]`) ?? document.body;

		let isInitialCallback = true;
		const observer = new IntersectionObserver(
			() => {
				if (isInitialCallback) {
					isInitialCallback = false;
					return;
				}
				callback();
			},
			{
				root: rootElement,
				threshold: [0.2, 0.4, 0.6, 0.8, 1],
				rootMargin: calculateRootMargin(rootElement as HTMLElement, element),
			}
		);

		observer.observe(element);
		intersectionObservers.set(element, observer);
	});
	return {
		disconnect() {
			animationElements.forEach((element) => {
				intersectionObservers.get(element)?.disconnect();
			});
		},
	};
};

export const getReactivity = (): Reactivity => {
	let mutationObserver: MutationObserver;
	let resizeObserver: {
		disconnect(): void;
	};
	let positionObserver: {
		disconnect(): void;
	};
	let resizeIdleCallback: NodeJS.Timeout | undefined;

	const throttledCallback = (callback: VoidFunction) => {
		resizeIdleCallback && clearTimeout(resizeIdleCallback);
		resizeIdleCallback = setTimeout(() => {
			callback();
		}, 200);
	};

	return {
		observe(callback: VoidFunction) {
			const animationElements = querySelectorAll(`[${Attributes.rootEasing}]`).flatMap(
				(rootElement) =>
					[rootElement]
						.concat(querySelectorAll("*", rootElement))
						.filter((element) => element.dataset.bewegungsSkip === undefined)
			);
			const withThrottle = () => throttledCallback(callback);

			mutationObserver = watchForDomMutations(withThrottle);
			resizeObserver = watchForResizes(animationElements, withThrottle);
			positionObserver = watchForPositionChanges(animationElements, withThrottle);
		},
		disconnect() {
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			positionObserver.disconnect();
		},
	};
};
