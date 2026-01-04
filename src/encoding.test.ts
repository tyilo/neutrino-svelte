import { expect, test } from "vitest";
import { decodeStateList, encodeStateList } from "./encoding";
import { State } from "./game";

function testEncoding(states: State[]) {
	const encoded = encodeStateList(states);
	const decoded = decodeStateList(encoded);

	expect(states).toStrictEqual(decoded);
}

test("encoding", () => {
	const states = [];
	for (let i = 0; i < 10; i++) {
		testEncoding(states);
		states.push(new State());
	}
});
