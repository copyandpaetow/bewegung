import { updateReadout } from "../element/readout";
import { Context } from "../web-component";
import { nextRAF } from "./helper";
import { createNode, fake, TreeNode } from "./node";
import { isVisible } from "./is-visible";

export type NodeChanges = {
	removedNodes: Map<HTMLElement, TreeNode>;
	addedNodes: Map<HTMLElement, TreeNode>;
};

export const createNodeLoop = async (
	root: HTMLElement,
	context: Context,
	timeChunkSize = 10
) => {
	const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
		acceptNode(node) {
			const parent = node.parentElement!;
			if (parent !== root && parent.tagName === root.tagName) {
				return NodeFilter.FILTER_REJECT;
			}

			return isVisible(node as HTMLElement)
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_SKIP;
		},
	});

	const nodeChanges = {
		addedNodes: new Map<HTMLElement, TreeNode>(),
		removedNodes: new Map(context.treeNodes),
	};
	context.treeNodes.clear();
	context.head = createNode(
		treeWalker.currentNode as HTMLElement,
		fake,
		context,
		nodeChanges
	);

	context.head.parent = context.head;

	const parentStack = [context.head];
	let previousNode = context.head;
	let time = performance.now();

	while (treeWalker.nextNode()) {
		const currentElement = treeWalker.currentNode as HTMLElement;

		while (!parentStack.at(-1)?.element?.contains(currentElement)) {
			const lastStack = parentStack.pop();
			if (lastStack) {
				lastStack.subloopEnd = previousNode;
			} else {
				break;
			}
		}

		if (previousNode.element.contains(currentElement)) {
			parentStack.push(previousNode as TreeNode);
		}

		const parentNode = parentStack.at(-1)!;
		const treeNode = createNode(
			currentElement,
			parentNode,
			context,
			nodeChanges
		);

		previousNode.next = treeNode;
		previousNode = treeNode;
		if (performance.now() - time > timeChunkSize) {
			time = await nextRAF();
		}
	}

	previousNode.next = context.head;

	while (parentStack.length) {
		parentStack.pop()!.subloopEnd = previousNode!;
	}

	let previous: TreeNode | null = null;
	nodeChanges.removedNodes.forEach((node, key, map) => {
		node.readout = node.pendingReadout ?? node.readout;
		node.pendingReadout = null;
		node.hasChanged = true;

		if (map.has(node.parent.element)) {
			map.delete(key);
		} else {
			if (previous?.element.contains?.(node.element)) {
				map.delete(previous.element);
			}
			previous = node;
		}
	});

	return nodeChanges;
};

export const updateLoop = async (rootNode: TreeNode, timeChunkSize = 10) => {
	let currentNode = rootNode;
	let time = performance.now();

	while (currentNode !== rootNode.subloopEnd) {
		currentNode.pendingReadout ??= updateReadout(currentNode);
		currentNode = currentNode.next;

		if (performance.now() - time > timeChunkSize) {
			time = await nextRAF();
		}
	}
	rootNode.subloopEnd.pendingReadout ??= updateReadout(rootNode.subloopEnd);
};
