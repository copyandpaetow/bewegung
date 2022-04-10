export const toArray = <MaybeArrayType>(
	maybeArray: MaybeArrayType | MaybeArrayType[]
): MaybeArrayType[] => (Array.isArray(maybeArray) ? maybeArray : [maybeArray]);

const getArrayElementAt =
	(index: number) =>
	<ArrayType>(array: Array<ArrayType>): ArrayType => {
		if (index === -1) {
			return array[array.length - 1];
		}
		return array[index];
	};

export const firstIn = getArrayElementAt(0);
export const lastIn = getArrayElementAt(-1);
