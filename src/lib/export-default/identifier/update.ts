import path from "node:path";
import ts from "typescript";
import transformFunction from "../../transformer.js";
import type { BundleHandler, DepsFile, NamesMap } from "../../types.js";

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
function exportDefaultUpdateTransformer(
	FOUND: NamesMap | undefined,
): ts.TransformerFactory<ts.SourceFile> {
	const transformer: ts.TransformerFactory<ts.SourceFile> = (
		context: ts.TransformationContext,
	): ts.Transformer<ts.SourceFile> => {
		const { factory } = context;
		const visitor = (node: ts.Node): ts.Node => {
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
				//========================================================================
			}
			// ===================================================
			return ts.visitEachChild(node, visitor, context);
		};
		//==========================================================
		return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
	};
	return transformer;
}

function exportDefaultUpdateHandlerOne(
	map: NamesMap[],
	compilerOptions: ts.CompilerOptions,
): BundleHandler {
	return ({ file, content }: DepsFile): DepsFile => {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);
		const SHORT = path.basename(sourceFile.fileName).split(".")[0];
		const FOUND = map.find((i) => i.short === SHORT);
		const transformer = exportDefaultUpdateTransformer(FOUND);
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
	};
}
function exportDefaultUpdateHandlerTwo(
	map: NamesMap[],
	compilerOptions: ts.CompilerOptions,
): BundleHandler {
	return ({ file, content }: DepsFile): DepsFile => {
		const sourceFile = ts.createSourceFile(
			file,
			content,
			ts.ScriptTarget.Latest,
			true,
		);

		const FOUND = map.find((i) => i.file === file);
		const transformer = exportDefaultUpdateTransformer(FOUND);
		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);
		return { file, content: _content };
	};
}
export { exportDefaultUpdateHandlerOne, exportDefaultUpdateHandlerTwo };
