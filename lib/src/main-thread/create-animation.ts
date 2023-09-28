import { AtomicWorker, NormalizedOptions, ResultTransferable } from "../types";
import { Attributes, emptyImageSrc } from "../utils/constants";
import { applyCSSStyles, nextRaf } from "../utils/helper";
import { extractAnimationOptions } from "./normalize-props";
import { addKeyToNewlyAddedElement, getNextElementSibling } from "./observe-dom";
import { iterateAddedElements, iterateRemovedElements, observe } from "./observer-helper";

const createWrapperElement = (style: Partial<CSSStyleDeclaration>) => {
	const wrapperElement = document.createElement("div");
	applyCSSStyles(wrapperElement, style);
	wrapperElement.dataset.bewegungsRemovable = "";

	return wrapperElement;
};

const createImageWrapper = (element: HTMLElement, overrides: Partial<CSSStyleDeclaration>) => {
	const wrapperElement = createWrapperElement(overrides);
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;

	wrapperElement.appendChild(element);

	if (nextSibling) {
		parentElement.insertBefore(wrapperElement, nextSibling);
		return wrapperElement;
	}
	parentElement.appendChild(wrapperElement);

	return wrapperElement;
};

const createImagePlaceholder = (element: HTMLElement) => {
	const parentElement = element.parentElement!;
	const nextSibling = element.nextElementSibling;
	const key = element.dataset.bewegungsKey!;

	const placeholderElement = document.createElement("img");
	element.getAttributeNames().forEach((attribute) => {
		placeholderElement.setAttribute(attribute, element.getAttribute(attribute)!);
	});
	placeholderElement.src = emptyImageSrc;
	placeholderElement.dataset.bewegungsReplace = key;
	placeholderElement.dataset.bewegungsRemovable = "";

	nextSibling
		? parentElement.insertBefore(placeholderElement, nextSibling)
		: parentElement.appendChild(placeholderElement);
};

const readdRemovedNodes = (element: HTMLElement, entry: MutationRecord) => {
	element.dataset.bewegungsRemovable = "";
	entry.target.insertBefore(element, getNextElementSibling(entry.nextSibling));
};

const setAnimations = (
	results: ResultTransferable,
	animations: Map<string, Animation>,
	options: KeyframeEffectOptions
) => {
	results.forEach(([keyframes, overrides], key) => {
		const element = document.querySelector(`[${Attributes.key}=${key}]`) as HTMLElement;
		if (!element) {
			return;
		}

		animations.set(key, new Animation(new KeyframeEffect(element, keyframes, options)));

		if (overrides) {
			element.dataset.bewegungsCssReset = element.style.cssText ?? " ";
			applyCSSStyles(element, overrides);
		}

		if (results.has(`${key}-wrapper`)) {
			const [wrapperKeyframes, wrapperOverrides] = results.get(`${key}-wrapper`)!;
			const wrapperElement = createImageWrapper(element, wrapperOverrides!);
			createImagePlaceholder(element);
			animations.set(
				`${key}-wrapper`,
				new Animation(new KeyframeEffect(wrapperElement, wrapperKeyframes, options))
			);
		}
	});
};

const alignAnimations = (animation: Animation, timekeeper: Animation) => {
	animation.currentTime = timekeeper.currentTime;

	switch (timekeeper.playState) {
		case "running":
			animation.play();
			break;
		case "paused":
			animation.pause();
			break;
		case "finished":
			animation.finish();
			break;

		default:
			break;
	}
};

export const animationCreator = (options: NormalizedOptions, worker: AtomicWorker) => {
	const animations = new Map([["timekeeper", options.timekeeper]]);
	const resultWorker = worker(`animationData-${options.key}`);
	const delayedWorker = worker(`delayedAnimationData-${options.key}`);
	const animationOptions = extractAnimationOptions(options);

	const receiveAnimation = new Promise<void>((resolve) => {
		resultWorker.onMessage(async (results) => {
			const observerCallback: MutationCallback = (entries, observer) => {
				observer.disconnect();

				iterateRemovedElements(entries, readdRemovedNodes);
				iterateAddedElements(entries, addKeyToNewlyAddedElement);

				setAnimations(results, animations, animationOptions);

				worker(`startDelayed-${options.key}`).reply(`receiveDelayed-${options.key}`);
				resolve();
			};

			await nextRaf();
			observe(new MutationObserver(observerCallback));
			options.from?.();
			options.to?.();
		});
	});
	delayedWorker.onMessage((results) => {
		const newAnimations = new Map<string, Animation>();

		setAnimations(results, animations, animationOptions);

		newAnimations.forEach((anim, key) => {
			alignAnimations(anim, options.timekeeper);
			animations.set(key, anim);
		});
	});

	return {
		async current() {
			await receiveAnimation;
			return animations;
		},
	};
};
