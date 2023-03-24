import { Definition, StateMachineDefinition } from "./types";

const toArray = <Value>(maybeArray: Value | Value[]): Value[] =>
	Array.isArray(maybeArray) ? maybeArray : [maybeArray];

const checkForGuards = (nextDefinition: Definition, allDefinition: StateMachineDefinition) => {
	let alternative: string | undefined;

	if (!nextDefinition.guard) {
		return alternative;
	}

	toArray(nextDefinition.guard).every((guard) => {
		const allConditionsTrue = toArray(guard.condition).every((condition) =>
			Boolean(allDefinition.guards?.[condition]())
		);
		if (allConditionsTrue) {
			return true;
		}
		alternative = guard.altTarget;
		return false;
	});

	return alternative;
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
		get() {
			return state;
		},
		transition(event: string, payload?: any) {
			const currentDefinition = definition.states[state];
			const nextTransition = currentDefinition.on[event];
			console.log({ event, nextTransition });

			if (!nextTransition) {
				return;
			}
			const nextState = nextTransition.target;
			const nextDefinition = definition.states[nextState];
			const alternativeRoute = checkForGuards(nextDefinition, definition);

			if (alternativeRoute) {
				return machine.transition(alternativeRoute, payload);
			}

			state = nextState;

			callAction(nextDefinition.action);
			callAction(currentDefinition.exit, payload);
			callAction(nextDefinition.entry, payload);

			return state;
		},
	};
	return machine;
};
