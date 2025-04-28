import { Readout, VISIBILITY_OPTIONS } from "./element";

export type Context = {
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

export type Result = {
  treeNodes: Map<HTMLElement, TreeNode>;
  addedNodes: Map<HTMLElement, TreeNode>;
  removedNodes: Map<HTMLElement, TreeNode>;
};

export const createNode = (
  element: HTMLElement,
  parent: TreeNode,
  context: Context,
  result: Result
) => {
  const wasAvailable = context.treeNodes.get(element);

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

  //todo: in here we could alter the TreeNode or reset parts of it

  node.subloopEnd = node;
  node.parent = parent;
  node.hasChanged = false;
  node.readout = node.pendingReadout ?? node.readout;
  node.pendingReadout = null;

  if (!wasAvailable) {
    node.hasChanged = true;
    if (!result.addedNodes.has(parent.element)) {
      result.addedNodes.set(element, node);
    }
  } else {
    context.treeNodes.delete(element);
  }
  result.treeNodes.set(element, node);

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

export const createNodeLoop = (root: HTMLElement, context: Context) => {
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

  const result = {
    treeNodes: new Map<HTMLElement, TreeNode>(),
    addedNodes: new Map<HTMLElement, TreeNode>(),
    removedNodes: context.treeNodes,
    startNode: fake as TreeNode,
  };
  result.startNode = createNode(
    nodeIterator.referenceNode as HTMLElement,
    fake,
    context,
    result
  );

  result.startNode.parent = result.startNode;

  const parentStack = [result.startNode];
  let previousNode = result.startNode;

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
    const treeNode = createNode(currentElement, parentNode, context, result);

    previousNode.next = treeNode;
    previousNode = treeNode;
  }

  previousNode.next = result.startNode;

  while (parentStack.length) {
    parentStack.pop()!.subloopEnd = previousNode!;
  }

  let previous: TreeNode | null = null;
  result.removedNodes.forEach((node, key, map) => {
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

  return result;
};
