import { Position, TreeElement } from "../types";

export const setParentToRelative = (
	parentReadout: TreeElement | undefined,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	if (!parentReadout) {
		return;
	}
	const parentOverride = overrideStore.get(parentReadout.key) ?? {};

	if (parentReadout?.position !== Position.static || parentOverride.position) {
		return;
	}
	parentOverride.position = "relative";
	overrideStore.set(parentReadout.key, parentOverride);
};

export const setOverrides = (
	lastReadout: TreeElement,
	lastParentReadout: TreeElement | undefined,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>
) => {
	const currentOverride = overrideStore.get(lastReadout.key) ?? {};

	currentOverride.position = "absolute";
	currentOverride.display = "unset";
	currentOverride.left = lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px";
	currentOverride.top = lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px";
	currentOverride.width = lastReadout.currentWidth + "px";
	currentOverride.height = lastReadout.currentHeight + "px";

	overrideStore.set(lastReadout.key, currentOverride);
	setParentToRelative(lastParentReadout, overrideStore);
};
