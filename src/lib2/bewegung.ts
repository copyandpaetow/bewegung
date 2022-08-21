import { Observer, BewegungProps, Chunks, Bewegung } from "./types";
import { formatInputs } from "./input/convert-to-chunks";
import { defaultOptions } from "./constants";
import { calculateTotalRuntime } from "./input/runtime";
import { normalizeChunks } from "./input/normalize-chunks";
import {
	ChunkState,
	getChunkState,
	mapKeysToChunks,
} from "./prepare/chunk-state";
import {
	getElementState,
	findAffectedAndDependencyElements,
	ElementState,
} from "./prepare/element-state";
import {
	getStyleState,
	getTransformValues,
	postprocessProperties,
	readDomChanges,
	StyleState,
} from "./read/read";
import {
	updateChangeTimings,
	updateChangeProperties,
} from "./read/properties-and-timings";
import {
	constructKeyframes,
	getBorderRadius,
	getDependecyOptions,
	getFilter,
	getOpacity,
	getUserTransforms,
} from "./animate/keyframes";
import { calculateEasingMap } from "./animate/calculate-timeline";
import { calculateNewImage } from "./animate/calculate-image";
import { applyStyles } from "./animate/methods";
import { getAnimations } from "./animations";

const logCalculationTime = (startingTime: number) => {
	const end = performance.now() - startingTime;
	if (end < 50) {
		console.log(`animation calculation was fast with ${end}ms`);
	}
	if (end > 50) {
		console.warn(`animation calculation was slow with ${end}ms`);
	}
	if (end > 100) {
		console.error(
			`animation calculation was so slow that the user might notice with ${end}ms`
		);
	}
};

export class Bewegung2 implements Bewegung {
	private now: number;

	constructor(...bewegungProps: BewegungProps) {
		this.now = performance.now();
		this.prepareInput(formatInputs(...bewegungProps));
	}

	private totalRuntime = defaultOptions.duration as number;
	private input: Chunks[] = [];
	private animations: Animation[] = [];
	private reactive?: Observer;
	private elementState: ElementState;
	private chunkState: ChunkState;
	private applyStyles: VoidFunction;

	private playState: AnimationPlayState = "idle";
	private currentTime = 0;
	private progressTime = 0;

	public finished: Promise<Animation[]>;

	private prepareInput(chunks: Chunks[]) {
		this.totalRuntime = calculateTotalRuntime(
			chunks.map((chunk) => chunk.options.endTime!)
		);
		this.input = normalizeChunks(chunks, this.totalRuntime);
		this.chunkState = getChunkState(mapKeysToChunks(this.input));
		this.elementState = getElementState(
			findAffectedAndDependencyElements(this.input)
		);
		this.calculateState();
	}

	private calculateState() {
		this.animations = getAnimations(
			this.chunkState,
			this.elementState,
			this.totalRuntime
		);
		this.applyStyles = createApplyStyleCallback(this.elementState);

		this.finished = Promise.all(
			this.animations.map((animation) => animation.finished)
		);

		logCalculationTime(this.now);

		queueMicrotask(() => {
			this.makeReactive();
		});
	}

	private makeReactive() {
		/*
			TODO: the makeReactive function also has some dependcies:
			* it needs the  elementProperties-, mainElements-, affectedElements-, chunk-, dependencyElement-State
			
		*/
		//this.reactive?.disconnect();
		// this.reactive = listenForChange({
		// 	recalcAll: (newInput) => this.prepareInput(newInput),
		// 	recalcAnimations: () => this.calculateState(),
		// });
	}

	public play() {
		applyStyles(
			this.elementState,
			this.styleState,
			this.chunkState,
			this.animations
		);
		console.log(this.animations);
		this.animations.forEach((waapi) => waapi.play());
	}
}
