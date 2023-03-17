type PayloadFunction = (...payload: any[]) => void;

type StateMachineDefinition = Record<
	string,
	{
		actions?: {
			onEnter?: VoidFunction;
			onExit?: VoidFunction;
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
		transition(event: string, payload?: any) {
			const currentDefinition = definition[state];
			const nextTransition = currentDefinition.transitions[event];
			if (!nextTransition) {
				return;
			}
			const nextState = nextTransition.target;
			const nextDefinition = definition[nextState];

			nextTransition.action?.(payload);
			currentDefinition.actions?.onExit?.();
			nextDefinition.actions?.onEnter?.();

			state = nextState;

			return state;
		},
	};
	return machine;
};
