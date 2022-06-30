import { traverseDomDown } from "../elements/find-affected";
import { Chunks } from "../types";
import { topLevelElement } from "./state";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ||= window.requestAnimationFrame;
}

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
