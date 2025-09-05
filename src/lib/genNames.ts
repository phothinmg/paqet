type TokenKey = "D" | "A" | "R" | "$" | "I";

export default class GenNames {
	private _key: TokenKey;
	private _hex: boolean;
	private _$: Set<string>;
	private _count: number;
	constructor(key?: TokenKey, hex?: boolean) {
		this._key = key ?? "$";
		this._hex = hex ?? true;
		this._$ = new Set<string>();
		this._count = 0;
	}
	private createHex(input: string) {
		return Buffer.from(input).toString("hex");
	}
	setName(input: string) {
		const hex = this.createHex(input);
		const text = this._hex ? hex : input;
		let result = `${this._key}${text}${this._key}${this._$.size}`;
		if (this._$.has(result)) {
			result = `${result}${this._count}`;
		}
		this._$.add(result);
		this._count++;
		return result;
	}
}
