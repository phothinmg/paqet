import ts from "typescript";
import transformFunction from "../../transformer.js";
import type { BundleHandler, DepsFile, NamesSets } from "../../types.js";

export default function anonymousCallExpressionHandler(
	exportDefaultImportNameMap: NamesSets,
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
				if (ts.isCallExpression(node)) {
					if (ts.isIdentifier(node.expression)) {
						const base = node.expression.text;
						const mapping = exportDefaultImportNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							return factory.updateCallExpression(
								node,
								factory.createIdentifier(mapping.newName),
								node.typeArguments,
								node.arguments,
							);
						}
					}
				} else if (ts.isPropertyAccessExpression(node)) {
					if (ts.isIdentifier(node.expression)) {
						const base = node.expression.text;
						const mapping = exportDefaultImportNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							return factory.updatePropertyAccessExpression(
								node,
								factory.createIdentifier(mapping.newName),
								node.name,
							);
						}
					}
				} else if (ts.isNewExpression(node)) {
					if (ts.isIdentifier(node.expression)) {
						const base = node.expression.text;
						const mapping = exportDefaultImportNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							return factory.updateNewExpression(
								node,
								factory.createIdentifier(mapping.newName),
								node.typeArguments,
								node.arguments,
							);
						}
					}
					// for export specifier it is focus on entry file
				} else if (ts.isExportSpecifier(node)) {
					if (ts.isIdentifier(node.name)) {
						const base = node.name.text;
						const mapping = exportDefaultImportNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							return factory.updateExportSpecifier(
								node,
								node.isTypeOnly,
								node.propertyName,
								factory.createIdentifier(mapping.newName),
							);
						}
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
