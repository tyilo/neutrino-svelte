export function assertNonNull<T>(v: T | null | undefined): T {
	if (v === null) throw new Error("Value was null");
	if (v === undefined) throw new Error("Value was undefined");
	return v;
}
