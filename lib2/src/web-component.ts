import {
  getElementReadouts,
  onlyElements,
  resetHiddenElement,
} from "./helper/element";
import { MO_OPTIONS } from "./helper/observer";
import {
  createTree,
  insertAfterNode,
  removeNode,
  TreeNode,
} from "./helper/tree-node";
import {
  getAppearingKeyframes,
  getDisappearingKeyframes,
  getKeyframes,
} from "./keyframes";

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;

  treeNodes = new WeakMap<HTMLElement, TreeNode>();
  activeAnimations = new Map<HTMLElement, Animation>();

  animationOptions: KeyframeEffectOptions;
  currentVersion = -1;

  constructor() {
    super();
    this.style.contain = "layout";
    this.animationOptions = {
      duration: 1000,
    };
  }

  async disconnectedCallback() {
    await Promise.resolve();
    if (!this.isConnected) {
      this.activeAnimations.clear();
    }
  }

  /*
  todo:

  - we need to exclude the children of nested bewegung web-components when adding elements in general
  - images and border-radii need dedicated calc
  - we need to add RO and IO for better detection
  - on the web-component itself we need to listen for resizes 
  => pause all running animations 
  => disconnect all observers
  => after the resizing is done, we treat it as like with additional animations. We calculate the previous position from the animation, re-read all elements and create new animatiosn

  !bugs

 
   ?improvements
   


  
   */

  connectedCallback() {
    createTree(this, this.treeNodes, this.currentVersion);
    this.setMO();
  }

  updateReadouts(node: TreeNode) {
    if (node.readoutVersion < this.currentVersion) {
      node.currentReadout = node.newReadout ?? node.currentReadout;
      node.newReadout = getElementReadouts(node.element);
      node.readoutVersion = this.currentVersion;
    }
    return node;
  }

  updateSurrounding(node: TreeNode) {
    this.updateNode(node.parent);
    this.updateNode(node.nextSibling);
    this.updateNode(node.prevSibling);
    for (let child = node.firstChild; child; child = child.nextSibling) {
      this.updateNode(child);
    }
  }

  markChildrenAsUpdated(node: TreeNode) {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      child.updateVersion = this.currentVersion;
    }
  }

  setAnimation(node: TreeNode, keyframes: Keyframe[]) {
    if (node.animation) {
      (node.animation.effect as KeyframeEffect).setKeyframes(keyframes);
    } else {
      node.animation = new Animation(
        new KeyframeEffect(node.element, keyframes, this.animationOptions)
      );
    }
    this.activeAnimations.set(node.element, node.animation);

    node.animation.addEventListener(
      "finish",
      () => {
        this.activeAnimations.delete(node.element);
        node.currentReadout = node.newReadout;
      },
      { once: true }
    );

    return node.animation as Animation;
  }

  updateNode(node: TreeNode | null) {
    if (
      !node ||
      node.element === this ||
      node.updateVersion === this.currentVersion
    ) {
      return;
    }
    node.updateVersion = this.currentVersion;

    const keyframes = getKeyframes(
      this.updateReadouts(node),
      this.updateReadouts(node.parent!),
      this
    );

    if (keyframes.length === 0) {
      return;
    }

    this.setAnimation(node, keyframes);
    this.updateSurrounding(node);
  }

  hideNode(node: TreeNode) {
    const parent = this.treeNodes.get(this);
    node.cssText = node.element.style.cssText;

    Object.assign(
      node.element.style,
      resetHiddenElement(node.currentReadout!, parent?.currentReadout!)
    );

    const animation = this.setAnimation(
      node,
      getDisappearingKeyframes(node.currentReadout!)
    );

    animation.addEventListener(
      "finish",
      () => {
        this.stopMO();
        node.element.style = node.cssText;
        this.setMO();
      },
      { once: true }
    );

    this.markChildrenAsUpdated(node);
    this.updateSurrounding(node);
  }

  deleteNode(node: TreeNode) {
    const parent = this.treeNodes.get(this);
    const anchor = node.nextSibling?.element as HTMLElement | null;

    Object.assign(
      node.element.style,
      resetHiddenElement(node.currentReadout!, parent?.currentReadout!)
    );
    node.parent?.element.insertBefore(node.element, anchor);
    const keyframes = getDisappearingKeyframes(node.currentReadout!);

    const animation = this.setAnimation(node, keyframes);

    animation.addEventListener(
      "finish",
      () => {
        this.stopMO();
        node.element.remove();
        this.setMO();
      },
      { once: true }
    );
    this.markChildrenAsUpdated(node);
    removeNode(node);
  }

  addNode(element: HTMLElement) {
    const newNode = createTree(element, this.treeNodes, this.currentVersion);
    const parentNode = this.treeNodes.get(element)!;
    const anchorNode = element.nextElementSibling
      ? this.treeNodes.get(element.nextElementSibling as HTMLElement)!
      : null;
    insertAfterNode(parentNode, newNode, anchorNode);

    this.setAnimation(newNode, getAppearingKeyframes(newNode.currentReadout!));
  }

  moveNode(node: TreeNode, oldParent: TreeNode) {
    if (node.parent === oldParent) {
      //if the move was with the same parent, we dont need to do anything
      return;
    }
  }

  stopMO() {
    this.MO?.disconnect();
    this.MO = null;
  }

  setMO() {
    this.MO ??= new MutationObserver((entries) => {
      this.stopMO();
      this.currentVersion += 1;

      //we mark added elements first
      const addedElements = new Set<HTMLElement>();
      entries.forEach((entry) => {
        entry.addedNodes.forEach((addedNode) => {
          if (onlyElements(addedNode)) {
            addedElements.add(addedNode);
          }
        });
      });

      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        const treeNode = this.treeNodes.get(target)!;

        entry.removedNodes.forEach((removedNode) => {
          if (!onlyElements(removedNode)) {
            return;
          }
          const removedTreeNode = this.treeNodes.get(removedNode)!;

          //if the element to be removed is also present in the added elements set, its actually a move
          //and we use the dedicated method
          if (addedElements.has(removedNode)) {
            addedElements.delete(removedNode);
            this.moveNode(removedTreeNode, treeNode);
            return;
          }

          //otherwise we remove it
          this.deleteNode(removedTreeNode);
        });

        //we mark the parent node as updated regardless of type
        this.updateSurrounding(treeNode);
      });

      //the remaining elements are actually added
      addedElements.forEach(this.addNode.bind(this));

      queueMicrotask(() => {
        this.activeAnimations.forEach((anim) => {
          anim.play();
        });
      });

      //we wait until the next rendering frame to listen again, this way the IO and RO will also not trigger it
      //if something happens before, nothing happens when the observer is recalled
      requestAnimationFrame(() => {
        this.setMO();
      });
    });

    this.MO.observe(this, MO_OPTIONS);
  }
}

customElements.define("bewegung-boundary", Bewegung);
