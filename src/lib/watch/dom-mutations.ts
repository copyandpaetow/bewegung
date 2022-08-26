import { traverseDomDown } from "../prepare-input/find-affected-elements";
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

const MOcallback =
	(chunks: Chunks[], callback: (changes: Chunks[]) => void) =>
	(mutationList: MutationRecord[]) => {
		const changedElements = new Set(
			mutationList
				.flatMap((mutation) => [
					...mutation.addedNodes,
					...mutation.removedNodes,
				])
				.filter((node) => node instanceof HTMLElement)
				.flatMap((element) =>
					traverseDomDown(element as HTMLElement).concat(element as HTMLElement)
				)
		);

		if (changedElements.size === 0) {
			return;
		}

		const currentChunks = [...chunks];

		let recalculationFlag = false;
		currentChunks.forEach((chunk) => {
			changedElements.forEach((element) => {
				if (chunk.target.has(element)) {
					chunk.target.delete(element);
					recalculationFlag = true;
					return;
				}

				if (chunk.selector && element.matches(chunk.selector)) {
					chunk.target.add(element);
					recalculationFlag = true;
					return;
				}
				chunk.target.forEach((mainElement) => {
					if (areTheseRelated(mainElement, element)) {
						recalculationFlag = true;
					}
				});
			});
		});

		if (!recalculationFlag) {
			return;
		}

		callback(currentChunks);
	};

export const ObserveDomMutations = (
	chunks: Chunks[],
	callback: (changes: Chunks[]) => void
) => {
	const MO = new MutationObserver(MOcallback(chunks, callback));
	MO.observe(document.body, {
		childList: true,
		subtree: true,
	});
	return MO;
};
