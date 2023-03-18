type PayloadFunction = (...payload: any[]) => Promise<void>;
type PromiseFunction = () => Promise<void>;

type StateMachineDefinition = Record<
	string,
	{
		actions?: {
			onEnter?: PromiseFunction;
			onExit?: PromiseFunction;
		};
		transitions: Record<
			string,
			{
				action?: PayloadFunction;
				target: string;
			}
		>;
	}
>;

export const createMachine = (initialState: string, definition: StateMachineDefinition) => {
	let state = initialState;

	const machine = {
		get() {
			return state;
		},
		async transition(event: string, payload?: any) {
			const currentDefinition = definition[state];
			const nextTransition = currentDefinition.transitions[event];
			if (!nextTransition) {
				return;
			}
			const nextState = nextTransition.target;
			const nextDefinition = definition[nextState];

			await nextTransition.action?.(payload);
			await currentDefinition.actions?.onExit?.();
			await nextDefinition.actions?.onEnter?.();

			state = nextState;

			return state;
		},
	};
	return machine;
};
