import { expect, test } from "vitest";
import { State, Player } from "./game";

function testSerialize(s: State) {
  let serialized = s.serializeBigInt();
  let deserialized = State.deserializeBigInt(serialized);
  let serialized2 = deserialized.serializeBigInt();

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
  expect(new State().serializeBigInt()).toBe(BigInt("0x554000c000aa8"));
  expect(testState.serializeBigInt()).toBe(BigInt("0x155000000ba8a"));
});

test("Valid moves", () => {
  const EXPECTED_UNIQUE_STATES = [1, 8, 95, 197, 1950, 3701];

  let set = new Set<bigint>();
  set.add(new State().serializeBigInt());

  for (let expected of EXPECTED_UNIQUE_STATES) {
    if (expected === 1) continue;

    let newSet = new Set<bigint>();
    for (let serialized of set) {
      const s = State.deserializeBigInt(serialized);
      for (let s2 of s.getValidNextStates()) {
        newSet.add(s2.serializeBigInt());
      }
    }

    set = newSet;
    expect(set.size).toBe(expected);
  }
});
