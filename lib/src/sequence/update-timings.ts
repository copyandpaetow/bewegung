import {
	NormalizedOptions,
	NormalizedProps,
	PropsWithRelativeTiming,
	PropsWithRelativeTiming2,
} from "../types";
import { execute } from "../utils/helper";

export const getTotalRuntime = (props: NormalizedProps[]) =>
	props.reduce((accumulator, current) => {
		return accumulator + current.at + current.duration;
	}, 0);

export const getRelativeTimings = (
	props: NormalizedProps[],
	totalRuntime: number
): PropsWithRelativeTiming[] => {
	let currentTime = 0;

	return props
		.map((entry) => {
			const { duration, at, ...remainingOptions } = entry;
			currentTime += at;
			const start = currentTime / totalRuntime;

			currentTime += duration;
			const end = currentTime / totalRuntime;

			return {
				...remainingOptions,
				start,
				end,
			};
		})
		.sort((a, b) => a.start - b.start);
};

export const sortRoots = <Type extends PropsWithRelativeTiming2 | NormalizedProps>(
	a: Type,
	b: Type
) => {
	if (a.root.contains(b.root)) {
		return 1;
	} else {
		return -1;
	}
};

const union = <Type>(a: Set<Type>, b: Set<Type> | Array<Type>): Set<Type> => {
	b.forEach((entry) => a.add(entry));

	return a;
};

export const separateOverlappingEntries = (props: PropsWithRelativeTiming[]) => {
	const domUpdates: PropsWithRelativeTiming2[] = [];

	const safeProps = props.map((entry) => ({
		...entry,
		callback: new Set([entry.callback]),
	}));

	for (let index = 0; index < safeProps.length; index++) {
		const entry = safeProps[index];
		const ancestorRoots = safeProps
			.filter((innerEntry) => innerEntry.root.contains(entry.root) && innerEntry !== entry)
			.sort(sortRoots); // sorted from closest to furthest

		const hasDecendentRoots = safeProps.some(
			(innerEntry) => entry.root.contains(innerEntry.root) && innerEntry !== entry
		);

		if (ancestorRoots.length === 0 && !hasDecendentRoots) {
			domUpdates.push(entry);
			safeProps.splice(index, 1);
			index = index - 1;
			continue;
		}

		if (ancestorRoots.length === 0 && hasDecendentRoots) {
			domUpdates.push(entry);
			continue;
		}

		const isHidden = ancestorRoots.some((ancestorEntry) => {
			if (entry.end <= ancestorEntry.start) {
				//this animation happens before the ancestors animation, so the ancestor needs the callback
				//union(ancestorEntry.callback, entry.callback);
				return false;
			}

			if (entry.start >= ancestorEntry.end) {
				//the ancestor animation finishes before this one starts, we just need its callback
				//union(entry.callback, ancestorEntry.callback);
				return false;
			}
			if (entry.start >= ancestorEntry.start && entry.end <= ancestorEntry.end) {
				//the ancestor animation plays in the same time as this animation, so the ancestor absorbs this animation
				union(ancestorEntry.callback, entry.callback);
				return true;
			}
			if (entry.start < ancestorEntry.start && entry.end <= ancestorEntry.end) {
				//the animation overlaps with the ancestor, but just in the end
				//union(ancestorEntry.callback, entry.callback);
				entry.end = ancestorEntry.start;
				return false;
			}

			if (entry.start >= ancestorEntry.start && entry.end > ancestorEntry.end) {
				//the animation overlaps with the ancestor, but just in the beginning
				entry.start = ancestorEntry.end;
				//union(entry.callback, ancestorEntry.callback);
				return false;
			}

			if (entry.start < ancestorEntry.start && entry.end > ancestorEntry.end) {
				//the last case would be that the root animation is shorter than the entry one and starts later but ends earlier
				//this would split the entry into two, from which we push the latter into the current array, so it gets the same treatment

				//union(ancestorEntry.callback, entry.callback);
				safeProps.splice(index, 0, { ...entry, start: ancestorEntry.end });
				entry.end = ancestorEntry.start;

				return false;
			}

			//better break if weird use cases arise
			return true;
		});

		if (isHidden) {
			continue;
		}

		domUpdates.push(entry);
	}

	return domUpdates.sort((a, b) => a.start - b.start);
};

export const revertToAbsoluteTiming = (
	props: PropsWithRelativeTiming2[],
	totalRuntime: number
): NormalizedOptions[] => {
	return props.map((entry) => {
		return {
			root: entry.root,
			easing: entry.easing,
			duration: (entry.end - entry.start) * totalRuntime,
			delay: 0,
			endDelay: 0,
			callback: () => entry.callback.forEach(execute),
			reduceMotion: false,
		};
	});
};
