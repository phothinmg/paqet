import path from "node:path";
import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile, NamesSets } from "../types.js";

export default function duplicateExportExpressionHandler(
	callNameMap: NamesSets,
	importNameMap: NamesSets,
	exportNameMap: NamesSets,
	compilerOptions: ts.CompilerOptions,
): BundleHandler {
	return ({ file, content }: DepsFile): DepsFile => {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);
		const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
			const { factory } = context;

			const visitor = (node: ts.Node): ts.Node => {
				if (ts.isExportSpecifier(node)) {
					if (ts.isIdentifier(node.name)) {
						const base = node.name.text;
						let new_name: string | null = null;
						const mapping = callNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						const importMapping = importNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							exportNameMap.push({
								base,
								file: path.basename(file).split(".")[0].trim(),
								newName: mapping.newName,
							});
							new_name = mapping.newName;
						} else if (importMapping) {
							new_name = importMapping.newName;
						}
						if (new_name) {
							return factory.updateExportSpecifier(
								node,
								node.isTypeOnly,
								node.propertyName,
								factory.createIdentifier(new_name),
							);
						}
					}
				} else if (ts.isExportAssignment(node)) {
					const expr = node.expression;
					if (ts.isIdentifier(expr)) {
						const base = expr.text;
						let new_name: string | null = null;
						const mapping = callNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						const importMapping = importNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							exportNameMap.push({
								base,
								file: path.basename(file).split(".")[0].trim(),
								newName: mapping.newName,
							});
							new_name = mapping.newName;
						} else if (importMapping) {
							new_name = importMapping.newName;
						}
						if (new_name) {
							return factory.updateExportAssignment(
								node,
								node.modifiers,
								factory.createIdentifier(new_name),
							);
						}
						//%%%%
					}
				}
				return ts.visitEachChild(node, visitor, context);
			};
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
