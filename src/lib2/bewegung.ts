import { calculateImageAnimation } from "./animate/calculate-image";
import { calculateEasingMap } from "./animate/calculate-timeline";
import { getDependecyOptions } from "./animate/keyframes";
import { getMainAnimation, getCallbackAnimations } from "./animations";
import { calculateContext } from "./input/context";
import { formatInputs } from "./input/convert-to-chunks";
import { normalizeChunks } from "./input/normalize-chunks";
import { logCalculationTime } from "./logger";
import {
	ChunkState,
	getChunkState,
	mapKeysToChunks,
} from "./prepare/chunk-state";
import {
	ElementState,
	findAffectedAndDependencyElements,
	getElementState,
} from "./prepare/element-state";
import {
	getStyleState,
	postprocessProperties,
	readDomChanges,
	StyleState,
} from "./read/read";
import {
	callbackState,
	runAfterAnimation,
	runBeforeAnimation,
} from "./required-callbacks";
import { Bewegung, BewegungProps, Chunks, Context, Observer } from "./types";

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
