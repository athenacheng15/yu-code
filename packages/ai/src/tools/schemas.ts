export * from "./edit-file/schema.js";
export * from "./grep/schema.js";
export * from "./list-files/schema.js";
export * from "./read-file/schema.js";
export * from "./write-file/schema.js";

import {
	editFileInputSchema,
	editFileOutputSchema,
} from "./edit-file/schema.js";
import {
	grepFilesInputSchema,
	grepFilesOutputSchema,
} from "./grep/schema.js";
import {
	listFilesInputSchema,
	listFilesOutputSchema,
} from "./list-files/schema.js";
import {
	readFileInputSchema,
	readFileOutputSchema,
} from "./read-file/schema.js";
import {
	writeFileInputSchema,
	writeFileOutputSchema,
} from "./write-file/schema.js";

export const toolSchemas = {
	listFiles: {
		input: listFilesInputSchema,
		output: listFilesOutputSchema,
	},
	readFile: {
		input: readFileInputSchema,
		output: readFileOutputSchema,
	},
	writeFile: {
		input: writeFileInputSchema,
		output: writeFileOutputSchema,
	},
	editFile: {
		input: editFileInputSchema,
		output: editFileOutputSchema,
	},
	grepFiles: {
		input: grepFilesInputSchema,
		output: grepFilesOutputSchema,
	},
};
