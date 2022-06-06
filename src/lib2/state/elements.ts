import { findAffectedDOMElements } from "../helper/dom-find-affected-elements";
import { execute } from "../helper/iterables";

export let state_mainElements = new Set<HTMLElement>();
export let state_affectedElements = new Set<HTMLElement>();
export let state_originalStyle = new WeakMap<HTMLElement, string>();
export let state_affectedByMainElements = new WeakMap<
	HTMLElement,
	Set<HTMLElement>
>();

const cleanup_elements = () => {
	state_affectedElements = new Set<HTMLElement>();
	state_originalStyle = new WeakMap<HTMLElement, string>();
	state_affectedByMainElements = new WeakMap<HTMLElement, Set<HTMLElement>>();
};

const mutation_updateDOMStates = () => {
	cleanup_elements();
	state_mainElements.forEach((mainElement) => {
		state_originalStyle.set(mainElement, mainElement.style.cssText);
		findAffectedDOMElements(mainElement).forEach((affectedElement) => {
			if (Array.from(state_mainElements).includes(affectedElement)) {
				return;
			}
			state_affectedElements.add(affectedElement);
			state_originalStyle.set(affectedElement, affectedElement.style.cssText);
			state_affectedByMainElements.set(
				affectedElement,
				new Set([
					...(state_affectedByMainElements.get(affectedElement) || new Set()),
					mainElement,
				])
			);
		});
	});
};

const flow = execute(mutation_updateDOMStates);

export const action_updateElements = () => {
	flow();
};

export const getElements = () => [
	...state_mainElements,
	...state_affectedElements,
];
