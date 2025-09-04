// cSpell:disable
import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile, DuplicatesNameMap } from "../types.js";

export default function duplicateCollectHandler(
	namesMap: DuplicatesNameMap,
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
			function visitNode(
				node: ts.Node,
				isGlobalScope: boolean = true,
			): ts.Node {
				// Global declarations များကိုသာ collect လုပ်မယ်
				if (isGlobalScope) {
					// Variable statements (const, let, var)
					if (ts.isVariableStatement(node)) {
						node.declarationList.declarations.forEach((decl) => {
							if (ts.isIdentifier(decl.name)) {
								const $name = decl.name.text;
								if (!namesMap.has($name)) {
									namesMap.set($name, new Set([{ file }]));
								} else {
									// biome-ignore  lint/style/noNonNullAssertion : !namesMap.has($name) before
									namesMap.get($name)!.add({ file });
								}
							}
						});
					}
					// Function, Class, Enum, Interface, Type declarations
					else if (
						ts.isFunctionDeclaration(node) ||
						ts.isClassDeclaration(node) ||
						ts.isEnumDeclaration(node) ||
						ts.isInterfaceDeclaration(node) ||
						ts.isTypeAliasDeclaration(node)
					) {
						const $name = node.name?.text;
						if ($name) {
							if (!namesMap.has($name)) {
								namesMap.set($name, new Set([{ file }]));
							} else {
								// biome-ignore  lint/style/noNonNullAssertion : !namesMap.has($name) before
								namesMap.get($name)!.add({ file });
							}
						}
					}
				}

				// Local scope ထဲရောက်သွားတဲ့ node တွေအတွက် recursive visit
				if (
					ts.isBlock(node) ||
					ts.isFunctionDeclaration(node) ||
					ts.isFunctionExpression(node) ||
					ts.isArrowFunction(node) ||
					ts.isMethodDeclaration(node) ||
					ts.isClassDeclaration(node)
				) {
					// Local scope ထဲကို ဝင်သွားပြီဆိုတာနဲ့ isGlobalScope = false
					if (ts.isBlock(node)) {
						ts.visitNodes(node.statements, (child) => visitNode(child, false));
					} else {
						ts.forEachChild(node, (child) => {
							visitNode(child, false);
						});
					}
				} else {
					// Global scope ထဲဆက်ရှိနေတဲ့ node တွေအတွက်
					return ts.visitEachChild(
						node,
						(child) => visitNode(child, isGlobalScope),
						context,
					);
				}

				return node;
			}

			return (rootNode) => visitNode(rootNode, true) as ts.SourceFile;
		};

		const _content = transformFunction(
			transformer,
			sourceFile,
			compilerOptions,
		);

		return { file, content: _content };
	};
}
