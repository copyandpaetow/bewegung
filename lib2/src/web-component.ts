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
  TREENODE_STATE,
} from "./helper/tree-node";
import {
  getAppearingKeyframes,
  getDisappearingKeyframes,
  getKeyframes,
} from "./keyframes";

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;

  treeNodes = new WeakMap<HTMLElement, TreeNode>();
  generation = 1;
  animationOptions: KeyframeEffectOptions;
  options = {
    disabled: false,
  };

  constructor() {
    super();
    this.style.contain = "layout";
    this.animationOptions = {
      duration: 200,
    };
    if (this.hasAttribute("disabled")) {
      this.options.disabled = true;
    }
  }

  async disconnectedCallback() {
    await Promise.resolve();
    if (!this.isConnected) {
      //cleanup whole tree
    }
  }

  /*
  todo:

  - we need to exclude the children of nested bewegung web-components when adding elements in general
  - images and border-radii need dedicated calc
  - we need to add RO and IO for better detection
  - we need to capture the animation option from the elements
  - on the web-component itself we need to listen for resizes 
  => pause all running animations 
  => disconnect all observers
  => after the resizing is done, we treat it as like with additional animations. We calculate the previous position from the animation, re-read all elements and create new animatiosn

  - we might need to hold onto the previous calculations

  !bugs

   ?improvements
   


  
   */

  connectedCallback() {
    requestAnimationFrame(() => {
      createTree(this, this.treeNodes, this.animationOptions, this.generation);
      this.setMO();
    });
  }

  updateReadouts(node: TreeNode) {
    if (!node.pendingReadout) {
      node.pendingReadout = getElementReadouts(node.element);
      queueMicrotask(() => {
        node.readout = node.pendingReadout;
        node.pendingReadout = null;
      });
    }
    return node;
  }

  updateSurrounding(node: TreeNode) {
    if (node && node.generation !== this.generation) this.updateNode(node);
    if (
      node.parent &&
      node.parent.element !== this &&
      node.parent.generation !== this.generation
    ) {
      this.updateNode(node.parent);
    }

    for (
      let child = node.parent!.firstChild;
      child;
      child = child.nextSibling
    ) {
      if (child.generation !== this.generation) this.updateNode(child);
    }

    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.generation !== this.generation) this.updateNode(child);
    }
  }

  markChildrenAsUpdated(node: TreeNode) {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      this.markElementAsUpdated(child);
    }
  }

  markElementAsUpdated(node: TreeNode) {
    if (node.state === TREENODE_STATE.SKIP) {
      return;
    }
    node.generation = this.generation;
  }

  setAnimation(node: TreeNode, keyframes: Keyframe[]) {
    (node.animation.effect as KeyframeEffect).setKeyframes(keyframes);

    queueMicrotask(() => {
      node.animation.play();
    });

    return node.animation;
  }

  updateNode(node: TreeNode) {
    this.markElementAsUpdated(node);

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
    node.cssText = node.element.style.cssText;

    this.markChildrenAsUpdated(node);
    this.updateSurrounding(node);

    Object.assign(
      node.element.style,
      resetHiddenElement(
        node.readout!,
        node.parent!.pendingReadout!,
        node.parent?.readout!
      )
    );
    node.parent!.element.style.willChange = "transform";

    const animation = this.setAnimation(node, getDisappearingKeyframes(node));

    animation.addEventListener(
      "finish",
      () => {
        this.stopMO();
        node.element.style = node.cssText;
        node.parent!.element.style.willChange = "";
        this.setMO();
      },
      { once: true }
    );
  }

  deleteNode(node: TreeNode) {
    const anchor = node.nextSibling?.element ?? (null as HTMLElement | null);

    Object.assign(
      node.element.style,
      resetHiddenElement(
        node.readout!,
        node.parent!.pendingReadout!,
        node.parent?.readout!
      )
    );
    node.parent?.element.insertBefore(node.element, anchor);
    const keyframes = getDisappearingKeyframes(node);

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
    this.markElementAsUpdated(node);
    this.markChildrenAsUpdated(node);
    removeNode(node);
  }

  addNode(element: HTMLElement) {
    const newNode = createTree(
      element,
      this.treeNodes,
      this.animationOptions,
      this.generation
    );
    const parentNode = this.treeNodes.get(element.parentElement!)!;
    const anchorNode = element.previousElementSibling
      ? this.treeNodes.get(element.previousElementSibling as HTMLElement)!
      : null;
    insertAfterNode(parentNode, newNode, anchorNode);

    this.setAnimation(newNode, getAppearingKeyframes(newNode.readout!));
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
    if (this.options.disabled) {
      return;
    }
    this.MO ??= new MutationObserver((entries) => {
      this.stopMO();
      this.generation++;

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
