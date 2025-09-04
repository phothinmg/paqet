import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile, NamesSets } from "../types.js";

export default function duplicateCallExpressionHandler(
	callNameMap: NamesSets,
	importNameMap: NamesSets,
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
						let new_name: string | null = null;
						const mapping = callNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						const importMapping = importNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							new_name = mapping.newName;
						} else if (importMapping) {
							new_name = importMapping.newName;
							//flag.push(new_name);
						}
						if (new_name) {
							return factory.updateCallExpression(
								node,
								factory.createIdentifier(new_name),
								node.typeArguments,
								node.arguments,
							);
						}
					}
				} else if (ts.isPropertyAccessExpression(node)) {
					if (ts.isIdentifier(node.expression)) {
						const base = node.expression.text;
						let new_name: string | null = null;
						const mapping = callNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						const importMapping = importNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							new_name = mapping.newName;
						} else if (importMapping) {
							new_name = importMapping.newName;
						}
						if (new_name) {
							return factory.updatePropertyAccessExpression(
								node,
								factory.createIdentifier(new_name),
								node.name,
							);
						}
					}
				} else if (ts.isNewExpression(node)) {
					if (ts.isIdentifier(node.expression)) {
						const base = node.expression.text;
						let new_name: string | null = null;
						const mapping = callNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						const importMapping = importNameMap.find(
							(m) => m.base === base && m.file === file,
						);
						if (mapping) {
							new_name = mapping.newName;
						} else if (importMapping) {
							new_name = importMapping.newName;
						}
						if (new_name) {
							return factory.updateNewExpression(
								node,
								factory.createIdentifier(new_name),
								node.typeArguments,
								node.arguments,
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
