import { state_mainElements } from "./state";
import { state_affectedElements } from "./state";

enum ElementOptions {
	main = "main",
	all = "all",
	affected = "affected",
}

export const Elements: Record<ElementOptions, HTMLElement[]> = {
	main: [],
	all: [],
	affected: [],
};

export const setMainElements = () => {
	Elements.main = state_mainElements
		.flatMap((entry) => Array.from(entry))
		.filter(Boolean);
	setAffectedElements();
};

export const setAffectedElements = () => {
	Elements.affected = Array.from(state_affectedElements);
	setAllElements();
};

const setAllElements = () =>
	(Elements.all = Elements.main.concat(Elements.affected));
