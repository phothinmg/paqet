export function wait(timeoutMs: number) {
	return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}
