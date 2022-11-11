import { defaultChangeProperties } from "../constants";
import { initialDomState } from "../initial-states";
import { scheduleCallback } from "../scheduler";
import {
	AnimationState,
	CssRuleName,
	CustomKeyframe,
	DomState,
	State,
	StyleChangePossibilities,
} from "../types";
import {
	applyCSSStyles,
	filterMatchingStyleFromKeyframes,
	restoreOriginalStyle,
} from "./apply-styles";
import { getCalculations } from "./calculate-dom-properties";

const calculateChangeTimings = (domState: DomState, allKeyframes: CustomKeyframe[][]) => {
	const newTimings = new Set([0, 1]);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset }) => {
			newTimings.add(offset ?? 1);
		});
	});

	domState.timings = Array.from(newTimings).sort((a, b) => a - b);
};

const calculateChangeProperties = (domState: DomState, allKeyframes: CustomKeyframe[][]) => {
	const changeProperties = new Set(defaultChangeProperties);

	allKeyframes.forEach((keyframes) => {
		keyframes.forEach(({ offset, ...stylings }) => {
			Object.keys(stylings).forEach((style) => changeProperties.add(style as CssRuleName));
		});
	});
	domState.properties = Array.from(changeProperties);
};

const calculateAppliableKeyframes = (domState: DomState, state: State) => {
	const { mainElements, keyframes } = state;
	const { timings, keyframeMap } = domState;

	timings.forEach((timing) => {
		const resultingStyle = new Map<HTMLElement, StyleChangePossibilities>();
		mainElements.forEach((mainElement) => {
			resultingStyle.set(
				mainElement,
				filterMatchingStyleFromKeyframes(keyframes.get(mainElement)!.flat(), timing)
			);
		});
		keyframeMap.set(timing, resultingStyle);
	});
};

const readDom = (animationState: AnimationState, state: State, domState: DomState) => {
	const { mainElements, secondaryElements, cssStyleReset } = state;
	const { properties, keyframeMap } = domState;
	const { readouts, imageReadouts } = animationState;

	const allElements = [...mainElements, ...secondaryElements];

	keyframeMap.forEach((keyframes, timing) => {
		scheduleCallback(() => {
			keyframes.forEach((stylePossibility, mainElement) => {
				applyCSSStyles(mainElement, stylePossibility);
			});

			allElements.forEach((element) => {
				const calculation = getCalculations(element, timing, properties);
				const currentReadout = element.tagName === "IMG" ? imageReadouts : readouts;
				const existingCalculations = currentReadout.get(element)?.concat(calculation) ?? [
					calculation,
				];
				currentReadout.set(element as HTMLImageElement, existingCalculations);
			});

			mainElements.forEach((element) => restoreOriginalStyle(element, cssStyleReset.get(element)!));
		});
	});
};

export const setReadouts = (animationState: AnimationState, state: State) => {
	const { mainElements, keyframes } = state;
	const domState = initialDomState();

	const allKeyframes = Array.from(mainElements).flatMap((element) => keyframes.get(element)!);

	const tasks = [
		() => calculateChangeTimings(domState, allKeyframes),
		() => calculateChangeProperties(domState, allKeyframes),
		() => calculateAppliableKeyframes(domState, state),
		() => readDom(animationState, state, domState),
	];

	tasks.forEach(scheduleCallback);
};
