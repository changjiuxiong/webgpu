"use strict";
import RedBaseObjectContainer from "../base/RedBaseObjectContainer.js";

export default class RedMesh extends RedBaseObjectContainer {
	#material;
	#geometry;
	#redGPU;

	constructor(redGPU, geometry, material) {
		super();
		this.#redGPU = redGPU;
		console.log(this);
		this.geometry = geometry;
		this.material = material;
	}

	get geometry() {
		return this.#geometry
	}

	set geometry(v) {
		this.#geometry = v;
		this.pipeline = null;
		this.dirtyTransform = true
	}

	get material() {
		return this.#material
	}

	set material(v) {
		this.#material = v;
		if (this.uniformBuffer) this.uniformBuffer.destroy();
		this.uniformBuffer = this.#redGPU.device.createBuffer(v.uniformBufferDescripter);
		this.uniformBuffer.uniformBufferDescripter = v.uniformBufferDescripter
		this.pipeline = null;
		this.dirtyTransform = true
	}

	createPipeline(redGPU) {
		this.uniformBindGroup = null;
		const device = redGPU.device;
		const descriptor = {
			// 레이아웃은 재질이 알고있으니 들고옴
			layout: device.createPipelineLayout(
				{
					bindGroupLayouts: [
						redGPU.systemUniformInfo.uniformBindGroupLayout,
						this.#material.uniformsBindGroupLayout
					]
				}
			),
			// 버텍스와 프레그먼트는 재질에서 들고온다.
			vertexStage: {
				module: this.#material.vShaderModule.shaderModule,
				entryPoint: 'main'
			},
			fragmentStage: {
				module: this.#material.fShaderModule.shaderModule,
				entryPoint: 'main'
			},
			// 버텍스 상태는 지오메트리가 알고있음으로 들고옴
			vertexState: this.#geometry.vertexState,
			// 컬러모드 지정하고
			colorStates: [
				{
					format: redGPU.swapChainFormat,
					alphaBlend: {
						srcFactor: "src-alpha",
						dstFactor: "one-minus-src-alpha",
						operation: "add"
					}
				}
			],
			// 드로잉 방법을 결정함
			primitiveTopology: 'triangle-list',
			depthStencilState: {
				depthWriteEnabled: true,
				depthCompare: "less",
				format: "depth24plus-stencil8",
			}
		};
		// console.log(table.get(this.#material))


		let pipeline = device.createRenderPipeline(descriptor);
		this.pipeline = pipeline;

		// console.log('파이프라인생성');
		// console.log('table', table);
		return this.pipeline
	}


}