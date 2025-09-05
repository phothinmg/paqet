import path from "node:path";
import ts from "typescript";
import GenNames from "../../genNames.js";
import transformFunction from "../../transformer.js";
import type { BundleHandler, DepsFile, NamesMap } from "../../types.js";

const gen = new GenNames("D");
function exportDefaultInitHandler(
	Maps: NamesMap[],
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
				// ================ EXPORT DEFAULT IDENTIFIER HANDLE START ===================
				if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
					const fileName = path.basename(file).split(".")[0];
					const _name = node.expression.text;
					const _newName = gen.setName(_name);
					Maps.push({
						base: _newName,
						file,
						short: fileName,
						oldName: node.expression.text,
					});
					return factory.updateExportAssignment(
						node,
						node.modifiers,
						factory.createIdentifier(_newName),
					);
					// module.exports = Identifier Commonjs
				} else if (
					ts.isExpressionStatement(node) &&
					ts.isBinaryExpression(node.expression) &&
					ts.isPropertyAccessExpression(node.expression.left) &&
					ts.isIdentifier(node.expression.left.expression) &&
					node.expression.left.expression.text === "module" &&
					ts.isIdentifier(node.expression.left.name) &&
					node.expression.left.name.text === "exports"
				) {
					const fileName = path.basename(file).split(".")[0];
					const _name = ts.isIdentifier(node.expression.right)
						? node.expression.right.text
						: fileName;
					const _length = Maps.length + 1;
					const _newName = gen.setName(_name);
					Maps.push({
						base: _newName,
						file,
						short: fileName,
						oldName: node.expression.right.getText(),
					});
					const newBNExpr = factory.createBinaryExpression(
						node.expression.left,
						node.expression.operatorToken,
						factory.createIdentifier(_newName),
					);
					return factory.updateExpressionStatement(node, newBNExpr);
				}
				//====================================================
				return ts.visitEachChild(node, visitor, context);
			};

			// ===============================================
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };

		//=================================================
	};
	//===
}

export default exportDefaultInitHandler;
