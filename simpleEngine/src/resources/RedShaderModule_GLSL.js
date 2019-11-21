export default class RedShaderModule_GLSL {
	#redGPU;
	type;
	sourceMap;
	shaderModuleMap;

	constructor(redGPU, type, materialClass, source, programOptionList = []) {
		let tSourceMap = new Map();
		programOptionList.sort()
		let parseSource = function (optionList) {
			//[a,b]
			optionList.forEach(
				function (key, index) {
					let newList = optionList.concat();
					let tSource = source;
					newList.forEach(function (replaceKey) {
						let tReg = new RegExp(`\/\/\#RedGPU\#${replaceKey}\#`, 'gi');
						tSource = tSource.replace(tReg, '')
					})
					tSourceMap.set([materialClass.name, ...newList].join('_'), tSource);
					newList.splice(index, 1);
					parseSource(newList);
				}
			);

		};
		parseSource(programOptionList);
		tSourceMap.set(materialClass.name, source);
		this.#redGPU = redGPU;
		this.type = type;
		this.sourceMap = tSourceMap;
		this.shaderModuleMap = new Map();
		this.searchShaderModule(materialClass.name)
		console.log(this);
	}

	async searchShaderModule(key) {
		console.log('searchShaderModule', key)
		if (this.shaderModuleMap.get(key)) {
			this.shaderModule = this.shaderModuleMap.get(key);
			return this.shaderModule
		} else {
			this.shaderModuleDescriptor = {
				key: key,
				code: await this.#redGPU.glslang.compileGLSL(this.sourceMap.get(key), this.type),
				source: this.sourceMap.get(key)
			};
			this.shaderModule = await this.#redGPU.device.createShaderModule(this.shaderModuleDescriptor);
			this.shaderModuleMap.set(key, this.shaderModule)
			console.log(key, this.shaderModuleMap.get(key))
		}


	}
}