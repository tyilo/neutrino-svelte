import { expect, test } from "vitest";
import { State, Player } from "./game";

function testSerialize(s: State) {
  let serialized = s.serialize();
  let deserialized = State.deserialize(serialized);
  let serialized2 = deserialized.serialize();

  expect(serialized).toBe(serialized2);
}

const testState = State.fromArray(Player.Black, false, [
  "B.BBB",
  "NB...",
  ".....",
  "....W",
  "WWWW.",
]);

test("Serialize", () => {
  testSerialize(new State());
  testSerialize(testState);
});

test("Representation", () => {
  expect(new State().serialize()).toBe(BigInt("0x554000c000aa8").toString());
  expect(testState.serialize()).toBe(BigInt("0x155000000ba8a").toString());
});

test("Valid moves", () => {
  const EXPECTED_UNIQUE_STATES = [1, 8, 95, 197, 1950, 3701];

  let set = new Set<string>();
  set.add(new State().serialize());

  for (let expected of EXPECTED_UNIQUE_STATES) {
    if (expected === 1) continue;

    let newSet = new Set<string>();
    for (let serialized of set) {
      const s = State.deserialize(serialized);
      for (let s2 of s.getValidNextStates()) {
        newSet.add(s2.serialize());
      }
    }

    set = newSet;
    expect(set.size).toBe(expected);
  }
});
