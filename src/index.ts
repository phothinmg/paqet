import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { magenta } from "@lwe8/tcolor";
import risolt from "risolt";
import Anonymous from "./lib/anonymous/index.js";
import checkFileExtensionAndFormat from "./lib/checks/checkFile.js";
import checkTypes from "./lib/checks/types.js";
import getTsconfig from "./lib/compilerOptions.js";
import dependency from "./lib/dependencies/index.js";
import Duplicates from "./lib/duplicates/index.js";
import RemoveHandlers from "./lib/remove/index.js";
import type { DuplicatesNameMap, NamesSets } from "./lib/types.js";

// -------------------------------------------------------------------
interface PaqetOptions {
	tsconfigPath?: string;
	renameDuplicates?: boolean;
}
// -------------------------------------------------------------------
const wait = (time: number) =>
	new Promise((resolve) => setTimeout(resolve, time));
// --------------------------------------------------------------------

/**
 * Mini bundler for a small Typescript/Javascript ESM project from single entry file,
 * by resolving and processing its dependencies.
 *
 * @param {string} entry The path to the entry file.
 * @param {string} outDir The path to the output directory.
 * @param {PaqetOptions} [options] Options for the bundler.
 *
 * @returns {Promise<void>}
 */
async function paqet(
	entry: string,
	outDir: string,
	options?: PaqetOptions,
): Promise<void> {
	console.time("Bundle Time");
	const file_name = path.basename(entry);
	const out_dir = path.resolve(process.cwd(), outDir);
	const out_path = path.join(out_dir, file_name);
	const dependencies = await dependency(entry);
	let deps = dependencies.depFiles;
	await wait(500);
	const compilerOptions = getTsconfig(options?.tsconfigPath).options;
	// ------------------------------------
	const checks = risolt([
		[checkFileExtensionAndFormat, deps],
		[checkTypes, deps, compilerOptions],
	]);
	await checks.series();
	// -----------------------------------
	const namesMap: DuplicatesNameMap = new Map();
	const callNameMap: NamesSets = [];
	const importNameMap: NamesSets = [];
	const exportNameMap: NamesSets = [];
	const exportDefaultExportNameMap: NamesSets = [];
	const exportDefaultImportNameMap: NamesSets = [];
	let removedStatements: string[] = [];
	//-----------------------
	// order is important here
	if (options?.renameDuplicates) {
		//#region
		const duplicates = risolt([
			[Duplicates.duplicateCollectHandler, namesMap, compilerOptions],
			[
				Duplicates.duplicateUpdateHandler,
				namesMap,
				callNameMap,
				compilerOptions,
			],
			[
				Duplicates.duplicateCallExpressionHandler,
				callNameMap,
				importNameMap,
				compilerOptions,
			],
			[
				Duplicates.duplicateExportExpressionHandler,
				callNameMap,
				importNameMap,
				exportNameMap,
				compilerOptions,
			],
			[
				Duplicates.duplicateImportExpressionHandler,
				exportNameMap,
				importNameMap,
				compilerOptions,
			],
			[
				Duplicates.duplicateCallExpressionHandler,
				callNameMap,
				importNameMap,
				compilerOptions,
			],
			[
				Duplicates.duplicateExportExpressionHandler,
				callNameMap,
				importNameMap,
				exportNameMap,
				compilerOptions,
			],
		]);
		const duplicate = await duplicates.concurrent();
		for (const func of duplicate) {
			deps = deps.map(func);
		}
		//#endregion
	} else {
		//#region
		const _err = false;
		const duplicates_2 = risolt([
			[Duplicates.duplicateCollectHandler, namesMap, compilerOptions],
		]);
		const duplicate_2 = await duplicates_2.concurrent();
		deps.map(duplicate_2[0]);
		await wait(500);
		namesMap.forEach((files, name) => {
			if (files.size > 1) {
				console.warn(`Name -> ${magenta(name)} declared in multiple files :`);
				// biome-ignore lint/suspicious/useIterableCallbackReturn : just log warn
				files.forEach((f) => console.warn(`  - ${f.file}`));
			}
		});
		await wait(500);
		if (_err) {
			process.exit(1);
		}
	} //#endregion
	// ----------------------------------------------------------------------------------
	//#region
	await wait(500);
	const anonymous = risolt([
		[
			Anonymous.anonymousExportHandler,
			exportDefaultExportNameMap,
			compilerOptions,
		],
		[
			Anonymous.anonymousImportHandler,
			exportDefaultExportNameMap,
			exportDefaultImportNameMap,
			compilerOptions,
		],
		[
			Anonymous.anonymousCallExpressionHandler,
			exportDefaultImportNameMap,
			compilerOptions,
		],
	]);
	const anons = await anonymous.concurrent();
	for (const anon of anons) {
		deps = deps.map(anon);
	} //#endregion
	// --------------------------------------------------------------------------------
	//#region
	await wait(500);
	const removeImports = risolt([
		[
			RemoveHandlers.removeImportExpressionHandler,
			removedStatements,
			compilerOptions,
		],
	]);
	const removeImport = await removeImports.concurrent();
	deps = deps.map(removeImport[0]);
	// -----------------------------------------------------------------------------------------
	//#region
	const removeExports = risolt([
		[RemoveHandlers.removeExportExpressionHandler, compilerOptions],
	]);
	const removeExport = await removeExports.concurrent();
	// not remove exports from entry file
	const depsFiles = deps.slice(0, -1).map(removeExport[0]);
	const mainFile = deps.slice(-1);
	// ------------------------------------------------------------------------
	// handle : imported statements
	// filter removed statements , that not from local like `./` or `../`
	const regexp = /["']((?!\.\/|\.\.\/)[^"']+)["']/;
	removedStatements = removedStatements.filter((i) => regexp.test(i));
	removedStatements = RemoveHandlers.mergeImports(removedStatements);
	// create final content
	let content = removedStatements.join("\n").trim();
	content = `${content}\n${depsFiles
		.map((i) => i.content)
		.join("\n")}\n${mainFile.map((i) => i.content).join("\n")}`.trim();
	// ---------------------------------------------------------------------------
	await wait(1000);
	if (!existsSync(out_dir)) {
		await fs.mkdir(out_dir, { recursive: true });
	}
	await fs.writeFile(out_path, content);
	// ---------------------------------------------------------------------------
	console.timeEnd("Bundle Time");
}

export default paqet;
