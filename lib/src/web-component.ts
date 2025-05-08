import {
	defaultAnimationOptions,
	getOptionsFromElement,
} from "./element/animation-options";
import { updateReadout } from "./element/readout";
import { resetHiddenElement } from "./element/reset-hidden";
import { getAppearingKeyframes } from "./keyframes/appearing";
import { getDisappearingKeyframes } from "./keyframes/disappearing";
import { MO_OPTIONS } from "./observer/intersection";
import { setAnimation } from "./tree-nodes/animation";
import { hasChanged } from "./tree-nodes/has-changed";
import { createNodeLoop, updateLoop } from "./tree-nodes/loop";
import { TreeNode } from "./tree-nodes/node";

export type Context = {
	head: TreeNode | null;
	treeNodes: Map<HTMLElement, TreeNode>;
	animationOptions: KeyframeEffectOptions;
};

const EMPTY_ROOT_PREFIX = "";

export class Bewegung extends HTMLElement {
	static register(tagName = this.tagName) {
		customElements.define(tagName, this);
	}

	static tagName = "bewegung-boundary";

	#MO: MutationObserver | null = null;
	#RO: ResizeObserver | null = null;

	#options = {
		disabled: false,
	};
	#context: Context = {
		head: null,
		treeNodes: new Map<HTMLElement, TreeNode>(),
		animationOptions: defaultAnimationOptions,
	};

	constructor() {
		super();
		this.style.contain = "layout";
		if (this.hasAttribute("disabled")) {
			this.#options.disabled = true;
		}
		this.#context.animationOptions = getOptionsFromElement(
			this,
			defaultAnimationOptions,
			EMPTY_ROOT_PREFIX
		);
	}

	async disconnectedCallback() {
		await Promise.resolve();
		if (!this.isConnected) {
			//cleanup whole tree
			this.#stopMO();
			this.#stopRO();
		}
	}

	/*
  todo:

  - images and border-radii need dedicated calc
  - we need to add RO and IO for better detection

  - we need to double check the z-index and maybe put it into animations as it otherwise lead to visual order glitches
  - we need to be able to incorporate potential previous animations 
  => if we animate from A => B and while thats happening we have another change, we need to find the intermediary Step from using the scale and translates and the B readoout

  - we need to be able to stop and recover

  - the class could have play/pause methods and a manual/automatic mode

  !bugs
  - removing the child from the dom of an element that became hidden would not work currently (rare edgecase) as it gets mashed together with the other hidden nodes
	- if the boundary is still in viewport but children can scroll freely, the calculations is off. We need to catch the scroll amount and add/substract that from the children

  ?improvements
  - we could test, if use different animations for performant animations (layout) and another animation for the clip-path animations (border and image sizing) 
  => this would add complexity when pausing/stoping animations

  - if an element became visible from transparent, we could reuse the parents dimensions for the calculation

   */

	async connectedCallback() {
		try {
			await createNodeLoop(this, this.#context);
			if (this.#context.head) {
				await updateLoop(this.#context.head);
			} else {
				console.warn("no element was found");
			}
			this.#setMO();
			this.#setRO();
		} catch (error) {
			console.warn("there was an issue setting up the node structure", error);
		}
	}

	#setRO() {
		if (this.#RO) {
			return;
		}
		let skipInitial = true;
		let debounce = -1;

		this.#RO = new ResizeObserver(() => {
			if (skipInitial) {
				skipInitial = false;
				return;
			}
			this.#stopMO();
			clearTimeout(debounce);
			debounce = setTimeout(() => {
				this.connectedCallback();
			}, 1000);
		});
		this.#RO.observe(this);
	}
	#stopRO() {
		this.#RO?.disconnect();
		this.#RO = null;
	}

	#walkNodeLoop(node: TreeNode) {
		let firstUnchangedParent = node;

		while (hasChanged(firstUnchangedParent)) {
			firstUnchangedParent = firstUnchangedParent.parent;
		}

		const loopStop =
			firstUnchangedParent === firstUnchangedParent.subloopEnd
				? firstUnchangedParent
				: firstUnchangedParent.subloopEnd.next;

		let nextNode = firstUnchangedParent.next;

		while (nextNode !== loopStop) {
			if (hasChanged(nextNode)) {
				nextNode.hasChanged = true;
				nextNode = nextNode.next;
			} else {
				//TODO: this might be handlable during the setup
				//* if we reach the root node, it will point to itself to create an infinite loop
				if (nextNode === nextNode.subloopEnd.next) {
					break;
				}
				nextNode = nextNode.subloopEnd.next;
			}
		}
	}

	#handleRemove(
		removedTreeNode: TreeNode,
		beforeAnimation: VoidFunction,
		afterAnimation: VoidFunction
	) {
		removedTreeNode.parent.pendingReadout ??= updateReadout(
			removedTreeNode.parent
		);
		Object.assign(
			removedTreeNode.element.style,
			resetHiddenElement(
				removedTreeNode.readout!,
				removedTreeNode.parent.pendingReadout!,
				removedTreeNode.parent.readout!
			)
		);
		removedTreeNode.parent.element.style.willChange = "transform";
		beforeAnimation();

		setAnimation(removedTreeNode, getDisappearingKeyframes(removedTreeNode));

		removedTreeNode.animation.addEventListener(
			"finish",
			() => {
				this.#stopMO();
				afterAnimation();
				removedTreeNode.parent.element.style.willChange = "";
				this.#setMO();
			},
			{ once: true }
		);
	}

	#stopMO() {
		this.#MO?.disconnect();
		this.#MO = null;
	}

	#setMO() {
		if (this.#options.disabled || this.#MO) {
			return;
		}

		this.#MO = new MutationObserver(async (entries) => {
			this.#stopMO();

			const nodeChanges = await createNodeLoop(this, this.#context, 50);

			entries.forEach((entry) => {
				if (this.#context.treeNodes.has(entry.target as HTMLElement)) {
					this.#walkNodeLoop(
						this.#context.treeNodes.get(entry.target as HTMLElement)!
					);
				}
			});

			const removedElements = new Map(
				entries.flatMap((entry) =>
					[...entry.removedNodes].map((element) => [element, entry])
				)
			);

			nodeChanges.removedNodes.forEach((removedNode) => {
				this.#walkNodeLoop(removedNode.parent);

				if (removedElements.has(removedNode.element)) {
					const entry = removedElements.get(removedNode.element)!;
					this.#handleRemove(
						removedNode,
						() =>
							entry.target.insertBefore(removedNode.element, entry.nextSibling),
						() => removedNode.element.remove()
					);
					return;
				}

				//TODO: there could be other cases here
				removedNode.pendingReadout ??= updateReadout(removedNode);
				if (removedNode.pendingReadout?.display === "none") {
					this.#handleRemove(
						removedNode,
						() =>
							(removedNode.element.style.display =
								removedNode.readout!.display),
						() =>
							(removedNode.element.style.cssText =
								removedNode.pendingReadout!.cssText)
					);
				}
			});

			nodeChanges.addedNodes.forEach(async (addedNode) => {
				await updateLoop(addedNode, 50);
				setAnimation(
					addedNode,
					getAppearingKeyframes(addedNode.pendingReadout!)
				);
				this.#walkNodeLoop(addedNode.parent);
			});

			//we wait until the next rendering frame to listen again, this way the IO and RO will also not trigger it
			//if something happens before, nothing happens when the observer is recalled
			requestAnimationFrame(() => {
				this.#setMO();
			});
		});

		this.#MO.observe(this, MO_OPTIONS);
	}
}
