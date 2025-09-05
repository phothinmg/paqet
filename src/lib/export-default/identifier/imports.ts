import path from "node:path";
import ts from "typescript";
import transformFunction from "../../transformer.js";
import type { BundleHandler, DepsFile, NamesMap } from "../../types.js";

function exportDefaultImportsHandler(
	exportMap: NamesMap[],
	importMap: NamesMap[],
	compilerOptions: ts.CompilerOptions,
): BundleHandler {
	return ({ file, content }: DepsFile) => {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);

		const transformer: ts.TransformerFactory<ts.SourceFile> = (
			context: ts.TransformationContext,
		): ts.Transformer<ts.SourceFile> => {
			const { factory } = context;
			const visitor = (node: ts.Node): ts.Node => {
				// ================= HANDLE : import foo from "./foo.js"
				if (ts.isImportDeclaration(node)) {
					const fileName = node.moduleSpecifier.getText(sourceFile);
					const _name = path.basename(fileName).split(".")[0].trim();
					const FOUND = exportMap.find((i) => i.short === _name);
					if (FOUND) {
						if (
							node.importClause?.name &&
							ts.isIdentifier(node.importClause.name)
						) {
							importMap.push({
								file,
								base: FOUND.base,
								short: FOUND.short,
								oldName: node.importClause.name.text,
							}); //--
							const newImportClause = factory.updateImportClause(
								node.importClause,
								node.importClause.phaseModifier,
								factory.createIdentifier(FOUND.base),
								node.importClause.namedBindings,
							);
							return factory.updateImportDeclaration(
								node,
								node.modifiers,
								newImportClause,
								node.moduleSpecifier,
								node.attributes,
							);
						}
					}
					// ================= END HANDLE : import foo from "./foo.js"
				} else if (
					// ================== HANDLE : const foo = require("./foo.js")
					ts.isVariableDeclaration(node) &&
					ts.isIdentifier(node.name) &&
					node.initializer &&
					ts.isCallExpression(node.initializer) &&
					ts.isIdentifier(node.initializer.expression) &&
					node.initializer.expression.text === "require"
				) {
					const old_name = node.name.text;
					const firstArg = node.initializer.arguments[0];
					if (ts.isStringLiteral(firstArg)) {
						const _name = path.basename(firstArg.text).split(".")[0].trim();
						const FOUND = exportMap.find((i) => i.short === _name);
						if (FOUND) {
							importMap.push({
								file,
								base: FOUND.base,
								short: FOUND.short,
								oldName: old_name,
							}); //--
							return factory.updateVariableDeclaration(
								node,
								factory.createIdentifier(FOUND.base),
								node.exclamationToken,
								node.type,
								node.initializer,
							);
						}
					}
					// ================== END HANDLE : const foo = require("./foo.js")
				}

				//=============================================
				return ts.visitEachChild(node, visitor, context);
			};
			// ======================================
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
	};
}

export default exportDefaultImportsHandler;
