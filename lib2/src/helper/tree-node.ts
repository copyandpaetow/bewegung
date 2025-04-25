import { Readout, VISIBILITY_OPTIONS } from "./element";

export type Context = {
  generation: number;
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
  changeGeneration: number;
  readoutGeneration: number;
  animation: Animation;
  cssText: string;
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
    changeGeneration: context.generation,
    readoutGeneration: context.generation,
    cssText: "",
  };

  node.subloopEnd = node;
  node.parent = parent;

  if (!wasAvailable) {
    result.addedNodes.set(element, node);
  } else {
    context.treeNodes.delete(element);
  }
  result.treeNodes.set(element, node);

  return node;
};

//TODO: this is so aggressive, it somehow produces the wrong loop?
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

//TODO: we would input two maps: a new and and old one. The old one has the nodes of the new dom
//? maybe this new map could also be the return type of this function
// => when updating the loop we take known nodes out of the old map and put it into the new one
// => we then are left with a map of removed nodes
//? we would need to iterate them and chunk the related ones. We could skip an element if its parent element is also in there?
//

export const createNodeLoop = (root: HTMLElement, context: Context) => {
  //we need to check if there is a visible result, the root could be transparent though so just checking its visiblity is not enough
  const result = {
    treeNodes: new Map<HTMLElement, TreeNode>(),
    addedNodes: new Map<HTMLElement, TreeNode>(),
    removedNodes: context.treeNodes,
    startNode: fake as TreeNode,
  };

  const nodeIterator = document.createNodeIterator(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        //TODO: we can check if the parent node has the same dimensions with offsetHeight/left/widht etc
        //we might need to do a queryselectorAll here though or move the previousNode higher (less clean though)
        return isVisible(node as HTMLElement)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  const parentStack: Array<TreeNode> = [];
  let previousNode: TreeNode | null = null;

  while (nodeIterator.nextNode()) {
    const currentElement = nodeIterator.referenceNode as HTMLElement;

    //TODO: this we might be able to pull out of here
    if (!previousNode) {
      previousNode = createNode(currentElement, fake, context, result);
      result.startNode = previousNode;
      previousNode.parent = previousNode;
      parentStack.push(previousNode);

      continue;
    }

    if (!(parentStack.at(-1)?.element ?? root).contains(currentElement)) {
      const lastStack = parentStack.pop();
      if (lastStack) {
        lastStack.subloopEnd = previousNode;
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

  if (previousNode) {
    previousNode.next = result.startNode;
  }

  while (parentStack.length) {
    parentStack.pop()!.subloopEnd = previousNode!;
  }

  return result;
};
