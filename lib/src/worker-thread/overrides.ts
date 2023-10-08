import { Position, Result, TreeElement } from "../types";

export const getFromResults = (
	key: string | undefined,
	results: {
		immediate: Map<string, Result>;
		delayed: Map<string, Result>;
	}
) => (key ? results.immediate.get(key) ?? results.delayed.get(key) : undefined);

export const setParentToRelative = (
	parentReadout: TreeElement | undefined,
	parentResult: Result | undefined
) => {
	if (!parentReadout || !parentResult) {
		return;
	}
	const override: Partial<CSSStyleDeclaration> = (parentResult[1] ??= {});

	if (parentReadout?.position !== Position.static || override.position) {
		return;
	}
	override.position = "relative";
};

export const setHiddenElementOverrides = (
	lastReadout: TreeElement,
	lastParentReadout: TreeElement | undefined,
	result: Result
) => {
	const override = (result[1] ??= {});

	override.position = "absolute";
	override.display = "unset";
	override.left = lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px";
	override.top = lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px";
	override.width = lastReadout.currentWidth + "px";
	override.height = lastReadout.currentHeight + "px";
};

export const updateOverrideStore = (
	dimensions: [TreeElement, TreeElement],
	keyframes: [Keyframe[], Partial<CSSStyleDeclaration>] | [Keyframe[]],
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const overrides = keyframes[1];
	if (!overrides) {
		return;
	}

	const key = dimensions[0].key;
	const previousOverrides = overrideStore.get(key) ?? {};

	Object.keys(overrides).forEach((property) => {
		previousOverrides[property] = dimensions[1][property];
	});

	overrideStore.set(key, previousOverrides);
};
