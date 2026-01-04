import { State } from "./game";
import { assertNonNull } from "./util";

function base64ToBytes(base64: string): Uint8Array {
	const binString = atob(base64);
	return Uint8Array.from(binString, (m) => assertNonNull(m.codePointAt(0)));
}

function bytesToBase64(bytes: Uint8Array): string {
	const binString = Array.from(bytes, (byte) =>
		String.fromCodePoint(byte),
	).join("");
	return btoa(binString);
}

export function encodeStateList(states: State[]): string {
	const array = new BigUint64Array(states.length).map((_value, i) =>
		states[i].serializeBigInt(),
	);
	return bytesToBase64(new Uint8Array(array.buffer));
}

export function decodeStateList(encoded: string): State[] {
	const bytes = base64ToBytes(encoded);
	return Array.from(new BigUint64Array(bytes.buffer), (number) =>
		State.deserializeBigInt(number),
	);
}
