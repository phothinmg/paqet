import removeExportExpressionHandler from "./exports.js";
import removeImportExpressionHandler from "./imports.js";
import mergeImports from "./mergeImports.js";

const RemoveHandlers = {
	removeExportExpressionHandler,
	removeImportExpressionHandler,
	mergeImports,
};

export default RemoveHandlers;
