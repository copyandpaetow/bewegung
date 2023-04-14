import { StateMachineDefinition, TransitionEntry } from "../types";

const toArray = <Value>(maybeArray: Value | Value[]): Value[] =>
	Array.isArray(maybeArray) ? maybeArray : [maybeArray];

const checkForGuards = (nextTransition: TransitionEntry, allDefinition: StateMachineDefinition) => {
	const nextDefinition = allDefinition.states[nextTransition.target];
	let nextState = nextTransition.target;

	if (!nextDefinition?.guard) {
		return nextState;
	}

	toArray(nextDefinition.guard).every((guard) => {
		const allConditionsTrue = toArray(guard.condition).every((condition) =>
			Boolean(allDefinition.guards?.[condition]())
		);
		if (allConditionsTrue) {
			return true;
		}
		nextState = guard.altTarget;
		return false;
	});

	return nextState;
};

export const createMachine = (definition: StateMachineDefinition) => {
	let state = definition.initialState;

	const callAction = (currentAction: string | string[] | undefined, payload?: any) => {
		if (!currentAction || !definition.actions) {
			return;
		}
		toArray(currentAction).forEach((action) => {
			definition.actions?.[action](payload);
		});
	};

	const machine = {
		state() {
			return state;
		},
		transition(event: string, payload?: any) {
			const currentDefinition = definition.states[state];
			const nextTransition = currentDefinition.on[event];

			if (!nextTransition) {
				return;
			}
			const nextState = checkForGuards(nextTransition, definition);
			const nextDefinition = definition.states[nextState];

			state = nextState;

			callAction(nextDefinition.action);
			callAction(currentDefinition.exit, payload);
			callAction(nextDefinition.entry, payload);

			return state;
		},
	};
	return machine;
};
