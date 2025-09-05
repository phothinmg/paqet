export interface DepsFile {
	file: string;
	content: string;
}
export interface NamesSet {
	base: string;
	file: string;
	newName: string;
	isEd?: boolean;
}
export type NamesSets = NamesSet[];

export type DuplicatesNameMap = Map<string, Set<{ file: string }>>;

export type BundleHandler = ({ file, content }: DepsFile) => DepsFile;

export interface NamesMap {
	base: string;
	file: string;
	short: string;
	oldName: string;
}
