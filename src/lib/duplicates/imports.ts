import path from "node:path";
import ts from "typescript";
import transformFunction from "../transformer.js";
import type { BundleHandler, DepsFile, NamesSets } from "../types.js";
export default function duplicateImportExpressionHandler(
	exportNameMap: NamesSets,
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
				if (ts.isImportDeclaration(node)) {
					const fileName = node.moduleSpecifier.getText(sourceFile);
					const _name = path.basename(fileName).split(".")[0].trim();
					let baseNames: string[] = [];
					if (
						node.importClause?.namedBindings &&
						ts.isNamedImports(node.importClause.namedBindings)
					) {
						baseNames = node.importClause.namedBindings.elements.map((el) =>
							el.name.text.trim(),
						);
					}
					// import default expression
					if (
						node.importClause?.name &&
						ts.isIdentifier(node.importClause.name)
					) {
						const base = node.importClause.name.text.trim();
						const mapping = exportNameMap.find(
							(m) => m.base === base && m.file === _name,
						);
						if (mapping) {
							importNameMap.push({
								base: mapping.base,
								file,
								newName: mapping.newName,
							});
							const newImportClause = factory.updateImportClause(
								node.importClause,
								node.importClause.phaseModifier,
								factory.createIdentifier(mapping.newName),
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
					// import name , `import{ ... }`
					if (
						baseNames.length > 0 &&
						node.importClause &&
						node.importClause.namedBindings &&
						ts.isNamedImports(node.importClause.namedBindings)
					) {
						const updatedElements =
							node.importClause.namedBindings.elements.map((el) => {
								const mapping = exportNameMap.find(
									(m) => m.base === el.name.text.trim() && m.file === _name,
								);

								if (mapping) {
									importNameMap.push({
										base: mapping.base,
										file,
										newName: mapping.newName,
									});
									return factory.updateImportSpecifier(
										el,
										el.isTypeOnly,
										el.propertyName,
										factory.createIdentifier(mapping.newName),
									);
								}
								return el;
							});
						const newNamedImports = factory.updateNamedImports(
							node.importClause.namedBindings,
							updatedElements,
						);
						const newImportClause = factory.updateImportClause(
							node.importClause,
							node.importClause.phaseModifier,
							node.importClause.name,
							newNamedImports,
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
