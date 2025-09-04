import path from "node:path";
import { italic, magenta } from "@lwe8/tcolor";
import ts from "typescript";
import type { DepsFile } from "../types.js";

function checkTypes(deps: DepsFile[], compilerOptions: ts.CompilerOptions) {
	if (!compilerOptions.noCheck) {
		console.time("types checked");
		const filePaths = deps.map((i) => i.file);
		let _err = false;
		// Create program
		const program = ts.createProgram(filePaths, compilerOptions);
		// Check each file individually for immediate feedback
		for (const filePath of filePaths) {
			const sourceFile = program.getSourceFile(filePath);
			if (!sourceFile) {
				console.error(
					italic(
						magenta(
							`File not found: ${path.relative(process.cwd(), filePath)}`,
						),
					),
				);
				process.exit(1);
			}

			const diagnostics = [
				...program.getSyntacticDiagnostics(sourceFile),
				...program.getSemanticDiagnostics(sourceFile),
				...program.getDeclarationDiagnostics(sourceFile),
			];

			if (diagnostics.length > 0) {
				const formatHost: ts.FormatDiagnosticsHost = {
					getCurrentDirectory: () => process.cwd(),
					getCanonicalFileName: (fileName) => fileName,
					getNewLine: () => ts.sys.newLine,
				};
				console.error(
					magenta(
						ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
					),
				);
				_err = true;
			}
		}
		if (_err) {
			process.exit(1);
		} else {
			console.timeEnd("types checked");
			return true;
		}
	}
}

export default checkTypes;
