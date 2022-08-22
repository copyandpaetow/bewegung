import {
	StyleState,
	getStyleState,
	postprocessProperties,
	readDomChanges,
} from "./calculate-dom-changes";
import { calculateEasingMap } from "./calculate-easings";
import { calculateImageAnimation } from "./calculate-image-animations";
import { getDependecyOptions } from "./construct-keyframes";
import { formatInputs } from "./convert-input-to-chunks";
import { calculateContext } from "./get-context";
import { ChunkState, getChunkState, mapKeysToChunks } from "./get-chunk-state";
import {
	ElementState,
	getElementState,
	findAffectedAndDependencyElements,
} from "./get-element-state";
import { logCalculationTime } from "./logger";
import { normalizeChunks } from "./normalize-chunks";
import {
	callbackState,
	runBeforeAnimation,
	runAfterAnimation,
} from "./required-callbacks";
import { Bewegung, BewegungProps, Chunks, Observer, Context } from "./types";
import { getMainAnimation, getCallbackAnimations } from "./get-animations";

export class Bewegung2 implements Bewegung {
	private now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.now = performance.now();
		this.prepareInput(formatInputs(...bewegungProps));
	}

	//required
	private input: Chunks[] = [];
	private animations: Animation[] = [];
	private reactive?: Observer;
	private beforeAnimationCallbacks = callbackState();
	private afterAnimationCallbacks = callbackState();

	//recalc friendly
	private context: Context;
	private elementState: ElementState;
	private chunkState: ChunkState;
	private styleState: StyleState;

	private playState: AnimationPlayState = "idle";
	private currentTime = 0;
	private progressTime = 0;

	public finished: Promise<Animation[]>;

	private prepareInput(chunks: Chunks[]) {
		this.context = calculateContext(chunks);
		this.input = normalizeChunks(chunks, this.context.totalRuntime);
		this.chunkState = getChunkState(mapKeysToChunks(this.input));
		this.elementState = getElementState(
			findAffectedAndDependencyElements(this.input)
		);
		this.setAnimations();
	}

	private setAnimations() {
		this.styleState = getStyleState(
			postprocessProperties(
				readDomChanges(this.chunkState, this.elementState, this.context)
			)
		);

		this.elementState.getAllElements().forEach((element) => {
			const calculateEasing = calculateEasingMap(
				this.elementState.isMainElement(element)
					? this.chunkState.getOptions(element)
					: getDependecyOptions(element, this.elementState, this.chunkState),
				this.context.totalRuntime
			);

			if (element.tagName === "IMG") {
				this.animations.push(
					...calculateImageAnimation(
						element as HTMLImageElement,
						this.styleState,
						calculateEasing,
						this.context.totalRuntime,
						this.beforeAnimationCallbacks,
						this.afterAnimationCallbacks
					)
				);
			} else {
				this.animations.push(
					getMainAnimation(
						element,
						this.chunkState,
						this.elementState,
						this.styleState,
						this.context,
						calculateEasing
					)
				);
			}

			this.animations.push(
				...getCallbackAnimations(
					element,
					this.chunkState,
					this.context.totalRuntime
				)
			);
		});

		this.setCallbacks();
		logCalculationTime(this.now);

		queueMicrotask(() => {
			this.makeReactive();
		});
	}

	private setCallbacks() {
		this.beforeAnimationCallbacks.set(() =>
			runBeforeAnimation(this.chunkState, this.elementState, this.styleState)
		);
		this.afterAnimationCallbacks.set(() =>
			runAfterAnimation(this.elementState, this.styleState)
		);

		this.finished = Promise.all(
			this.animations.map((animation) => animation.finished)
		);

		this.finished.then(() => {
			this.afterAnimationCallbacks.execute();
		});
	}

	private makeReactive() {
		/*
			TODO: the makeReactive function also has some dependcies:
			* it needs the  elementProperties-, mainElements-, affectedElements-, chunk-, dependencyElement-State
			
		*/
		//this.reactive?.disconnect();
		// this.reactive = listenForChange({
		// 	recalcFromInput: (newInput) => this.prepareInput(newInput),
		// 	recalcAnimations: () => this.setAnimations(),
		// });
	}

	public play() {
		this.beforeAnimationCallbacks.execute();

		console.log(this.animations);
		this.animations.forEach((waapi) => waapi.play());
	}
}
