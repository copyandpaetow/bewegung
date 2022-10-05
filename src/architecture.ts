/*
TODOS:
- how to include RAF in the scheduler for DOM work?

- record dimensions of all elements at timing 0 and then only filter the elements if they have the current timing 

- use a nested array stucture and keep the relationship for data by their index
- for computed data, a nested map might be better where we could check if calculations for a certain offset are already present and skip if they exists
or we could get all elemenets like new Set(secondaryElements.flat()), calculate them and then assign the calculation back to secondaryStructure

*/
