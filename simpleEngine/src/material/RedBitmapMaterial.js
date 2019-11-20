"use strict";
import RedBitmapTexture from '../resources/RedBitmapTexture.js'
import RedTypeSize from "../RedTypeSize.js";
import RedBaseMaterial from "../base/RedBaseMaterial.js";

const vertexShaderGLSL = `
	#version 450
	${RedBaseMaterial.GLSL_SystemUniforms}
    layout(set=1,binding = 0) uniform Uniforms {
        mat4 modelMatrix;
    } uniforms;
	layout(location = 0) in vec3 position;
	layout(location = 1) in vec3 normal;
	layout(location = 2) in vec2 uv;
	layout(location = 0) out vec3 vNormal;
	layout(location = 1) out vec2 vUV;
	void main() {
		gl_Position = systemUniforms.perspectiveMTX * systemUniforms.cameraMTX * uniforms.modelMatrix* vec4(position,1.0);
		vNormal = normal;
		vUV = uv;
	}
	`;
const fragmentShaderGLSL = `
	#version 450
	layout(location = 0) in vec3 vNormal;
	layout(location = 1) in vec2 vUV;
	layout(set = 1, binding = 1) uniform sampler uSampler;
	layout(set = 1, binding = 2) uniform texture2D uDiffuseTexture;
	layout(location = 0) out vec4 outColor;
	void main() {
		vec4 diffuseColor = vec4(0.0);
		//#RedGPU#diffuseTexture# diffuseColor = texture(sampler2D(uDiffuseTexture, uSampler), vUV) ;
		outColor = diffuseColor;
	}
`;
export default class RedBitmapMaterial extends RedBaseMaterial {
	static PROGRAM_OPTION_LIST = ['diffuseTexture'];
	static uniformsBindGroupLayoutDescriptor = {
		bindings: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				type: "uniform-buffer"
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				type: "sampler"
			},
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				type: "sampled-texture"
			},
		]
	};
	static uniformBufferDescripter = {
		size: RedTypeSize.mat4,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		redStruct: [
			{offset: 0, valueName: 'localMatrix'}
		]
	};
	#redGPU;
	#diffuseTexture;

	constructor(redGPU, diffuseSrc) {
		super(redGPU, RedBitmapMaterial, vertexShaderGLSL, fragmentShaderGLSL);
		this.#redGPU = redGPU;
		this.diffuseTexture = diffuseSrc
	}

	checkTexture(texture, textureName) {
		this.bindings = null
		if (texture) {
			if(texture.GPUTexture){
				switch (textureName) {
					case 'diffuseTexture' :
						this.#diffuseTexture = texture.GPUTexture
						break
				}
				console.log(textureName, texture.GPUTexture);
				this.resetBindingInfo()
			}else{
				texture.addUpdateTarget(this, textureName)
			}

		} else {
			this.resetBindingInfo()
		}
	}

	set diffuseTexture(texture) {
		this.#diffuseTexture = null;
		this.checkTexture(texture, 'diffuseTexture')
	}

	get diffuseTexture() {
		return this.#diffuseTexture
	}

	resetBindingInfo() {
		this.bindings = null
		this.searchModules();
		this.bindings = [
			{
				binding: 0,
				resource: {
					buffer: null,
					offset: 0,
					size: this.uniformBufferDescripter.size
				}
			},
			{
				binding: 1,
				resource: this.sampler,
			},
			{
				binding: 2,
				resource: this.#diffuseTexture ? this.#diffuseTexture.createView() : this.#redGPU.state.emptyTextureView,
			}
		];
		this.setUniformBindGroupDescriptor()
		console.log(this.#diffuseTexture)
	}
}
