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

export const saveMainElements = () => {
	Elements.main = Array.from(state_mainElements);
	Elements.affected = Array.from(state_affectedElements);
	Elements.all = Elements.main.concat(Elements.affected);
};
