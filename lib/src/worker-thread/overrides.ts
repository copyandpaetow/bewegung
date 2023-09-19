import { Position, TreeElement } from "../types";

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

	if (!lastParentReadout) {
		return;
	}
	const parentOverride = overrideStore.get(lastParentReadout.key) ?? {};

	if (lastParentReadout?.position !== Position.static || parentOverride.position) {
		return;
	}
	parentOverride.position = "relative";
	overrideStore.set(lastParentReadout.key, parentOverride);
};
