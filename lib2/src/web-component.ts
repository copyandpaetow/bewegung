import {
  getElementReadouts,
  onlyElements,
  resetHiddenElement,
} from "./helper/element";
import { MO_OPTIONS } from "./helper/observer";
import { Context, createNodeLoop, TreeNode } from "./helper/tree-node";
import {
  calculateKeyframes,
  getAppearingKeyframes,
  getDisappearingKeyframes,
} from "./keyframes";

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;

  options = {
    disabled: false,
  };
  context: Context = {
    treeNodes: new Map<HTMLElement, TreeNode>(),
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

  - we need to double check the z-index and maybe put it into animations as it otherwise lead to visual order glitches


  !bugs
  - in the hasChange function we check the parent for change after calculating the keyframes. Shouldnt that be the element?

  ?improvements
  - we could test, if use different animations for performant animations (layout) and another animation for the clip-path animations (border and image sizing) 
  => this would add complexity when pausing/stoping animations

  - if an element became visible from transparent, we could reuse the parents dimensions for the calculation

   */

  connectedCallback() {
    requestAnimationFrame(() => {
      //console.log(createNodeLoop(this, this.context));
      const newNodes = createNodeLoop(this, this.context);
      this.context.treeNodes = newNodes.treeNodes;

      this.context.generation += 10;
      this.updateLoop(newNodes.startNode);

      console.log(this.context);
      this.setMO();
    });
  }

  updateLoop(rootNode: TreeNode) {
    let current = rootNode;

    while (current !== rootNode.subloopEnd) {
      this.updateReadout(current);
      current = current.next;
    }
    this.updateReadout(rootNode.subloopEnd);
  }

  updateReadout(node: TreeNode) {
    if (node.readoutGeneration !== this.context.generation) {
      node.readoutGeneration = this.context.generation;
      node.readout = node.pendingReadout;
      node.pendingReadout = getElementReadouts(node.element);
    }
  }

  setAnimation(node: TreeNode, keyframes: Keyframe[]) {
    (node.animation.effect as KeyframeEffect).setKeyframes(keyframes);
    queueMicrotask(() => {
      node.animation.play();
      //node.animation.pause();
    });
  }

  hasChanged(node: TreeNode): Boolean {
    node.changeGeneration = this.context.generation;
    const wasAdded = !node.readout && !node.pendingReadout;

    this.updateReadout(node);
    this.updateReadout(node.parent);

    //TODO: this doesnt really work. We need different behaviour going up and down. Maybe we also need to handle them in a dedicated way
    if (wasAdded) {
      this.setAnimation(node, getAppearingKeyframes(node.pendingReadout!));

      return false;
    }

    const keyframes = calculateKeyframes(
      node.pendingReadout!,
      node.readout!,
      node.parent.pendingReadout!,
      node.parent.readout!
    );

    if (keyframes.at(0)?.transform !== keyframes.at(-1)?.transform) {
      this.setAnimation(node, keyframes);

      return true;
    }

    if (
      node.parent.readout?.dimensions[2] !==
        node.parent.pendingReadout?.dimensions[2] ||
      node.parent.readout?.dimensions[3] !==
        node.parent.pendingReadout?.dimensions[3]
    ) {
      return true;
    }

    return false;
  }

  walkNodeLoop(node: TreeNode) {
    let firstUnchangedParent = node;

    while (firstUnchangedParent.changeGeneration < this.context.generation) {
      if (!this.hasChanged(firstUnchangedParent)) {
        break;
      }

      firstUnchangedParent = firstUnchangedParent.parent;
    }

    const loopStop =
      firstUnchangedParent === firstUnchangedParent.subloopEnd
        ? firstUnchangedParent
        : firstUnchangedParent.subloopEnd.next;

    let nextNode = firstUnchangedParent.next;

    console.log(firstUnchangedParent, loopStop);
    while (nextNode !== loopStop) {
      nextNode = this.hasChanged(nextNode)
        ? nextNode.next
        : nextNode.subloopEnd.next;
    }
  }

  handleRemove(
    removedTreeNode: TreeNode,
    beforeAnimation: VoidFunction,
    afterAnimation: VoidFunction
  ) {
    this.updateReadout(removedTreeNode.parent);
    Object.assign(
      removedTreeNode.element.style,
      resetHiddenElement(
        removedTreeNode.pendingReadout!,
        removedTreeNode.parent.pendingReadout!,
        removedTreeNode.parent.readout!
      )
    );
    removedTreeNode.parent.element.style.willChange = "transform";
    beforeAnimation();

    (removedTreeNode.animation.effect as KeyframeEffect).setKeyframes(
      getDisappearingKeyframes(removedTreeNode)
    );
    queueMicrotask(() => {
      removedTreeNode.animation.play();
      //node.animation.pause();
    });
    removedTreeNode.animation.addEventListener(
      "finish",
      () => {
        this.stopMO();
        afterAnimation();
        removedTreeNode.parent.element.style.willChange = "";
        this.setMO();
      },
      { once: true }
    );
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

      const newNodes = createNodeLoop(this, this.context);
      this.context.treeNodes = newNodes.treeNodes;

      entries.forEach((entry) => {
        if (newNodes.treeNodes.has(entry.target as HTMLElement)) {
          this.walkNodeLoop(
            newNodes.treeNodes.get(entry.target as HTMLElement)!
          );
        }
      });

      entries.forEach((entry) => {
        entry.removedNodes.forEach((node) => {
          if (!onlyElements(node) || !newNodes.removedNodes.has(node)) {
            return;
          }
          const removedNode = newNodes.removedNodes.get(node)!;

          newNodes.removedNodes.delete(node);
          removedNode.subloopEnd.next = removedNode;
          let next = removedNode.next;
          while (next !== removedNode) {
            newNodes.removedNodes.delete(next.element);
            next = next.next;
          }
          this.handleRemove(
            removedNode,
            () => entry.target.insertBefore(node, entry.nextSibling),
            () => removedNode.element.remove()
          );
          this.walkNodeLoop(removedNode.parent);
        });
      });

      newNodes.removedNodes.forEach((removedNode, _, map) => {
        let isFullyHidden = true;
        let next = removedNode.next;
        removedNode.subloopEnd.next = removedNode;

        //if one of the nodes next pointers is not in here it is transparent
        //we need to cleanup the element that points to a still valid node
        while (next !== removedNode) {
          if (!map.has(next.element)) {
            isFullyHidden = false;
            break;
          }
          map.delete(next.element);
          next = next.next;
        }
        //at this point we reduced the map to sub loops
        //every sub loop could be a mix of hidden and transparent nodes
        // very unlikely though
        this.walkNodeLoop(removedNode.parent);
        this.updateReadout(removedNode);
        if (removedNode.readout?.display === "none") {
          this.handleRemove(
            removedNode,
            () =>
              (removedNode.element.style.display =
                removedNode.readout!.display),
            () => (removedNode.element.style.cssText = removedNode.cssText)
          );
        }
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
