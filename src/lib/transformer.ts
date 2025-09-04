import ts from "typescript";

export default function transformFunction(
	transformer: ts.TransformerFactory<ts.SourceFile>,
	sourceFile: ts.SourceFile,
	compilerOptions: ts.CompilerOptions,
) {
	const transformationResult = ts.transform(
		sourceFile,
		[transformer],
		compilerOptions,
	);
	const transformedSourceFile = transformationResult.transformed[0];
	const printer = ts.createPrinter({
		newLine: ts.NewLineKind.LineFeed,
		removeComments: false,
	});
	const modifiedCode = printer.printFile(
		transformedSourceFile as ts.SourceFile,
	);
	transformationResult.dispose();
	return modifiedCode;
}
