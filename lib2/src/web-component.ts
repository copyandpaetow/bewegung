import { getElementReadouts, onlyElements, ValueOf } from "./helper/element";
import { MO_OPTIONS } from "./helper/observer";
import { Context, createNodeLoop, TreeNode } from "./helper/tree-node";
import { calculateKeyframes, isInvisible, isUnanimatable } from "./keyframes";

export const CHANGE_TYPES = {
  UNCHANGED: 1,
  RELATIVE_UNCHANGED: 2,
  CHANGED: 3,
  HIDDEN: 4,
  UNANIMATABLE: 5,
} as const;

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;

  options = {
    disabled: false,
  };
  context: Context = {
    treeNodes: new WeakMap<HTMLElement, TreeNode>(),
    generation: 10,
    animationOptions: {
      duration: 400,
    },
  };

  constructor() {
    super();
    this.style.contain = "layout";
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
      //console.log(createNodeLoop(this, this.context));
      createNodeLoop(this, this.context);
      this.setMO();
    });
  }

  hasChanged(node: TreeNode): ValueOf<typeof CHANGE_TYPES> {
    node.changeGeneration = this.context.generation;

    if (node.readoutGeneration !== this.context.generation) {
      node.readoutGeneration = this.context.generation;
      node.readout = node.pendingReadout;
      node.pendingReadout = getElementReadouts(node.element);
    }

    if (isUnanimatable(node)) {
      node.changeGeneration += CHANGE_TYPES.UNANIMATABLE;
      return CHANGE_TYPES.UNANIMATABLE;
    }

    if (isInvisible(node)) {
      node.changeGeneration += CHANGE_TYPES.HIDDEN;
      return CHANGE_TYPES.HIDDEN;
    }

    let nextParent = node.parent;

    while (nextParent) {
      if (nextParent.readoutGeneration !== this.context.generation) {
        nextParent.readoutGeneration = this.context.generation;
        nextParent.readout = nextParent.pendingReadout;
        nextParent.pendingReadout = getElementReadouts(nextParent.element);
      }

      if (isUnanimatable(nextParent)) {
        nextParent = nextParent.parent;
        continue;
      }
      break;
    }

    const keyframes = calculateKeyframes(
      node.pendingReadout!,
      node.readout!,
      nextParent.pendingReadout!,
      nextParent.readout!
    );

    if (keyframes.at(0)?.transform !== keyframes.at(-1)?.transform) {
      (node.animation.effect as KeyframeEffect).setKeyframes(keyframes);
      //console.log("animated", node);

      queueMicrotask(() => {
        node.animation.play();
        //node.animation.pause();
      });
      node.changeGeneration += CHANGE_TYPES.CHANGED;
      return CHANGE_TYPES.CHANGED;
    }

    if (
      nextParent.readout?.dimensions[2] !==
        nextParent.pendingReadout?.dimensions[2] ||
      nextParent.readout?.dimensions[3] !==
        nextParent.pendingReadout?.dimensions[3]
    ) {
      node.changeGeneration += CHANGE_TYPES.RELATIVE_UNCHANGED;
      return CHANGE_TYPES.RELATIVE_UNCHANGED;
    }

    node.changeGeneration += CHANGE_TYPES.UNCHANGED;
    return CHANGE_TYPES.UNCHANGED;
  }

  walkNodeLoop(element: HTMLElement) {
    const node = this.context.treeNodes.get(element)!;

    let firstUnchangedParent = node;

    while (firstUnchangedParent.changeGeneration < this.context.generation) {
      const changeType = this.hasChanged(firstUnchangedParent);
      if (changeType === CHANGE_TYPES.UNCHANGED) {
        break;
      }

      // firstUnchangedParent.shortcut = firstUnchangedParent.nextIfChanged;
      firstUnchangedParent = firstUnchangedParent.parent;
    }

    if (firstUnchangedParent.element !== this) {
      //we set its next sibling as a shortcut to shorten the circuit
      firstUnchangedParent.nextIfUnchanged.shortcut = firstUnchangedParent;
    }

    let nextNode = firstUnchangedParent.nextIfChanged;
    //console.log("firstUnchangedParent", firstUnchangedParent, node);

    while (nextNode !== firstUnchangedParent) {
      if (nextNode.shortcut) {
        const shortcut = nextNode.shortcut;
        nextNode.shortcut = null;
        nextNode = shortcut;
        //?if we are done with one change, we could shortcut the start and end together, so it will not get read for the
        //we could also leave them but check if their generation is behind this one. If so, it was an old shortcut
        continue;
      }

      const changeType =
        nextNode.changeGeneration < this.context.generation
          ? this.hasChanged(nextNode)
          : ((nextNode.changeGeneration % this.context.generation) as ValueOf<
              typeof CHANGE_TYPES
            >);

      switch (changeType) {
        case CHANGE_TYPES.CHANGED:
        case CHANGE_TYPES.RELATIVE_UNCHANGED:
        case CHANGE_TYPES.UNANIMATABLE:
          nextNode.nextIfChanged;
          break;

        default:
          nextNode.nextIfUnchanged;
          break;
      }
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
      this.context.generation += 10;

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

        entry.removedNodes.forEach((removedNode) => {
          if (!onlyElements(removedNode)) {
            return;
          }
          const removedTreeNode = this.context.treeNodes.get(removedNode)!;

          //if the element to be removed is also present in the added elements set, its actually a move
          //and we use the dedicated method
          if (addedElements.has(removedNode)) {
            addedElements.delete(removedNode);
            //this.moveNode(removedTreeNode, treeNode);
            return;
          }

          //otherwise we remove it
          //this.deleteNode(removedTreeNode);
        });

        //we mark the parent node as updated regardless of type
        this.walkNodeLoop(target);
      });

      //the remaining elements are actually added
      //addedElements.forEach(this.walkNodeLoop.bind(this));

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
