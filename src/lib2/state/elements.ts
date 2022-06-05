import { findAffectedDOMElements } from "../helper/dom-find-affected-elements";
import { mutate_options } from "./options";

export let state_mainElements = new Set<HTMLElement>();
let state_affectedElements = new Set<HTMLElement>();
export let state_originalStyle = new WeakMap<HTMLElement, string>();
export let state_affectedByMainElements = new WeakMap<
	HTMLElement,
	Set<HTMLElement>
>();

export const mutate_mainElements = (...elements: HTMLElement[]) => {
	const listeners = [
		() => updateDOMStates(Array.from(state_mainElements)),
		mutate_options,
	];

	elements.forEach((element) => {
		state_mainElements.has(element)
			? state_mainElements.delete(element)
			: state_mainElements.add(element);
	});

	listeners.forEach((callback) => callback());
};

const updateDOMStates = (elements: HTMLElement[]) => {
	//TODO: if these states get recalculated, they need to be reset before
	elements.forEach((mainElement) => {
		state_originalStyle.set(mainElement, mainElement.style.cssText);
		findAffectedDOMElements(mainElement).forEach((affectedElement) => {
			if (elements.includes(affectedElement)) {
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

export const getElements = () => [
	...state_mainElements,
	...state_affectedElements,
];

export const cleanup_elements = () => {
	state_mainElements = new Set<HTMLElement>();
	state_affectedElements = new Set<HTMLElement>();
	state_originalStyle = new WeakMap<HTMLElement, string>();
	state_affectedByMainElements = new WeakMap<HTMLElement, Set<HTMLElement>>();
};
