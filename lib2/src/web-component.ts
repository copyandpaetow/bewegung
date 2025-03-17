import { MO_OPTIONS } from "./observer-helper";
import { TreeNode } from "./tree-node";

class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;
  treeNodes = new WeakMap<Element, TreeNode>();
  rootNode: TreeNode | null = null;
  updateCounter = -1;
  inprogress = false;

  constructor() {
    super();
    this.style.contain = "layout";
  }

  async disconnectedCallback() {
    await Promise.resolve();
    if (!this.isConnected) {
    }
  }

  /*
  todo:
  - adding/removing elements: we need to exclude their children
  - for display animations we need to overright styles 
  - we need to exclude nested web-components and their children
  - we are currently only reacting to elements, text nodes are something entirely different
  => maybe we can get a range for dimensions? 

  - read element animation value and pass them down

 TODO: when we resize the RO and IO call for animations, but that is likely not wanted
 TODO: we need to cancel/pause other animations 


  */

  connectedCallback() {
    const context = {
      onMount: (node: TreeNode) => {
        this.treeNodes.set(node.key, node);
      },
      animationOptions: {
        duration: 2000,
      },
    };

    this.rootNode = new TreeNode(this, null, context);
    this.setMO();
  }

  scheduleUpdate() {
    if (this.inprogress) {
      return;
    }
    this.inprogress = true;
    this.updateCounter++;
    requestAnimationFrame(() =>
      queueMicrotask(() => {
        this.inprogress = false;
      })
    );
  }

  setMO() {
    //TODO: here wew could listen for resizes as well and mark the element as
    this.MO ??= new MutationObserver((entries) => {
      this.scheduleUpdate();

      this.MO?.disconnect();
      this.MO = null;
      entries.forEach((entry) => {
        const targetNode = this.treeNodes.get(entry.target as Element);
        targetNode?.update(this.updateCounter);

        // [...entry.addedNodes]
        //   .filter(filterElements)
        //   .forEach((addedElement) => {
        //     /*
        //       - lookup previousSibling
        //       - append after (and update the linked listed pointers)
        //     */
        //   });

        // [...entry.removedNodes]
        //   .filter(filterElements)
        //   .forEach((removedElement) => {
        //     /*
        //       - lookup removedElement and call its delete method
        //       => will the element be detached from pointers straight away or after the animation?
        //       => if the dom changes while this animation happens, does it still need to be included in the readouts?
        //     */
        //     //entry.target.insertBefore(removedElement, entry.nextSibling);
        //   });
      });
      this.setMO();
    });

    this.MO.observe(this, MO_OPTIONS);
  }
}

customElements.define("bewegung-boundary", Bewegung);
