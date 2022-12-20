import { applyCSSStyles } from "./apply-styles";
import { DefaultKeyframes, ElementEntry, State } from "../types";

export const createDefaultAnimation = (
	defaultKeyframes: Map<string, DefaultKeyframes>,
	state: State,
	totalRuntime: number,
	stringifiedElementLookup: Map<string, ElementEntry>
) => {
	const animations: Animation[] = [];
	const onStart: VoidFunction[] = [];
	const { elementLookup } = state;

	defaultKeyframes.forEach((defaultEntry, elementString) => {
		const { keyframes, overrides } = defaultEntry;
		const domElement = elementLookup.get(elementString)!;
		const isRoot = stringifiedElementLookup.get(elementString)?.root === elementString;

		if (isRoot && (overrides.before.position === "static" || !overrides.before.position)) {
			overrides.before.position = "relative";
			overrides.after.position = overrides.after.position ?? "";
		}

		const animation = new Animation(new KeyframeEffect(domElement, keyframes, totalRuntime));

		onStart.push(() => applyCSSStyles(domElement, overrides.before));
		animation.onfinish = () => applyCSSStyles(domElement, overrides.after);

		animations.push(animation);
	});

	return { animations, onStart };
};
