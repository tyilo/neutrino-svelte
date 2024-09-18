import { expect, test } from "vitest";
import { State } from "./game";
import { encodeStateList, decodeStateList } from "./encoding";

function testEncoding(states: State[]) {
  const encoded = encodeStateList(states);
  const decoded = decodeStateList(encoded);

  expect(states).toStrictEqual(decoded);
}

test("encoding", () => {
  const states = [];
  for (var i = 0; i < 10; i++) {
    testEncoding(states);
    states.push(new State());
  }
});
