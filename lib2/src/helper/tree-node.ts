import { getElementReadouts, Readout } from "./element";

export type TreeNode = {
  element: HTMLElement;
  parent: TreeNode | null;
  firstChild: TreeNode | null;
  lastChild: TreeNode | null;
  nextSibling: TreeNode | null;
  prevSibling: TreeNode | null;
  currentReadout: Readout | null;
  newReadout: Readout | null;
  updateVersion: number;
  readoutVersion: number;
  animation: Animation | null;
  cssText: string;
};

export const createNode = (
  element: HTMLElement,
  nodeMap: WeakMap<HTMLElement, TreeNode>,
  version: number
) => {
  const readout = getElementReadouts(element);

  const node: TreeNode = {
    element,
    currentReadout: readout,
    newReadout: null,
    parent: null,
    nextSibling: null,
    prevSibling: null,
    firstChild: null,
    lastChild: null,
    animation: null,
    updateVersion: version,
    readoutVersion: version,
    cssText: "",
  };

  nodeMap.set(element, node);
  return node;
};

export const createTree = (
  rootElement: HTMLElement,
  nodeMap: WeakMap<HTMLElement, TreeNode>,
  version: number
) => {
  const rootNode = createNode(rootElement, nodeMap, version);

  for (
    let child = rootElement.firstElementChild;
    child;
    child = child.nextElementSibling
  ) {
    const childNode = createTree(child as HTMLElement, nodeMap, version);
    appendNode(rootNode, childNode);
  }

  return rootNode;
};

const appendNode = (parentNode: TreeNode, newNode: TreeNode) => {
  newNode.parent = parentNode;

  if (!parentNode.firstChild) {
    parentNode.firstChild = newNode;
    parentNode.lastChild = newNode;
  } else {
    const lastChild = parentNode.lastChild!;
    lastChild.nextSibling = newNode;
    newNode.prevSibling = lastChild;
    parentNode.lastChild = newNode;
  }

  return newNode;
};

export const insertAfterNode = (
  parentNode: TreeNode,
  newNode: TreeNode,
  anchorNode: TreeNode | null
) => {
  newNode.parent = parentNode;

  if (!anchorNode || anchorNode === parentNode.lastChild) {
    return appendNode(parentNode, newNode);
  }

  const nextSibling = anchorNode.nextSibling;

  anchorNode.nextSibling = newNode;
  newNode.prevSibling = anchorNode;

  newNode.nextSibling = nextSibling;
  if (nextSibling) {
    nextSibling.prevSibling = newNode;
  }
};

export const moveNode = (
  newNode: TreeNode,
  nodeMap: WeakMap<HTMLElement, TreeNode>
) => {
  const removedNode = removeNode(newNode);
  const newParentNode = newNode.element.parentElement
    ? nodeMap.get(newNode.element.parentElement)!
    : null;
  const anchorNode = newNode.element.nextElementSibling
    ? nodeMap.get(newNode.element.nextElementSibling as HTMLElement)!
    : null;

  if (!newParentNode) {
    //TODO: this would mean the element animates out of the web-component
    //=> we could read the new parent once for a simple animation and remove the node completely
    return;
  }

  insertAfterNode(newParentNode, removedNode, anchorNode);
};

export const removeNode = (node: TreeNode) => {
  if (node.prevSibling) {
    node.prevSibling.nextSibling = node.nextSibling;
  }

  if (node.nextSibling) {
    node.nextSibling.prevSibling = node.prevSibling;
  }

  if (node.parent) {
    if (node.parent.firstChild === node) {
      node.parent.firstChild = node.nextSibling;
    }

    if (node.parent.lastChild === node) {
      node.parent.lastChild = node.prevSibling;
    }
  }

  node.parent = null;
  node.nextSibling = null;
  node.prevSibling = null;

  return node;
};
