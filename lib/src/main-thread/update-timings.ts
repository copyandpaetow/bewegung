import { NormalizedProps, PropsWithRelativeTiming, PropsWithRelativeTiming2 } from "../types";

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

export type RenderProp = {
	offset: number;
	roots: HTMLElement[];
	changes: VoidFunction[];
};

/*
for every entry we would need to know several things

- maybe we could still use the props array and reduce it? we would need to cut it for every root element
=> the callback would need to go to the root element and the current entry needs its values updated  

maybe we could get an array for the root and its trailing entries and flatten that later?

[
    {
        "root": aside,
        "start": 0,
        "end": 0.25 //dependet on "main" but happens before
    },
    {
        "root": main,
        "start": 0.25,
        "end": 0.5
    },
		{
        "root": section,
        "start": 0.375, 
        "end": 0.75 // is dependent on "main" but only parts of it overlap, so from 0.5 - 0.75 this is independent
    },
    {
        "root": div.sibling, // independet from everything
        "start": 0.5,
        "end": 1
    }
]

[
	[
		{
        "root": aside,
        "start": 0,
        "end": 0.25
    },
		{
        "root": div.sibling,
        "start": 0.5,
        "end": 1
    }
	],
	{
        "root": main,
        "start": 0.25,
        "end": 0.5
    },
		 {
        "root": section,
        "start": 0.5,
        "end": 0.75
    },
	]


*/

const sortRoots = (a: PropsWithRelativeTiming2, b: PropsWithRelativeTiming2) => {
	if (a.root.contains(b.root)) {
		return 1;
	} else {
		return -1;
	}
};

export const separateOverlappingEntries = (props: PropsWithRelativeTiming[]) => {
	const domUpdates: PropsWithRelativeTiming2[] = [];

	const safeProps = props.map((entry) => ({ ...entry, callback: [entry.callback] }));

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
			safeProps.splice(index + 1, 1);
			continue;
		}

		if (ancestorRoots.length === 0 && hasDecendentRoots) {
			domUpdates.push(entry);
			continue;
		}

		const isHidden = ancestorRoots.some((ancestorEntry) => {
			if (entry.end <= ancestorEntry.start) {
				//this animation happens before the ancestors animation
				return false;
			}

			if (entry.start >= ancestorEntry.end) {
				//the ancestor animation finishes before this one, we just need its callback
				entry.callback.push(...ancestorEntry.callback);
				return false;
			}
			if (entry.start >= ancestorEntry.start && entry.end <= ancestorEntry.end) {
				//the ancestor animation plays in the same time as this animation, so the ancestor absorbs this animation
				ancestorEntry.callback.push(...entry.callback);
				return true;
			}
			if (entry.start < ancestorEntry.start && entry.end <= ancestorEntry.end) {
				//the animation overlaps with the ancestor, but just in the end
				entry.end = ancestorEntry.start;
				return false;
			}

			if (entry.start >= ancestorEntry.start && entry.end > ancestorEntry.end) {
				//the animation overlaps with the ancestor, but just in the beginning
				entry.start = ancestorEntry.end;
				entry.callback.push(...ancestorEntry.callback);
				return false;
			}

			if (entry.start < ancestorEntry.start && entry.end > ancestorEntry.end) {
				//the last case would be that the root animation is short, starts later but ends earlier
				//this would split the entry into two, from which we push the latter into the current array, so it gets the same treatment

				ancestorEntry.callback.push(...entry.callback);
				safeProps.splice(index + 1, 0, { ...entry, start: ancestorEntry.end });
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
