import { Elements } from "../elements/getters";
import { state_keyframes } from "../elements/state";
import { state_animations, state_callbackAnimations } from "./state";

export const applyStyles = (mainElements: HTMLElement[]) => {
	mainElements.forEach((element) => {
		const keyframes = state_keyframes.get(element);

		const resultingStyle = keyframes?.reduce(
			(
				accumulator,
				{ offset, composite, computedOffset, easing, ...styles }
			) => {
				return { ...accumulator, ...styles };
			},
			{}
		);
		Object.assign(element.style, resultingStyle);
	});
};

const Animations: Record<string, Animation[]> = {
	all: [],
};

export const updateAnimations = () => {
	const { main, affected } = Elements;
	const mainAnimation = main.flatMap((element) => [
		state_animations.get(element)!,
		...(state_callbackAnimations.get(element) || []),
	]);
	const affecedElementAnimtion = affected.map(
		(element) => state_animations.get(element)!
	);
	Animations.all = mainAnimation.concat(affecedElementAnimtion);
};

export const playAnimation = () => {
	const { main } = Elements;
	applyStyles(main);
	Animations.all.forEach((waapi) => waapi.play());
};

export const pauseAnimation = () => {
	Animations.all.forEach((waapi) => waapi.pause());
};
