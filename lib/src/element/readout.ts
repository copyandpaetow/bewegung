import { TreeNode } from "../tree-nodes/node";

export type ValueOf<T> = T[keyof T];

export type Readout = {
	borderWidth: [number, number];
	borderRadius: [number, number, number, number];
	dimensions: [number, number, number, number];
	display: CSSStyleDeclaration["display"];
	position: CSSStyleDeclaration["position"];
	transform: DOMMatrixReadOnly;
	transformOrigin: [number, number];
	cssText: string;
};

const px = (value: string) => (value ? parseFloat(value) : 0);

export const updateReadout = (node: TreeNode): Readout => {
	const rect = node.element.getBoundingClientRect();
	const style = window.getComputedStyle(node.element);

	return {
		borderWidth: [px(style.borderLeftWidth), px(style.borderTopWidth)],
		borderRadius: [
			px(style.borderTopLeftRadius),
			px(style.borderTopRightRadius),
			px(style.borderBottomRightRadius),
			px(style.borderBottomLeftRadius),
		],
		dimensions: [rect.left, rect.top, rect.width, rect.height],
		display: style.display || "block",
		position: style.position || "static",
		transform: new DOMMatrixReadOnly(style.transform),
		transformOrigin: style.transformOrigin.split(" ").map(px) as [
			number,
			number
		],
		cssText: node.element.style.cssText,
	};
};
