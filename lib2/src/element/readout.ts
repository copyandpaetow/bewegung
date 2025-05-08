import { TreeNode } from "../tree-nodes/node";

export type ValueOf<T> = T[keyof T];

export type Readout = {
	borderWidth: [number, number];
	borderRadius: [number, number, number, number];
	dimensions: [number, number, number, number];
	display: CSSStyleDeclaration["display"];
	visibility: ValueOf<typeof VISIBILITY>;
	position: CSSStyleDeclaration["position"];
	transform: DOMMatrixReadOnly;
	transformOrigin: [number, number];
	cssText: string;
};

export const getBorderRadius = (
	style: CSSStyleDeclaration
): Readout["borderRadius"] => {
	return [
		parseFloat(style.borderTopLeftRadius || "0"),
		parseFloat(style.borderTopRightRadius || "0"),
		parseFloat(style.borderBottomRightRadius || "0"),
		parseFloat(style.borderBottomLeftRadius || "0"),
	];
};

export const VISIBILITY = {
	TRANSPARENT: -1,
	HIDDEN: 0,
	VISIBLE: 1,
} as const;

export const updateReadout = (node: TreeNode): Readout => {
	const { left, top, width, height } = node.element.getBoundingClientRect();
	const style = window.getComputedStyle(node.element);

	return {
		borderWidth: [
			parseFloat(style.borderLeftWidth || "0"),
			parseFloat(style.borderTopWidth || "0"),
		],
		borderRadius: getBorderRadius(style),
		dimensions: [left, top, width, height],
		display: style.display || "block",
		visibility: VISIBILITY.VISIBLE, //TODO: maybe this can be deleted
		position: style.position || "static",
		transform: new DOMMatrixReadOnly(style.transform),
		transformOrigin: (style.transformOrigin || "0 0")
			.split(" ")
			.map(parseFloat) as [number, number],
		cssText: node.element.style.cssText,
	};
};
