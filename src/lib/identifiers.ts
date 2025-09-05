import path from "node:path";
import ts from "typescript";
import GenNames from "./genNames.js";
import transformFunction from "./transformer.js";
import type { DepsFile, NamesMap } from "./types.js";

const genIdentifier = new GenNames("I");
const genAnonymous = new GenNames("A");

const namesMatchHandler = (
	node: ts.Node,
	newName: string,
	factory: ts.NodeFactory,
) => {
	if (ts.isFunctionDeclaration(node)) {
		return factory.updateFunctionDeclaration(
			node,
			node.modifiers,
			node.asteriskToken,
			factory.createIdentifier(newName),
			node.typeParameters,
			node.parameters,
			node.type,
			node.body,
		);
		// end functions
	} else if (ts.isClassDeclaration(node)) {
		return factory.updateClassDeclaration(
			node,
			node.modifiers,
			factory.createIdentifier(newName),
			node.typeParameters,
			node.heritageClauses,
			node.members,
		);
		// end classes
	} else if (ts.isInterfaceDeclaration(node)) {
		return factory.updateInterfaceDeclaration(
			node,
			node.modifiers,
			factory.createIdentifier(newName),
			node.typeParameters,
			node.heritageClauses,
			node.members,
		);
		// end interface
	} else if (ts.isTypeAliasDeclaration(node)) {
		return factory.updateTypeAliasDeclaration(
			node,
			node.modifiers,
			factory.createIdentifier(newName),
			node.typeParameters,
			node.type,
		);
		// end type alias
	} else if (ts.isEnumDeclaration(node)) {
		return factory.updateEnumDeclaration(
			node,
			node.modifiers,
			factory.createIdentifier(newName),
			node.members,
		);
	} else if (ts.isVariableDeclaration(node)) {
		return factory.updateVariableDeclaration(
			node,
			factory.createIdentifier(newName),
			node.exclamationToken,
			node.type,
			node.initializer,
		);
	} else {
		return node;
	}
};

