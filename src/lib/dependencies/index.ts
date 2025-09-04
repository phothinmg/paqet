import fs from "node:fs/promises";
import path from "node:path";
import type { DepsFile } from "../types.js";
import getDependencies from "./deps.js";

async function dependency(entry: string) {
	const root = process.cwd();
	const deps = await getDependencies(entry);
	const depFiles: DepsFile[] = [];
	for (const dep of deps.sorted) {
		const file = path.resolve(root, dep);
		const content = await fs.readFile(file, "utf8");
		depFiles.push({ file, content });
	}
	return {
		depFiles,
		messages: deps.messages,
	};
}
export default dependency;
