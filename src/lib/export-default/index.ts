import exportDefaultInitHandler from "./identifier/exports.js";
import exportDefaultImportsHandler from "./identifier/imports.js";
import {
	exportDefaultUpdateHandlerOne,
	exportDefaultUpdateHandlerTwo,
} from "./identifier/update.js";

const ExportDefaultResolve = {
	exportDefaultInitHandler,
	exportDefaultUpdateHandlerOne,
	exportDefaultUpdateHandlerTwo,
	exportDefaultImportsHandler,
};

export default ExportDefaultResolve;
