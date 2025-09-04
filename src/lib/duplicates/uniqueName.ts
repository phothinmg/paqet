function uniqueName() {
	const storedPrefix: Map<string, string> = new Map();

	const obj = {
		setPrefix({ key, value }: { key: string; value: string }) {
			const names: string[] = [];
			let _fix: string | undefined;

			if (storedPrefix.has(key)) {
				console.warn(`${key} already exist`);
				throw new Error();
			} else {
				_fix = value;
				storedPrefix.set(key, value);
			}
			function getName(input: string) {
				const length = names.length;
				const _name = _fix
					? `${_fix}${input}_${length + 1}`
					: `$nyein${input}_${length + 1}`;
				names.push(_name);
				return _name;
			}
			return { getName };
		},
		getPrefix(key: string) {
			if (storedPrefix.has(key)) {
				return storedPrefix.get(key);
			}
		},
	};
	return obj;
}

export default uniqueName;
