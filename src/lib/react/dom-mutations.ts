import { traverseDomDown } from "../prepare/find-affected";
import { Chunks } from "../types";

if (typeof window !== "undefined") {
	// @ts-expect-error polyfill for requestIdleCallback
	window.requestIdleCallback ||= window.requestAnimationFrame;
}

const areTheseRelated = (a: HTMLElement, b: HTMLElement) => {
	return (
		a.contains(b) ||
		b.contains(a) ||
		(a.parentElement ?? document.body).contains(b)
	);
};

let idleCallback: number | undefined;

const MOcallback =
	(
		Input: (update?: Chunks[]) => Chunks[],
		callback: (changes: Chunks[]) => void
	) =>
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
	callback: (changes: Chunks[]) => void
) => {
	const MO = new MutationObserver(MOcallback(Input, callback));
	MO.observe(document.body, {
		childList: true,
		subtree: true,
	});
	return MO;
};
