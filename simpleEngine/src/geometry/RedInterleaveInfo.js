"use strict";
import RedTypeSize from "../RedTypeSize.js";

export default class RedInterleaveInfo {


	constructor(attributeHint, format) {
		this['attributeHint'] = attributeHint;
		this['format'] = format;
		this['stride'] = RedTypeSize[format];
		console.log(this)
	}
}