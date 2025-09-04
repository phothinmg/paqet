import ts from "typescript";
import transformFunction from "../transformer.js";
import type {
	BundleHandler,
	DepsFile,
	DuplicatesNameMap,
	NamesSets,
} from "../types.js";
import uniqueName from "./uniqueName.js";

const dupName = uniqueName().setPrefix({
	key: "DuplicatesNames",
	value: "d_",
});

export default function duplicateUpdateHandler(
	namesMap: DuplicatesNameMap,
	callNameMap: NamesSets,
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
				if (ts.isVariableStatement(node)) {
					const newDeclarations = node.declarationList.declarations.map(
						(decl) => {
							if (ts.isIdentifier(decl.name)) {
								const base = decl.name.text;
								// biome-ignore  lint/style/noNonNullAssertion : namesMap.has(base) before that get just only size
								if (namesMap.has(base) && namesMap.get(base)!.size > 1) {
									const newName = dupName.getName(base);
									callNameMap.push({ base, file, newName });
									return factory.updateVariableDeclaration(
										decl,
										factory.createIdentifier(newName),
										decl.exclamationToken,
										decl.type,
										decl.initializer,
									);
								}
							}
							return decl;
						},
					);
					const newDeclList = factory.updateVariableDeclarationList(
						node.declarationList,
						newDeclarations,
					);
					return factory.updateVariableStatement(
						node,
						node.modifiers,
						newDeclList,
					);
				} else if (ts.isFunctionDeclaration(node)) {
					if (node.name && ts.isIdentifier(node.name)) {
						const base = node.name.text;
						// biome-ignore  lint/style/noNonNullAssertion : namesMap.has(base) before that get just only size
						if (namesMap.has(base) && namesMap.get(base)!.size > 1) {
							const newName = dupName.getName(base);
							callNameMap.push({ base, file, newName });
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
						}
					}
				} else if (ts.isClassDeclaration(node)) {
					if (node.name && ts.isIdentifier(node.name)) {
						const base = node.name.text;
						// biome-ignore  lint/style/noNonNullAssertion : namesMap.has(base) before that get just only size
						if (namesMap.has(base) && namesMap.get(base)!.size > 1) {
							const newName = dupName.getName(base);
							callNameMap.push({ base, file, newName });
							return factory.updateClassDeclaration(
								node,
								node.modifiers,
								factory.createIdentifier(newName),
								node.typeParameters,
								node.heritageClauses,
								node.members,
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
