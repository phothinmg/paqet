import path from "node:path";
import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile, NamesSets } from "../types.js";
import anonymousName from "./anonymousName.js";

const prefixKey = "AnonymousName";

const genName = anonymousName().setPrefix({ key: prefixKey, value: "a_" });

/**
 * Handle anonymous(without name) default exports
 *
 *  - export default function(){} , FunctionDeclaration
 *  - export default class(){} , ClassDeclaration
 *  - export default ()=>{} , ArrowFunction
 *  - export default {} , ObjectLiteralExpression
 *  - export default [] , ArrayLiteralExpression
 *  - export default "a" , StringLiteral
 *  - export default 2 , NumericLiteral
 */
export default function anonymousExportHandler(
	exportDefaultExportNameMap: NamesSets,
	compilerOptions: ts.CompilerOptions,
): BundleHandler {
	return ({ file, content }: DepsFile): DepsFile => {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);
		/**
		 * A transformer that handles anonymous default exports by assigning them a name
		 *
		 * @param {ts.TransformationContext} context - transformation context
		 * @returns {ts.Transformer<ts.SourceFile>} - transformer
		 */
		const transformer: ts.TransformerFactory<ts.SourceFile> = (
			context: ts.TransformationContext,
		): ts.Transformer<ts.SourceFile> => {
			const { factory } = context;
			/**
			 * Visitor that handles anonymous default exports by assigning them a name
			 *
			 * @param {ts.Node} node - node to visit
			 * @returns {ts.Node} - transformed node
			 */
			const visitor = (node: ts.Node): ts.Node => {
				const fileName = path.basename(file).split(".")[0];
				if (
					(ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
					node.name === undefined
				) {
					let exp = false;
					let def = false;
					node.modifiers?.forEach((mod) => {
						if (mod.kind === ts.SyntaxKind.ExportKeyword) {
							exp = true;
						}
						if (mod.kind === ts.SyntaxKind.DefaultKeyword) {
							def = true;
						}
					});
					if (exp && def) {
						const base = genName.getName(prefixKey, fileName);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						if (ts.isFunctionDeclaration(node)) {
							return factory.updateFunctionDeclaration(
								node,
								node.modifiers,
								node.asteriskToken,
								factory.createIdentifier(base),
								node.typeParameters,
								node.parameters,
								node.type,
								node.body,
							);
						} else if (ts.isClassDeclaration(node)) {
							return factory.updateClassDeclaration(
								node,
								node.modifiers,
								factory.createIdentifier(base),
								node.typeParameters,
								node.heritageClauses,
								node.members,
							);
						}
					}
				} else if (
					ts.isExportAssignment(node) &&
					!node.name &&
					!node.isExportEquals
				) {
					if (ts.isArrowFunction(node.expression)) {
						const base = genName.getName(prefixKey, fileName);
						const arrowFunctionNode = factory.createArrowFunction(
							node.expression.modifiers,
							node.expression.typeParameters,
							node.expression.parameters,
							node.expression.type,
							node.expression.equalsGreaterThanToken,
							node.expression.body,
						);
						const variableDeclarationNode = factory.createVariableDeclaration(
							factory.createIdentifier(base),
							node.expression.exclamationToken,
							node.expression.type,
							arrowFunctionNode,
						);
						const variableDeclarationListNode =
							factory.createVariableDeclarationList(
								[variableDeclarationNode],
								ts.NodeFlags.Const,
							);

						const variableStatementNode = factory.createVariableStatement(
							node.expression.modifiers,
							variableDeclarationListNode,
						);
						const exportAssignmentNode = factory.createExportAssignment(
							undefined,
							undefined,
							factory.createIdentifier(base),
						);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						return factory.updateSourceFile(
							sourceFile,
							[variableStatementNode, exportAssignmentNode],
							sourceFile.isDeclarationFile,
							sourceFile.referencedFiles,
							sourceFile.typeReferenceDirectives,
							sourceFile.hasNoDefaultLib,
							sourceFile.libReferenceDirectives,
						);
					} else if (ts.isObjectLiteralExpression(node.expression)) {
						const base = genName.getName(prefixKey, fileName);
						const variableDeclarationNode = factory.createVariableDeclaration(
							factory.createIdentifier(base),
							undefined,
							undefined,
							node.expression,
						);
						const variableDeclarationListNode =
							factory.createVariableDeclarationList(
								[variableDeclarationNode],
								ts.NodeFlags.Const,
							);

						const variableStatementNode = factory.createVariableStatement(
							undefined,
							variableDeclarationListNode,
						);
						const exportAssignmentNode = factory.createExportAssignment(
							undefined,
							undefined,
							factory.createIdentifier(base),
						);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						return factory.updateSourceFile(
							sourceFile,
							[variableStatementNode, exportAssignmentNode],
							sourceFile.isDeclarationFile,
							sourceFile.referencedFiles,
							sourceFile.typeReferenceDirectives,
							sourceFile.hasNoDefaultLib,
							sourceFile.libReferenceDirectives,
						);
					} else if (ts.isArrayLiteralExpression(node.expression)) {
						const base = genName.getName(prefixKey, fileName);
						const arrayLiteralExpressionNode =
							factory.createArrayLiteralExpression(
								node.expression.elements,
								true,
							);
						const variableDeclarationNode = factory.createVariableDeclaration(
							factory.createIdentifier(base),
							undefined,
							undefined,
							arrayLiteralExpressionNode,
						);
						const variableDeclarationListNode =
							factory.createVariableDeclarationList(
								[variableDeclarationNode],
								ts.NodeFlags.Const,
							);

						const variableStatementNode = factory.createVariableStatement(
							undefined,
							variableDeclarationListNode,
						);
						const exportAssignmentNode = factory.createExportAssignment(
							undefined,
							undefined,
							factory.createIdentifier(base),
						);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						return factory.updateSourceFile(
							sourceFile,
							[variableStatementNode, exportAssignmentNode],
							sourceFile.isDeclarationFile,
							sourceFile.referencedFiles,
							sourceFile.typeReferenceDirectives,
							sourceFile.hasNoDefaultLib,
							sourceFile.libReferenceDirectives,
						);
					} else if (ts.isStringLiteral(node.expression)) {
						const base = genName.getName(prefixKey, fileName);
						const stringLiteralNode = factory.createStringLiteral(
							node.expression.text,
						);
						const variableDeclarationNode = factory.createVariableDeclaration(
							factory.createIdentifier(base),
							undefined,
							undefined,
							stringLiteralNode,
						);
						const variableDeclarationListNode =
							factory.createVariableDeclarationList(
								[variableDeclarationNode],
								ts.NodeFlags.Const,
							);

						const variableStatementNode = factory.createVariableStatement(
							undefined,
							variableDeclarationListNode,
						);
						const exportAssignmentNode = factory.createExportAssignment(
							undefined,
							undefined,
							factory.createIdentifier(base),
						);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						return factory.updateSourceFile(
							sourceFile,
							[variableStatementNode, exportAssignmentNode],
							sourceFile.isDeclarationFile,
							sourceFile.referencedFiles,
							sourceFile.typeReferenceDirectives,
							sourceFile.hasNoDefaultLib,
							sourceFile.libReferenceDirectives,
						);
					} else if (ts.isNumericLiteral(node.expression)) {
						const base = genName.getName(prefixKey, fileName);
						const numericLiteralNode = factory.createNumericLiteral(
							node.expression.text,
						);
						const variableDeclarationNode = factory.createVariableDeclaration(
							factory.createIdentifier(base),
							undefined,
							undefined,
							numericLiteralNode,
						);
						const variableDeclarationListNode =
							factory.createVariableDeclarationList(
								[variableDeclarationNode],
								ts.NodeFlags.Const,
							);

						const variableStatementNode = factory.createVariableStatement(
							undefined,
							variableDeclarationListNode,
						);
						const exportAssignmentNode = factory.createExportAssignment(
							undefined,
							undefined,
							factory.createIdentifier(base),
						);
						exportDefaultExportNameMap.push({
							base,
							file: fileName,
							newName: base,
							isEd: true,
						});
						return factory.updateSourceFile(
							sourceFile,
							[variableStatementNode, exportAssignmentNode],
							sourceFile.isDeclarationFile,
							sourceFile.referencedFiles,
							sourceFile.typeReferenceDirectives,
							sourceFile.hasNoDefaultLib,
							sourceFile.libReferenceDirectives,
						);
					}
				} //

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
