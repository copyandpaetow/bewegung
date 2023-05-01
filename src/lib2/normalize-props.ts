import { defaultOptions } from "./utils/constants";
import {
	BewegungsBlock,
	BewegungsConfig,
	ElementOrSelector,
	InternalState,
	NormalizedProps,
	NormalizedPropsWithCallbacks,
} from "./types";
import { uuid } from "./utils/element-translations";

const computeCallbacks = (props: NormalizedPropsWithCallbacks[]) => {
	const callbacks = new Map<number, VoidFunction[]>();
	const timings = new Set([0, ...props.map((entry) => entry.end)]);

	timings.forEach((currentTime) => {
		const relevantEntries = props.filter((entry) => entry.end <= currentTime);

		callbacks.set(currentTime, [...new Set(relevantEntries.map((entry) => entry.callback))]);
	});

	return callbacks;
};

const getElement = (element: ElementOrSelector) => {
	if (typeof element !== "string") {
		return element as HTMLElement;
	}
	return document.querySelector(element) as HTMLElement;
};

const makeTransferableOptions = (props: NormalizedPropsWithCallbacks[]) => {
	const options = new Map<string, NormalizedProps>();

	props.forEach((entry) => {
		const { callback, root, ...remainingOptions } = entry;
		const key = uuid("root");

		const existingRoot = root.getAttribute("bewegungs-root");
		const newRootKey = existingRoot ? existingRoot + " " + key : key;

		root.setAttribute("bewegungs-root", newRootKey);

		options.set(key, remainingOptions);
	});

	return options;
};

const getTreeStartingPoints = (props: NormalizedPropsWithCallbacks[]) => {
	const allRoots = props
		.map((entry) => entry.root)
		.sort((a, b) => {
			if (a.contains(b)) {
				return -1;
			}
			if (b.contains(a)) {
				return 1;
			}
			return 0;
		});
	const roots = new Map<string, HTMLElement>();

	allRoots.forEach((currentRoot) => {
		const isCurrentRootPartOfExistingRoot = Array.from(roots.values()).some((root) =>
			root.contains(currentRoot)
		);
		if (isCurrentRootPartOfExistingRoot) {
			return;
		}
		const key = currentRoot.getAttribute("bewegungs-root")!;
		roots.set(key, currentRoot);
	});

	return roots;
};

export const normalizeProps = (
	props: BewegungsBlock[],
	globalConfig?: Partial<BewegungsConfig>
): InternalState => {
	let totalRuntime = 0;
	let currentTime = 0;

	const normalizedProps: NormalizedPropsWithCallbacks[] = props
		.map((entry) => {
			const callback = entry?.[0] ?? entry;
			const options = entry?.[1] ?? {};

			const combinedOptions = {
				...defaultOptions,
				...(globalConfig ?? {}),
				...(options ?? {}),
			};

			totalRuntime = totalRuntime + combinedOptions.at + combinedOptions.duration;
			const root = getElement(combinedOptions.root);

			return { ...combinedOptions, callback, root };
		})
		.map((entry) => {
			const { duration, at, ...remainingOptions } = entry;

			const start = (currentTime = currentTime + at) / totalRuntime;
			const end = (currentTime = currentTime + duration) / totalRuntime;

			return {
				...remainingOptions,
				start,
				end,
			};
		});

	return {
		callbacks: computeCallbacks(normalizedProps),
		options: makeTransferableOptions(normalizedProps),
		roots: getTreeStartingPoints(normalizedProps),
		totalRuntime,
	};
};
