import { State, StateWithPlayer } from "./game";

function testSerialize(s: StateWithPlayer) {
  let serialized = s.serialize();
  let deserialized = StateWithPlayer.deserialize(serialized);
  let serialized2 = deserialized.serialize();

  expect(serialized).toBe(serialized2);
}

const testState = StateWithPlayer.fromArray("1", false, [
  "B.BBB",
  "NB...",
  ".....",
  "....W",
  "WWWW.",
]);

test("Serialize", () => {
  testSerialize(new StateWithPlayer());
  testSerialize(testState);
});

test("Representation", () => {
  expect(new StateWithPlayer().serialize()).toBe(BigInt("0x554000c000aa8"));
  expect(testState.serialize()).toBe(BigInt("0x155000000ba8a"));
});

test("Valid moves", () => {
  const EXPECTED_UNIQUE_STATES = [1, 8, 95, 197, 1950, 3701];

  let set = new Set<bigint>();
  set.add(new StateWithPlayer().serialize());

  for (let expected of EXPECTED_UNIQUE_STATES) {
    if (expected === 1) continue;

    let newSet = new Set<bigint>();
    for (let serialized of set) {
      const s = StateWithPlayer.deserialize(serialized);
      for (let s2 of s.getValidMoves()) {
        newSet.add(s2.serialize());
      }
    }

    set = newSet;
    expect(set.size).toBe(expected);
  }
});
