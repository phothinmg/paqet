import path from "node:path";
import * as process from "node:process";
import ts from "typescript";

export default function getTsconfig(customTsConfigPath?: string) {
	const root = process.cwd();
	let options = ts.getDefaultCompilerOptions();
	const configPath = customTsConfigPath
		? path.resolve(root, customTsConfigPath)
		: ts.findConfigFile(root, ts.sys.fileExists);
	if (configPath) {
		const config = ts.readConfigFile(configPath, ts.sys.readFile);
		const basePath = path.dirname(configPath);
		const parsed = ts.parseJsonConfigFileContent(
			config.config,
			ts.sys,
			basePath,
		);
		options = parsed.options;
	}
	const mergeOptions = (overwriteOptions: ts.CompilerOptions) => {
		const mergedOptions: ts.CompilerOptions = { ...options };
		for (const key of Object.keys(overwriteOptions)) {
			if (key in options) {
				mergedOptions[key] = overwriteOptions[key];
			}
		}
		return mergedOptions;
	};
	return {
		options,
		mergeOptions,
	};
}
