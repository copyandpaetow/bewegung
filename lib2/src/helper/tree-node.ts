import { getElementReadouts, Readout } from "./element";

export type TreeNode = {
  element: HTMLElement;
  parent: TreeNode;
  nextIfChanged: TreeNode;
  nextIfUnchanged: TreeNode;
  shortcut: TreeNode | null;
  readout: Readout | null;
  pendingReadout: Readout | null;
  changeGeneration: number;
  readoutGeneration: number;
  animation: Animation;
  cssText: string;
};

export type Context = {
  generation: number;
  treeNodes: WeakMap<HTMLElement, TreeNode>;
  animationOptions: KeyframeEffectOptions;
};

export const SKIP_MARKER = 0;

export const fake = {} as TreeNode;

export const createNode = (element: HTMLElement, context: Context) => {
  const readout = getElementReadouts(element);

  const node: TreeNode = {
    element,
    readout: readout,
    pendingReadout: readout,
    parent: context.treeNodes.get(element?.parentElement ?? element) ?? fake,
    nextIfChanged: fake,
    nextIfUnchanged: fake,
    shortcut: null,
    animation: new Animation(
      new KeyframeEffect(element, null, context.animationOptions)
    ),
    changeGeneration:
      readout.display !== "contents" ? context.generation : SKIP_MARKER,
    readoutGeneration: context.generation,
    cssText: "",
  };

  context.treeNodes.set(element, node);
  return node;
};

export const createNodeLoop = (root: HTMLElement, context: Context) => {
  const rootNode = createNode(root, context);
  rootNode.parent = rootNode;
  rootNode.nextIfUnchanged = rootNode;

  let previous = rootNode;

  //TODO: initially this doesnt need to be fast, we could schedule it, maybe with a nodeIterator instead?

  root.querySelectorAll("*").forEach((child) => {
    const currentNode = createNode(child as HTMLElement, context);
    previous.nextIfChanged = currentNode;

    queueMicrotask(() => {
      currentNode.nextIfUnchanged =
        context.treeNodes.get(child.nextElementSibling as HTMLElement) ??
        currentNode.parent.nextIfUnchanged;
    });

    previous = currentNode;
  });

  queueMicrotask(() => {
    rootNode.nextIfUnchanged = rootNode.nextIfChanged;
  });

  previous.nextIfUnchanged = rootNode;
  previous.nextIfChanged = rootNode;
  previous.parent.nextIfUnchanged = rootNode;

  return { start: rootNode, end: previous };
};

export const addNodeToLoop = (element: HTMLElement, context: Context) => {
  //we get the start and end of the new sub loop
  const { start, end } = createNodeLoop(element, context);

  //we get the previous node that would point to this element if unchanged which is either the previous sibling or the parent
  let previousLoopPoint = context.treeNodes.get(
    (element.parentElement?.firstElementChild ??
      element.parentElement) as HTMLElement
  )!;

  //we place the new node start between the previous and next node (if unchanged)
  const savedNextNode = previousLoopPoint.nextIfUnchanged;
  start.nextIfUnchanged = savedNextNode;
  previousLoopPoint.nextIfUnchanged = start;
  //we also set the end of the sub loop to the next node
  end.nextIfChanged = savedNextNode;
  end.nextIfUnchanged = savedNextNode;

  //the previous node could have children, where the last of them points to the next node
  //we need to replace that next node with the start of our sub loop
  while (previousLoopPoint.nextIfChanged !== savedNextNode) {
    previousLoopPoint = previousLoopPoint.nextIfChanged;
  }
  previousLoopPoint.nextIfChanged = start;
};

export const removeFromLoop = (node: TreeNode, context: Context) => {
  //we get the previous node that points to the removed node (if unchanged)
  let previousLoopPoint = context.treeNodes.get(
    (node.parent.element.firstElementChild as HTMLElement) ??
      node.parent.element
  )!;
  //we will connect it to the next node
  previousLoopPoint.nextIfUnchanged = node.nextIfUnchanged;

  //the previous node could have children, where the last of them points to the node we want to remove
  //we need to replace that last node with the start of the next node
  while (previousLoopPoint.nextIfChanged !== node) {
    previousLoopPoint = previousLoopPoint.nextIfChanged;
  }
  previousLoopPoint.nextIfChanged = node.nextIfUnchanged;
  previousLoopPoint.nextIfUnchanged = node.nextIfUnchanged;

  // to help the GC we cut the connection to the loop as the end of this sup loop still points to next node
  // we delete it from the nodeMap and point all references to itself
  let lastRemovedChildNode = node;

  while (true) {
    if (!node.element.contains(lastRemovedChildNode.element)) {
      break;
    }
    context.treeNodes.delete(lastRemovedChildNode.element);
    const nextNode = node.nextIfChanged;
    lastRemovedChildNode.parent = lastRemovedChildNode;
    lastRemovedChildNode.nextIfUnchanged = lastRemovedChildNode;
    lastRemovedChildNode.nextIfChanged = lastRemovedChildNode;
    lastRemovedChildNode = nextNode;
  }
};

// export const moveNodeWithinLoop = (node: TreeNode, context: Context) => {
//   //todo: animation outside of the loop is an edge case as well as move inside of the loop
// };
