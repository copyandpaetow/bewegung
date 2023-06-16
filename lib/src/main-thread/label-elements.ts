import { NormalizedProps } from "../types";
import { uuid, getChilden } from "../utils/helper";

const addTextAttribute = (element: HTMLElement) => {
	let text = 0;
	element.childNodes.forEach((node) => {
		if (node.nodeType !== 3) {
			return;
		}
		text += node.textContent!.trim().length;
	});
	if (text === 0) {
		return;
	}

	element.dataset.bewegungsText = `${text}`;
};

const addMediaRatioAttribute = (element: HTMLElement) => {
	//@ts-expect-error
	if (!element.naturalWidth || !element.naturalHeight) {
		return;
	}
	element.dataset.bewegungsRatio = `${
		(element as HTMLImageElement).naturalWidth / (element as HTMLImageElement).naturalHeight
	}`;
};

const addSkipAttribute = (element: HTMLElement) => {
	if (element.getAnimations().some((animation) => animation.playState === "running")) {
		element.dataset.bewegungsSkip = "";
	}
};

const labelElements = (element: HTMLElement, rootKey: string) => {
	element.dataset.bewegungsKey ??= uuid(element.tagName);
	addTextAttribute(element);
	addMediaRatioAttribute(element);
	addSkipAttribute(element);

	getChilden(element).forEach((child) => {
		if (child.dataset.bewegungsRoot) {
			child.dataset.parentRoot = rootKey;
			return;
		}
		labelElements(child, rootKey);
	});
};

export const labelRootElements = (normalizedProps: NormalizedProps[]) =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			normalizedProps
				.map((entry) => {
					entry.root.dataset.bewegungsKey ??= uuid(entry.root.tagName);
					entry.root.dataset.bewegungsRoot ??= entry.root.dataset.bewegungsKey;
					return entry.root;
				})
				.forEach((root) => {
					labelElements(root, root.dataset.bewegungsRoot!);
				});
			resolve();
		});
	});
