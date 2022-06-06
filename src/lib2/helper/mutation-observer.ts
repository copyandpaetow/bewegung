import {
	getElements,
	state_affectedElements,
	state_mainElements,
} from "../state/elements";
import { STOP_TRAVERSING_CLASS } from "./dom-find-affected-elements";

const topLevelElement =
	document.querySelector(`.${STOP_TRAVERSING_CLASS}`) ?? document.body;

const observerOptions = {
	childList: true,
	attributes: true,
	subtree: true,
};

const callback =
	({ full, stylesOnly }: mutatinObserverCallback) =>
	(mutationList: MutationRecord[], observer: MutationObserver) => {
		observer.disconnect();
		mutationList.forEach((mutation) => {
			console.log({ mutation });
			switch (mutation.type) {
				case "childList":
					const changedElements = [
						...mutation.removedNodes,
						...mutation.addedNodes,
					];

					if (
						Array.from(state_mainElements).filter((element) =>
							changedElements.includes(element)
						).length
					) {
						changedElements.forEach((newElement) => {
							if (!(newElement instanceof HTMLElement)) {
								return;
							}
							state_mainElements.has(newElement)
								? state_mainElements.delete(newElement)
								: state_mainElements.add(newElement);
						});
						full();
					}

					if (
						Array.from(state_affectedElements).filter((element) =>
							changedElements.includes(element)
						).length
					) {
						stylesOnly();
					}

					break;
				case "attributes":
					if (getElements().includes(mutation.target as HTMLElement)) {
						stylesOnly();
					}
					break;
				case "characterData":
					if (getElements().includes(mutation.target.parentElement)) {
						stylesOnly();
					}
					break;
			}
		});
		observer.observe(topLevelElement, observerOptions);
	};

type mutatinObserverCallback = {
	full: Function;
	stylesOnly: Function;
};

export const init_mutationObserver = (callbacks: mutatinObserverCallback) => {
	const observer = new MutationObserver(callback(callbacks));
	observer.observe(topLevelElement, observerOptions);
	return observer;
};
