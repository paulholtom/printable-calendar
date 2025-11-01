export interface CsvOptions {
	/**
	 * The value between fields. The default is ","
	 */
	fieldSplitter: string;
	/**
	 * The value between lines. The default is "\n"
	 */
	lineSplitter: string;
	/**
	 * The start of a sequence of characters where control characters will be ignored and added to the string. Defaults to "\"".
	 */
	escapeStart: string;
	/**
	 * The end of a sequence of characters where control characters will be ignored and added to the string. Defaults to "\"".
	 */
	escapeEnd: string;
}

/**
 * Read a CSV file.
 */
export class CsvReader {
	/**
	 * The contents of the file.
	 */
	private _contents: string;
	/**
	 * The current position in the content string.
	 */
	private _currentPosition: number;
	/**
	 * Options for how to parse this CSV
	 */
	private _options: CsvOptions;

	/**
	 * @param contents The contents of the file.
	 */
	constructor(contents: string, options?: Partial<CsvOptions>) {
		this._currentPosition = 0;
		this._contents = contents;
		this._options = Object.assign(
			{
				fieldSplitter: ",",
				lineSplitter: "\n",
				escapeStart: '"',
				escapeEnd: '"',
			} satisfies CsvOptions,
			options,
		);
	}

	/**
	 * @returns The next row of the CSV contents or undefined if the end of the file has been reached.
	 */
	readNextRow(): string[] | undefined {
		if (this._currentPosition >= this._contents.length) {
			return undefined;
		}
		const row: string[] = [];
		let currentVal: string = "";
		let inEscape = false;
		while (this._currentPosition < this._contents.length) {
			if (inEscape) {
				if (
					this._contents[this._currentPosition] !=
					this._options.escapeEnd
				) {
					currentVal = currentVal.concat(
						this._contents[this._currentPosition],
					);
				} else {
					inEscape = false;
				}
				++this._currentPosition;
			} else {
				switch (this._contents[this._currentPosition]) {
					case this._options.fieldSplitter:
						row.push(currentVal.trim());
						currentVal = "";
						break;
					case this._options.lineSplitter:
						row.push(currentVal.trim());
						++this._currentPosition;
						return row;
					case this._options.escapeStart:
						inEscape = true;
						break;
					default:
						currentVal = currentVal.concat(
							this._contents[this._currentPosition],
						);
						break;
				}
				++this._currentPosition;
			}
		}

		if (this._currentPosition >= this._contents.length) {
			row.push(currentVal);
		}
		return row;
	}
}
