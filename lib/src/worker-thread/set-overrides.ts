import { TreeEntry } from "../types";

export const setOverrides = (
	key: string,
	parentKey: string | undefined,
	overrideStore: Map<string, Partial<CSSStyleDeclaration>>,
	dimensionStore: Map<string, TreeEntry[]>
) => {
	const readouts = dimensionStore.get(key)!;
	const lastReadout = readouts.at(-1)!;
	const lastParentReadout = parentKey ? dimensionStore.get(parentKey)?.at(1) : undefined;

	const currentOverride = overrideStore.get(key) ?? {};

	currentOverride.position = "absolute";
	currentOverride.display = "unset";
	currentOverride.left = lastReadout.currentLeft - (lastParentReadout?.currentLeft ?? 0) + "px";
	currentOverride.top = lastReadout.currentTop - (lastParentReadout?.currentTop ?? 0) + "px";
	currentOverride.width = lastReadout.currentWidth + "px";
	currentOverride.height = lastReadout.currentHeight + "px";

	overrideStore.set(key, currentOverride);

	if (!parentKey) {
		return;
	}
	const parentOverride = overrideStore.get(parentKey) ?? {};

	if (lastParentReadout?.position !== "static" || parentOverride.position) {
		return;
	}
	parentOverride.position = "relative";
};
