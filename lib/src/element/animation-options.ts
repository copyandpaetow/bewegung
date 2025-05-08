import { ValueOf } from "./readout";

export const defaultAnimationOptions: KeyframeEffectOptions = {
	duration: 400,
};

const ANIMATION_TYPE = {
	STRING: 1,
	NUMBER: 2,
} as const;

type OptionRule = {
	name: keyof KeyframeEffectOptions;
	type: ValueOf<typeof ANIMATION_TYPE>;
};

const OPTION_ARRAY: Array<OptionRule> = [
	{ name: "duration", type: ANIMATION_TYPE.NUMBER },
	{ name: "delay", type: ANIMATION_TYPE.NUMBER },
	{ name: "easing", type: ANIMATION_TYPE.STRING },
];

export const getOptionsFromElement = (
	element: HTMLElement,
	defaultOptions: KeyframeEffectOptions,
	prefix = "data-bewegung-"
) => {
	return OPTION_ARRAY.reduce(
		(options, rule) => {
			const entry = element.getAttribute(prefix + rule.name);

			if (entry) {
				const parsed =
					rule.type === ANIMATION_TYPE.NUMBER ? parseInt(entry) : entry;
				(options[rule.name] as ValueOf<KeyframeEffectOptions>) = parsed;
			}

			return options;
		},
		{ ...defaultOptions }
	);
};
