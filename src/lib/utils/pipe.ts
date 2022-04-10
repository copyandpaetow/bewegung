type Last<T extends any[]> = T extends [...any[], infer L] ? L : any;

export type Pipeline<
	Functions extends Array<(...args: any[]) => any>,
	Length extends number = Functions["length"]
> = Length extends 1
	? Functions
	: Functions extends [infer First, infer Second, ...infer Rest]
	? [
			First,
			...Pipeline<
				// @ts-expect-error ts-weirdness
				[(arg: ReturnType<First>) => ReturnType<Second>, ...Rest]
			>
	  ]
	: any;

export function pipe<Functions extends Array<(arg: any) => any>>(
	...functions: Pipeline<Functions>
): (arg: Parameters<Functions[0]>[0]) => ReturnType<Last<Functions>> {
	return (arg) => {
		const length = (functions as any[]).length;

		let pipeline = arg;

		for (let index = 0; index < length; index += 1) {
			const current = functions[index];

			pipeline = current(pipeline);
		}

		return pipeline;
	};
}
