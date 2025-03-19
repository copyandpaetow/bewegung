import { filterElements } from "./helper/element";
import { MO_OPTIONS } from "./helper/observer";
import { TreeNode, TYPE } from "./tree-node";

export class Bewegung extends HTMLElement {
  MO: MutationObserver | null = null;
  treeNodes = new Map<Element, TreeNode>();
  rootNode: TreeNode | null = null;
  updateCounter = -1;
  inprogress = false;
  animationOptions: KeyframeEffectOptions;
  //TODO: we could have one timekeeper animation here that we could use to scrub the other animations

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
      this.treeNodes.clear();
    }
  }

  /*
  todo:

  - for display animations we need to overright styles 
  - we need to exclude nested web-components and their children
  - we are currently only reacting to elements, text nodes are something entirely different
  => maybe we can get a range for dimensions? 

  - read element animation value and pass them down

 TODO: when we resize the RO and IO call for animations, but that is likely not wanted
 TODO: we need to cancel/pause other animations 



  */

  connectedCallback() {
    this.rootNode = new TreeNode(this, this);
    this.treeNodes.set(this, this.rootNode);
    this.querySelectorAll("*").forEach((element) =>
      this.treeNodes.set(element, new TreeNode(element, this))
    );

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

  propage(element: Element, depth = 0) {
    const targetNode = this.treeNodes.get(element);
    const isUpdated = targetNode?.update(this.updateCounter);

    if (!isUpdated && depth === 0) {
      return;
    }

    //TODO: if the change doesnt result in an update of the parent (mutation observer target) it will not update
    //maybe we dont need to use the depth for all directions
    const newDepth = Math.max(0, depth - 1);
    element.parentElement && this.propage(element.parentElement, newDepth);
    element.nextElementSibling &&
      this.propage(element.nextElementSibling, newDepth);
    element.previousElementSibling &&
      this.propage(element.previousElementSibling, newDepth);

    for (const child of element.children) {
      this.propage(child, newDepth);
    }
  }

  setMO() {
    //TODO: here we could listen for resizes as well and mark the element as disabled
    //todo: with a disabled flag, we could stop nested trees from animating
    this.MO ??= new MutationObserver((entries) => {
      this.scheduleUpdate();
      this.MO?.disconnect();
      this.MO = null;

      // requestAnimationFrame(() => {
      entries.forEach((entry) => {
        this.propage(entry.target as Element, 1);

        [...entry.addedNodes].filter(filterElements).forEach((addedElement) => {
          this.treeNodes.set(addedElement, new TreeNode(addedElement, this));
          this.propage(addedElement);

          this.querySelectorAll("*").forEach((child) =>
            this.treeNodes.set(child, new TreeNode(child, this))
          );
        });

        [...entry.removedNodes]
          .filter(filterElements)
          .forEach((removedElement) => {
            const targetNode = this.treeNodes.get(removedElement);

            //TODO: does this make sense?
            if (!targetNode || targetNode.type === TYPE.DELETE) {
              return;
            }

            targetNode.update(this.updateCounter);
            targetNode.scheduleDelete();

            entry.target.insertBefore(removedElement, entry.nextSibling);
          });
      });
      this.setMO();
      // });
    });

    this.MO.observe(this, MO_OPTIONS);
  }
}

customElements.define("bewegung-boundary", Bewegung);
