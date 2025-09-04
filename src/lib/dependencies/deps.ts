import { yellow } from "@lwe8/tcolor";
import dependensia from "dependensia";

async function getDependencies(entry: string) {
	const deps = await dependensia(entry);
	const sorted = deps.sort();
	const messages: string[] = [];

	const circular = deps
		.mutual()
		.map((i) => `${yellow(`${i[0]} -> ${i[1]} \n ${i[1]} -> ${i[0]} \n`)}`);
	const unknown = deps.warn().map((i) => `${i}\n`);

	if (circular.length) messages.push(circular.join(""));
	if (unknown.length) messages.push(unknown.join(""));

	return {
		sorted,
		messages,
	};
}
export default getDependencies;