function IDENTIFIERS(deps: DepsFile[], compilerOptions: ts.CompilerOptions) {
	const exportNamesMap: NamesMap[] = [];
	const importNamesMap: NamesMap[] = [];
	const nameSpaceImports: { file: string; name: string }[] = [];
	//#region exports
	// I. exports
	function _export({ file, content }: DepsFile) {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);
		const fileName = path.basename(file).split(".")[0];
		const transformer: ts.TransformerFactory<ts.SourceFile> = (
			context: ts.TransformationContext,
		): ts.Transformer<ts.SourceFile> => {
			const { factory } = context;

			const visitor = (node: ts.Node) => {
				// 1. HANDLE : ExportAssignment => export default with identifier
				if (ts.isExportAssignment(node) && !node.isExportEquals) {
					const expr = node.expression;
					// make sure for is identifier
					if (ts.isIdentifier(expr)) {
						const _name = expr.text;
						const _newName = genIdentifier.setName(_name);
						exportNamesMap.push({
							base: _newName,
							file,
							short: fileName,
							oldName: _name,
						});
						return factory.updateExportAssignment(
							node,
							node.modifiers,
							factory.createIdentifier(_newName),
						);
					} else {
						// 2. HANDLE : ExportAssignment => export default anonymous
						if (ts.isArrowFunction(expr)) {
							const base = genAnonymous.setName(fileName);
							const arrowFunctionNode = factory.createArrowFunction(
								expr.modifiers,
								expr.typeParameters,
								expr.parameters,
								expr.type,
								expr.equalsGreaterThanToken,
								expr.body,
							);
							const variableDeclarationNode = factory.createVariableDeclaration(
								factory.createIdentifier(base),
								expr.exclamationToken,
								expr.type,
								arrowFunctionNode,
							);
							const variableDeclarationListNode =
								factory.createVariableDeclarationList(
									[variableDeclarationNode],
									ts.NodeFlags.Const,
								);

							const variableStatementNode = factory.createVariableStatement(
								expr.modifiers,
								variableDeclarationListNode,
							);
							const exportAssignmentNode = factory.createExportAssignment(
								undefined,
								undefined,
								factory.createIdentifier(base),
							);
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
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
						} // arrow function
						else if (ts.isObjectLiteralExpression(expr)) {
							const base = genAnonymous.setName(fileName);
							const variableDeclarationNode = factory.createVariableDeclaration(
								factory.createIdentifier(base),
								undefined,
								undefined,
								expr,
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
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
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
						} // object literal expression
						else if (ts.isArrayLiteralExpression(expr)) {
							const base = genAnonymous.setName(fileName);
							const arrayLiteralExpressionNode =
								factory.createArrayLiteralExpression(expr.elements, true);
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
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
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
						} // ArrayLiteralExpression
						else if (ts.isStringLiteral(expr)) {
							const base = genAnonymous.setName(fileName);
							const stringLiteralNode = factory.createStringLiteral(expr.text);
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
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
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
						} //StringLiteral
						else if (ts.isNumericLiteral(expr)) {
							const base = genAnonymous.setName(fileName);
							const numericLiteralNode = factory.createNumericLiteral(
								expr.text,
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
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
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
						} // NumericLiteral
					} // else identifier
				}
				// --- End ExportAssignment ---
				// 3. HANDLE : export default anonymous , function and class
				else if (
					(ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
					!node.name
				) {
					// check ist export default
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
						const base = genAnonymous.setName(fileName);
						const modifiers = node.modifiers?.filter(
							(mod) =>
								mod.kind !== ts.SyntaxKind.ExportKeyword &&
								mod.kind !== ts.SyntaxKind.DefaultKeyword,
						);
						if (ts.isFunctionDeclaration(node)) {
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
							});
							const funcDeclNode = factory.createFunctionDeclaration(
								modifiers,
								node.asteriskToken,
								factory.createIdentifier(base),
								node.typeParameters,
								node.parameters,
								node.type,
								node.body,
							);
							const exportAssignmentNode = factory.createExportAssignment(
								undefined,
								undefined,
								factory.createIdentifier(base),
							);
							return factory.updateSourceFile(
								sourceFile,
								[funcDeclNode, exportAssignmentNode],
								sourceFile.isDeclarationFile,
								sourceFile.referencedFiles,
								sourceFile.typeReferenceDirectives,
								sourceFile.hasNoDefaultLib,
								sourceFile.libReferenceDirectives,
							);
						}
						// function declare
						else if (ts.isClassDeclaration(node)) {
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
							});
							const newClassDecl = factory.createClassDeclaration(
								modifiers,
								factory.createIdentifier(base),
								node.typeParameters,
								node.heritageClauses,
								node.members,
							);
							const exportAssignmentNode = factory.createExportAssignment(
								undefined,
								undefined,
								factory.createIdentifier(base),
							);
							return factory.updateSourceFile(
								sourceFile,
								[newClassDecl, exportAssignmentNode],
								sourceFile.isDeclarationFile,
								sourceFile.referencedFiles,
								sourceFile.typeReferenceDirectives,
								sourceFile.hasNoDefaultLib,
								sourceFile.libReferenceDirectives,
							);
						}
						// class declare
					}
				}
				// ---- export default anonymous , function and class ---
				else if (
					ts.isExpressionStatement(node) &&
					ts.isBinaryExpression(node.expression) &&
					ts.isPropertyAccessExpression(node.expression.left) &&
					ts.isIdentifier(node.expression.left.expression) &&
					node.expression.left.expression.text === "module" &&
					ts.isIdentifier(node.expression.left.name) &&
					node.expression.left.name.text === "exports"
				) {
					// 4. HANDLE : module.exports with identifier
					// make sure for is identifier
					const exprRight = node.expression.right;
					if (ts.isIdentifier(exprRight)) {
						const _name = exprRight.text;
						const _newName = genIdentifier.setName(_name);
						exportNamesMap.push({
							base: _newName,
							file,
							short: fileName,
							oldName: exprRight.text,
						});
						const newBNExpr = factory.createBinaryExpression(
							node.expression.left,
							node.expression.operatorToken,
							factory.createIdentifier(_newName),
						);
						return factory.updateExpressionStatement(node, newBNExpr);
					} else {
						const base = genAnonymous.setName(fileName);
						if (ts.isFunctionExpression(exprRight)) {
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
							});
							const newFunc = factory.createFunctionDeclaration(
								exprRight.modifiers,
								exprRight.asteriskToken,
								factory.createIdentifier(base),
								exprRight.typeParameters,
								exprRight.parameters,
								exprRight.type,
								exprRight.body,
							);
							const newBNExpr = factory.createBinaryExpression(
								node.expression.left,
								node.expression.operatorToken,
								factory.createIdentifier(base),
							);
							const newExpr = factory.createExpressionStatement(newBNExpr);
							return factory.updateSourceFile(
								sourceFile,
								[newFunc, newExpr],
								sourceFile.isDeclarationFile,
								sourceFile.referencedFiles,
								sourceFile.typeReferenceDirectives,
								sourceFile.hasNoDefaultLib,
								sourceFile.libReferenceDirectives,
							);
						} // function
						if (ts.isClassExpression(exprRight)) {
							exportNamesMap.push({
								base: base,
								file,
								short: fileName,
								oldName: base,
							});
							const newClass = factory.createClassDeclaration(
								exprRight.modifiers,
								factory.createIdentifier(base),
								exprRight.typeParameters,
								exprRight.heritageClauses,
								exprRight.members,
							);
							const newBNExpr = factory.createBinaryExpression(
								node.expression.left,
								node.expression.operatorToken,
								factory.createIdentifier(base),
							);
							const newExpr = factory.createExpressionStatement(newBNExpr);
							return factory.updateSourceFile(
								sourceFile,
								[newClass, newExpr],
								sourceFile.isDeclarationFile,
								sourceFile.referencedFiles,
								sourceFile.typeReferenceDirectives,
								sourceFile.hasNoDefaultLib,
								sourceFile.libReferenceDirectives,
							);
						} // class
					} // else identifier
				}
				// ------------------------ visitor ---------------------------- //
				return ts.visitEachChild(node, visitor, context);
			};
			// ------------------------ transformer -------------------------------- //
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
		// --- handler function --- //
	}
	//#endregion
	// --------------------------------------------------------------------------------------------------------------------------//
	//#region 1st update
	// II. update first time
	function _update({ file, content }: DepsFile) {
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
			const SHORT = path.basename(sourceFile.fileName).split(".")[0];
			const FOUND = exportNamesMap.find((i) => i.short === SHORT);
			const visitor = (node: ts.Node) => {
				// ---------------------------------- //
				if (FOUND) {
					const NEW_NAME = FOUND.base;
					const OLD_NAME = FOUND.oldName;
					// -----------------------------
					if (
						(ts.isFunctionDeclaration(node) ||
							ts.isClassDeclaration(node) ||
							ts.isInterfaceDeclaration(node) ||
							ts.isTypeAliasDeclaration(node) ||
							ts.isVariableDeclaration(node) ||
							ts.isEnumDeclaration(node)) &&
						node.name &&
						ts.isIdentifier(node.name) &&
						node.name.text === OLD_NAME
					) {
						return namesMatchHandler(node, NEW_NAME, factory);
					} else if (
						ts.isCallExpression(node) &&
						ts.isIdentifier(node.expression) &&
						node.expression.text === OLD_NAME
					) {
						return factory.updateCallExpression(
							node,
							factory.createIdentifier(NEW_NAME),
							node.typeArguments,
							node.arguments,
						);
					} else if (ts.isPropertyAccessExpression(node)) {
						if (
							ts.isIdentifier(node.expression) &&
							node.expression.text === OLD_NAME
						) {
							return factory.updatePropertyAccessExpression(
								node,
								factory.createIdentifier(NEW_NAME),
								node.name,
							);
						}
					} else if (ts.isNewExpression(node)) {
						if (
							ts.isIdentifier(node.expression) &&
							node.expression.text === OLD_NAME
						) {
							return factory.updateNewExpression(
								node,
								factory.createIdentifier(NEW_NAME),
								node.typeArguments,
								node.arguments,
							);
						}
					}
				}

				// ------------------------ visitor ---------------------------- //
				return ts.visitEachChild(node, visitor, context);
			};
			// ------------------------ transformer -------------------------------- //
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
		// --- handler function --- //
	}
	// III. imports
	function _imports({ file, content }: DepsFile) {
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
			const visitor = (node: ts.Node) => {
				// 1. import foo from "./foo.js"
				if (ts.isImportDeclaration(node)) {
					const fileName = node.moduleSpecifier.getText(sourceFile);
					const _name = path.basename(fileName).split(".")[0].trim();
					const FOUND = exportNamesMap.find((i) => i.short === _name);
					if (FOUND) {
						if (
							node.importClause?.name &&
							ts.isIdentifier(node.importClause.name)
						) {
							importNamesMap.push({
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
					// 2. import * as foo from "./foo.js"
					if (
						node.importClause?.namedBindings &&
						ts.isNamespaceImport(node.importClause?.namedBindings) &&
						ts.isIdentifier(node.importClause?.namedBindings.name)
					) {
						if (fileName.startsWith("./") || fileName.startsWith("../")) {
							const name = node.importClause?.namedBindings.name.text;
							nameSpaceImports.push({ file, name });
						}
					}
				}
				// 3. const foo =  require("./foo.js")
				if (
					ts.isVariableDeclaration(node) &&
					ts.isIdentifier(node.name) &&
					node.initializer &&
					ts.isCallExpression(node.initializer) &&
					ts.isIdentifier(node.initializer.expression) &&
					node.initializer.expression.text === "require"
				) {
					const varName = node.name.text;
					const firstArg = node.initializer.arguments[0];
					if (ts.isStringLiteral(firstArg)) {
						const fileName = firstArg.text;
						const _name = path.basename(fileName).split(".")[0].trim();
						const FOUND = exportNamesMap.find(
							(i) => i.short === _name && i.base === varName,
						);
						if (FOUND) {
							importNamesMap.push({
								file,
								base: FOUND.base,
								short: FOUND.short,
								oldName: varName,
							});
							return factory.updateVariableDeclaration(
								node,
								factory.createIdentifier(FOUND.base),
								node.exclamationToken,
								node.type,
								node.initializer,
							);
						} else {
							// if not FOUND , will be namespace import
							nameSpaceImports.push({ file, name: varName });
						}
					}
				}
				// ------------------------ visitor ---------------------------- //
				return ts.visitEachChild(node, visitor, context);
			};
			// ------------------------ transformer -------------------------------- //
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
		// --- handler function --- //
	}
	// IV. update second time
	function _update2({ file, content }: DepsFile) {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);
		// update two
		const transformer: ts.TransformerFactory<ts.SourceFile> = (
			context: ts.TransformationContext,
		): ts.Transformer<ts.SourceFile> => {
			const { factory } = context;
			const found = importNamesMap.filter((i) => i.file === file);
			const visitor = (node: ts.Node) => {
				// ---------------------------------- //
				if (found.length) {
					for (const FOUND of found) {
						const NEW_NAME = FOUND.base;
						const OLD_NAME = FOUND.oldName;
						// -----------------------------
						if (
							(ts.isFunctionDeclaration(node) ||
								ts.isClassDeclaration(node) ||
								ts.isInterfaceDeclaration(node) ||
								ts.isTypeAliasDeclaration(node) ||
								ts.isVariableDeclaration(node) ||
								ts.isEnumDeclaration(node)) &&
							node.name &&
							ts.isIdentifier(node.name) &&
							node.name.text === OLD_NAME
						) {
							return namesMatchHandler(node, NEW_NAME, factory);
						} else if (
							ts.isCallExpression(node) &&
							ts.isIdentifier(node.expression) &&
							node.expression.text === OLD_NAME
						) {
							return factory.updateCallExpression(
								node,
								factory.createIdentifier(NEW_NAME),
								node.typeArguments,
								node.arguments,
							);
						} else if (ts.isPropertyAccessExpression(node)) {
							if (
								ts.isIdentifier(node.expression) &&
								node.expression.text === OLD_NAME
							) {
								return factory.updatePropertyAccessExpression(
									node,
									factory.createIdentifier(NEW_NAME),
									node.name,
								);
							}
						} else if (ts.isNewExpression(node)) {
							if (
								ts.isIdentifier(node.expression) &&
								node.expression.text === OLD_NAME
							) {
								return factory.updateNewExpression(
									node,
									factory.createIdentifier(NEW_NAME),
									node.typeArguments,
									node.arguments,
								);
							}
						}
					}
				}

				// ------------------------ visitor ---------------------------- //
				return ts.visitEachChild(node, visitor, context);
			};
			// ------------------------ transformer -------------------------------- //
			return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
		};
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
		// --- handler function --- //
	}
	deps = deps.map(_export);
	deps = deps.map(_update);
	deps = deps.map(_imports);
	deps = deps.map(_update2);
	return { deps, nameSpaceImports, importNamesMap, exportNamesMap };
}

export default IDENTIFIERS;
