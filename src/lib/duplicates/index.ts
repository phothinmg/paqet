import duplicateCallExpressionHandler from "./callExp.js";
import duplicateCollectHandler from "./collect.js";
import duplicateExportExpressionHandler from "./export.js";
import duplicateImportExpressionHandler from "./imports.js";
import duplicateUpdateHandler from "./update.js";

//--
const Duplicates = {
	duplicateCollectHandler,
	duplicateUpdateHandler,
	duplicateCallExpressionHandler,
	duplicateExportExpressionHandler,
	duplicateImportExpressionHandler,
};

export default Duplicates;
