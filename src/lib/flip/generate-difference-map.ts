import { calculateDimensionDifferences } from "./calculate-dimension-differences";
import { Context } from "../core/create-context";
import {
	CalculatedProperties,
	getComputedStylings,
	ReadDimensions,
} from "../core/main-read-dimensions";
import { DimensionDifferences, Flip } from "./create-flip-engine";

export const emptyNonZeroDOMRect: DOMRect = {
	width: 1,
	height: 1,
	x: 0,
	y: 0,
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	toJSON: () => undefined,
};

const emptyCalculatedProperties = (context: Context) => ({
	calculatedProperties: context.changeTimings.map((changeValue) => ({
		dimensions: emptyNonZeroDOMRect,
		styles: getComputedStylings(context.changeProperties),
		offset: changeValue,
	})),
});

export const generateDifferences =
	(
		key: HTMLElement,
		animationMap: Map<HTMLElement, ReadDimensions>,
		context: Context,
		referenceIndex: number
	) =>
	(value: ReadDimensions): Flip => {
		const parent = key.parentElement as HTMLElement;
		const parentEntry =
			animationMap.get(parent) ?? emptyCalculatedProperties(context);

		const dimensionDifferences = value.calculatedProperties.reduce(
			(
				accumulator: DimensionDifferences[],
				current: CalculatedProperties,
				_: number,
				array: CalculatedProperties[]
			) => {
				const { offset: currentOffset, ...currentData } = current;
				const { offset: referenceOffset, ...referenceData } =
					array[referenceIndex];

				const { offset: currentParentOffset, ...currentParentData } =
					parentEntry.calculatedProperties.find(
						(entry) => entry.offset === currentOffset
					) as CalculatedProperties;

				const { offset: referenceParentOffset, ...referenceParentData } =
					parentEntry.calculatedProperties.find(
						(entry) => entry.offset === referenceOffset
					) as CalculatedProperties;

				const difference = calculateDimensionDifferences(
					[currentData, referenceData],
					[currentParentData, referenceParentData],
					key
				);

				return [...accumulator, { ...difference, offset: currentOffset }];
			},
			[]
		);

		return { ...value, dimensionDifferences };
	};
