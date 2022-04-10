//https://github.com/gigobyte/purify/blob/master/src/Function.ts
type TupleOfLength<T extends any[]> = Extract<{ [K in keyof T]: any }, any[]>;

export type CurriedFn<TAllArgs extends any[], TReturn> = <
	TProvidedArgs extends TAllArgs extends [infer TFirstArg, ...infer TRestOfArgs]
		? [TFirstArg, ...Partial<TRestOfArgs>]
		: never
>(
	...args: TProvidedArgs
) => TProvidedArgs extends TAllArgs
	? TReturn
	: TAllArgs extends [...TupleOfLength<TProvidedArgs>, ...infer TRestOfArgs]
	? CurriedFn<TRestOfArgs, TReturn>
	: never;

export const curry = <TArgs extends any[], TReturn>(
	fn: (...args: TArgs) => TReturn
): CurriedFn<TArgs, TReturn> =>
	function currify(...args: any[]): any {
		return args.length >= fn.length
			? fn.apply(undefined, args as TArgs)
			: currify.bind(undefined, ...args);
	};
