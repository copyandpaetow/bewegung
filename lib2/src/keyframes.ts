import { type Readout } from "./helper/element";
import { TreeNode, TREENODE_STATE } from "./helper/tree-node";
import { Bewegung } from "./web-component";

export const getAppearingKeyframes = (readout: Readout) => {
  const to = readout.transform.toString();
  const from = new DOMMatrix(to);
  from.scaleSelf(0.001, 0.001);

  return [{ transform: from.toString() }, { transform: to }];
};

export const getDisappearingKeyframes = (node: TreeNode): Keyframe[] => {
  const delta = getDifferences(
    node.readout!,
    node.readout!,
    node.parent?.pendingReadout!,
    node.parent?.readout!
  );

  const from = new DOMMatrix(node.readout!.transform.toString());

  from.scaleSelf(
    1 / delta.parentWidthDifference,
    1 / delta.parentHeightDifference
  );

  const to = new DOMMatrix(from.toString());
  to.scaleSelf(0.001, 0.001);

  return [{ transform: from.toString() }, { transform: to.toString() }];
};

export const getDifferences = (
  readout: Readout,
  previousReadout: Readout,
  parentReadout: Readout,
  previousParentReadout: Readout
) => {
  const [toLeft, toTop, toWidth, toHeight] = readout.dimensions;
  const [toParentLeft, toParentTop, toParentWidth, toParentHeight] =
    parentReadout.dimensions;
  const [originToLeft, originToTop] = readout.transformOrigin;
  const [originToParentLeft, originToParentTop] = parentReadout.transformOrigin;

  const [fromLeft, fromTop, fromWidth, fromHeight] = previousReadout.dimensions;
  const [fromParentLeft, fromParentTop, fromParentWidth, fromParentHeight] =
    previousParentReadout.dimensions;
  const [originFromLeft, originFromTop] = previousReadout.transformOrigin;
  const [originFromParentLeft, originFromParentTop] =
    previousParentReadout.transformOrigin;

  const parentWidthDifference = fromParentWidth / toParentWidth;
  const parentHeightDifference = fromParentHeight / toParentHeight;
  const childWidthDifference = fromWidth / toWidth;
  const childHeightDifference = fromHeight / toHeight;

  const heightDifference = childHeightDifference / parentHeightDifference;
  const widthDifference = childWidthDifference / parentWidthDifference;

  const currentLeftDifference =
    fromLeft + originFromLeft - (fromParentLeft + originFromParentLeft);
  const referenceLeftDifference =
    toLeft + originToLeft - (toParentLeft + originToParentLeft);

  const currentTopDifference =
    fromTop + originFromTop - (fromParentTop + originFromParentTop);
  const referenceTopDifference =
    toTop + originToTop - (toParentTop + originToParentTop);

  const leftDifference =
    currentLeftDifference / parentWidthDifference - referenceLeftDifference;
  const topDifference =
    currentTopDifference / parentHeightDifference - referenceTopDifference;

  return {
    parentWidthDifference,
    parentHeightDifference,
    heightDifference,
    widthDifference,
    leftDifference,
    topDifference,
  };
};

export const calculateKeyframes = (
  readout: Readout,
  previousReadout: Readout,
  parentReadout: Readout,
  previousParentReadout: Readout
): Keyframe[] => {
  const [toLeft, toTop, toWidth, toHeight] = readout.dimensions;
  const [toParentLeft, toParentTop, toParentWidth, toParentHeight] =
    parentReadout.dimensions;
  const [originToLeft, originToTop] = readout.transformOrigin;
  const [originToParentLeft, originToParentTop] = parentReadout.transformOrigin;

  const [fromLeft, fromTop, fromWidth, fromHeight] = previousReadout.dimensions;
  const [fromParentLeft, fromParentTop, fromParentWidth, fromParentHeight] =
    previousParentReadout.dimensions;
  const [originFromLeft, originFromTop] = previousReadout.transformOrigin;
  const [originFromParentLeft, originFromParentTop] =
    previousParentReadout.transformOrigin;

  const parentWidthDifference = fromParentWidth / toParentWidth;
  const parentHeightDifference = fromParentHeight / toParentHeight;
  const childWidthDifference = fromWidth / toWidth;
  const childHeightDifference = fromHeight / toHeight;

  const heightDifference = childHeightDifference / parentHeightDifference;
  const widthDifference = childWidthDifference / parentWidthDifference;

  const currentLeftDifference =
    fromLeft + originFromLeft - (fromParentLeft + originFromParentLeft);
  const referenceLeftDifference =
    toLeft + originToLeft - (toParentLeft + originToParentLeft);

  const currentTopDifference =
    fromTop + originFromTop - (fromParentTop + originFromParentTop);
  const referenceTopDifference =
    toTop + originToTop - (toParentTop + originToParentTop);

  const leftDifference =
    currentLeftDifference / parentWidthDifference - referenceLeftDifference;
  const topDifference =
    currentTopDifference / parentHeightDifference - referenceTopDifference;

  const flipMatrix = new DOMMatrix();
  flipMatrix.translateSelf(leftDifference, topDifference);
  flipMatrix.scaleSelf(widthDifference, heightDifference);

  const currentMatrix = readout!.transform;

  const combinedMatrix = currentMatrix.multiply(flipMatrix);

  return [
    { transform: combinedMatrix.toString() },
    { transform: currentMatrix.toString() },
  ];
};

export const isUnanimatable = (node: TreeNode) => {
  return (
    node.readout?.display === "contents" ||
    node.pendingReadout?.display === "contents"
  );
};

export const isInvisible = (node: TreeNode) => {
  return !node.readout?.isVisible && !node.pendingReadout?.isVisible;
};

export const EMPTY_KEYFRAMES = [];

export const getKeyframes = (
  currentNode: TreeNode,
  parentNode: TreeNode,
  context: Bewegung
): Keyframe[] => {
  if (isInvisible(currentNode)) {
    return EMPTY_KEYFRAMES;
  }

  if (isUnanimatable(currentNode)) {
    currentNode.state = TREENODE_STATE.SKIP;
    return EMPTY_KEYFRAMES;
  }

  if (isUnanimatable(parentNode)) {
    parentNode.state = TREENODE_STATE.SKIP;
    context.updateSurrounding(parentNode.parent!);
    return getKeyframes(
      currentNode,
      context.updateReadouts(parentNode.parent!),
      context
    );
  }

  if (currentNode.readout?.display === "none") {
    context.markChildrenAsUpdated(currentNode);

    return getAppearingKeyframes(currentNode.pendingReadout!);
  }

  if (currentNode.pendingReadout?.display === "none") {
    context.hideNode(currentNode);
    return EMPTY_KEYFRAMES;
  }

  const keyframes = calculateKeyframes(
    currentNode.pendingReadout!,
    currentNode.readout!,
    parentNode.pendingReadout!,
    parentNode.readout!
  );

  if (keyframes.at(0)?.transform !== keyframes.at(-1)?.transform) {
    return keyframes;
  }

  if (
    parentNode.readout?.dimensions[2] !==
      parentNode.pendingReadout?.dimensions[2] ||
    parentNode.readout?.dimensions[3] !==
      parentNode.pendingReadout?.dimensions[3]
  ) {
    context.updateSurrounding(parentNode);
  }
  return EMPTY_KEYFRAMES;
};
