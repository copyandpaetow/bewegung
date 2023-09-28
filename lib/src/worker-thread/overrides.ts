import { Position, Result, TreeElement } from "../types";

export const setParentToRelative = (
	parentReadout: TreeElement | undefined,
	results: Map<string, Result>
) => {
	if (!parentReadout || !results.has(parentReadout.key)) {
		return;
	}
	const parentResult = results.get(parentReadout.key)!;
	const override: Partial<CSSStyleDeclaration> = (parentResult[1] ??= {});

	if (parentReadout?.position !== Position.static || override.position) {
		return;
	}
	override.position = "relative";
};

export const setOverrides = (
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
