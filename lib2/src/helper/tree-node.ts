import { Readout, updateReadout, VISIBILITY_OPTIONS } from "./element";

export type Context = {
  head: TreeNode | null;
  treeNodes: Map<HTMLElement, TreeNode>;
  animationOptions: KeyframeEffectOptions;
};

export const fake = {} as TreeNode;

export type TreeNode = {
  element: HTMLElement;
  parent: TreeNode;
  next: TreeNode;
  subloopEnd: TreeNode;
  readout: Readout | null;
  pendingReadout: Readout | null;
  hasChanged: boolean;
  animation: Animation;
};

export type NodeChanges = {
  removedNodes: Map<HTMLElement, TreeNode>;
  addedNodes: Map<HTMLElement, TreeNode>;
};

export const createNode = (
  element: HTMLElement,
  parent: TreeNode,
  context: Context,
  nodeChanges: NodeChanges
) => {
  const wasAvailable = nodeChanges.removedNodes.get(element);

  const node: TreeNode = wasAvailable ?? {
    element,
    readout: null,
    pendingReadout: null,
    parent,
    next: fake,
    subloopEnd: fake,
    animation: new Animation(
      new KeyframeEffect(element, null, context.animationOptions)
    ),
    hasChanged: false,
  };

  node.subloopEnd = node;
  node.parent = parent;
  node.hasChanged = false;
  node.readout = node.pendingReadout ?? node.readout;
  node.pendingReadout = null;

  if (!wasAvailable) {
    node.hasChanged = true;
    if (!nodeChanges.addedNodes.has(parent.element)) {
      nodeChanges.addedNodes.set(element, node);
    }
  } else {
    nodeChanges.removedNodes.delete(element);
  }
  context.treeNodes.set(element, node);

  return node;
};

export const isVisible = (element: HTMLElement) => {
  if (!element.checkVisibility(VISIBILITY_OPTIONS)) {
    return false;
  }

  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    return false;
  }

  if (
    element.offsetHeight === element.parentElement!.offsetHeight &&
    element.offsetWidth === element.parentElement!.offsetWidth
  ) {
    return false;
  }

  return true;
};

const nextRAF = () =>
  new Promise<number>((resolve) => requestAnimationFrame(resolve));

export const createNodeLoop = async (
  root: HTMLElement,
  context: Context,
  timeChunkSize = 5
) => {
  const nodeIterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return isVisible(node as HTMLElement)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  if (!nodeIterator.nextNode()) {
    throw Error("no visible element to record");
  }

  const nodeChanges = {
    addedNodes: new Map<HTMLElement, TreeNode>(),
    removedNodes: new Map(context.treeNodes),
  };
  context.treeNodes.clear();
  context.head = createNode(
    nodeIterator.referenceNode as HTMLElement,
    fake,
    context,
    nodeChanges
  );

  context.head.parent = context.head;

  const parentStack = [context.head];
  let previousNode = context.head;
  let time = performance.now();

  while (nodeIterator.nextNode()) {
    const currentElement = nodeIterator.referenceNode as HTMLElement;

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
