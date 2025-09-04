import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile } from "../types.js";

export default function removeImportExpressionHandler(
	removedStatements: string[],
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
				if (ts.isImportDeclaration(node)) {
					// --- Case 1: Import declarations
					const text = node.getText(sourceFile);
					removedStatements.push(text);
					return factory.createEmptyStatement();
				}
				//--- Case 2: Import equals declarations
				if (ts.isImportEqualsDeclaration(node)) {
					const text = node.getText(sourceFile);
					removedStatements.push(text);
					return factory.createEmptyStatement();
				}
				return ts.visitEachChild(node, visitor, context);
			}; // visitor
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		}; //transformer
		let _content = transformFunction(transformer, sourceFile, compilerOptions);
		_content = _content.replace(/^s*;\s*$/gm, "").trim();
		return { file, content: _content };
	}; //==
}
