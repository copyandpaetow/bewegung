import {
	STOP_TRAVERSING_CLASS,
	traverseDomDown,
} from "../elements/find-affected";
import { Chunks } from "../types";

const topLevelElement = (document.querySelector(`.${STOP_TRAVERSING_CLASS}`)
	?.parentElement ?? document.body) as HTMLElement;

const observerOptions = {
	childList: true,
	subtree: true,
};

const areTheseRelated = (a: HTMLElement, b: HTMLElement) => {
	return (
		a.contains(b) ||
		b.contains(a) ||
		(a.parentElement ?? document.body).contains(b)
	);
};

let idleCallback;

const MOcallback =
	(Input: (update?: Chunks[]) => Chunks[], callback: (changes) => void) =>
	(mutationList: MutationRecord[]) => {
		const changedElements = new Set(
			mutationList
				.flatMap((mutation) => [
					...mutation.addedNodes,
					...mutation.removedNodes,
				])
				.filter((node) => node instanceof HTMLElement)
				.flatMap((element) => traverseDomDown(element as HTMLElement))
		);

		if (changedElements.size === 0) {
			return;
		}
		const currentChunks = Input();
		let flag = false;
		currentChunks.forEach((chunk) => {
			changedElements.forEach((element) => {
				if (chunk.target.has(element)) {
					chunk.target.delete(element);
					flag = true;
					return;
				}

				if (chunk.selector && element.matches(chunk.selector)) {
					chunk.target.add(element);
					flag = true;
					return;
				}
				chunk.target.forEach((mainElement) => {
					if (areTheseRelated(mainElement, element)) {
						flag = true;
					}
				});
			});
		});

		if (flag) {
			idleCallback && cancelIdleCallback(idleCallback);
			idleCallback = requestIdleCallback(() => callback(currentChunks));
		}
	};

export const ObserveDomMutations = (
	Input: (update?: Chunks[]) => Chunks[],
	callback: (changes) => void
) => {
	const MO = new MutationObserver(MOcallback(Input, callback));
	MO.observe(topLevelElement, observerOptions);
	return MO;
};

let resizeIdleCallback;

const ROcallback = (callback: () => void) => {
	resizeIdleCallback && clearTimeout(resizeIdleCallback);
	resizeIdleCallback = setTimeout(() => callback(), 100);
};

export const ObserveElementDimensionChanges = (callback: () => void) => {
	let firstTime = true;
	const RO = new ResizeObserver(() => {
		console.log({ firstTime });
		if (firstTime) {
			firstTime = false;
			return;
		}
		ROcallback(callback);
	});
	RO.observe(topLevelElement);
	return RO;
};
