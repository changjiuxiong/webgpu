"use strict";
import RedBuffer from "../buffer/RedBuffer.js";
import RedGeometry from "../geometry/RedGeometry.js";
import RedInterleaveInfo from "../geometry/RedInterleaveInfo.js";

export default class RedSphere {
	#makeData = (function () {
		let thetaEnd;
		let ix, iy;
		let index;
		let grid = [];
		let a, b, c, d;
		let vertex = new Float32Array([0, 0, 0]);
		let normal = new Float32Array([0, 0, 0]);
		return function (redGPU, typeKey, radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
			thetaEnd = thetaStart + thetaLength;
			index = 0;
			grid.length = 0;
			vertex[0] = 0, vertex[1] = 0, vertex[2] = 0;
			normal[0] = 0, normal[1] = 0, normal[2] = 0;
			////////////////////////////////////////////////////////////////////////////
			// 데이터 생성!
			// buffers Data
			let interleaveData = [];
			let indexData = [];
			// generate vertices, normals and uvs
			for (iy = 0; iy <= heightSegments; iy++) {
				let verticesRow = [];
				let v = iy / heightSegments;
				for (ix = 0; ix <= widthSegments; ix++) {
					let u = ix / widthSegments;
					// vertex
					vertex.x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
					vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
					vertex.z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
					interleaveData.push(vertex.x, vertex.y, vertex.z);
					// normal
					normal[0] = vertex.x;
					normal[1] = vertex.y;
					normal[2] = vertex.z;
					vec3.normalize(normal, normal);
					interleaveData.push(normal[0], normal[1], normal[2]);
					// uv
					interleaveData.push(u, v);
					verticesRow.push(index++);
				}
				grid.push(verticesRow);
			}
			// indices
			for (iy = 0; iy < heightSegments; iy++) {
				for (ix = 0; ix < widthSegments; ix++) {
					a = grid[iy][ix + 1];
					b = grid[iy][ix];
					c = grid[iy + 1][ix];
					d = grid[iy + 1][ix + 1];
					if (iy !== 0 || thetaStart > 0) indexData.push(a, b, d);
					if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indexData.push(b, c, d);
				}
			}

			return new RedGeometry(
				redGPU,
				new RedBuffer(
					redGPU,
					`${typeKey}_interleaveBuffer`,
					RedBuffer.TYPE_VERTEX,
					new Float32Array(interleaveData),
					[
						new RedInterleaveInfo('vertexPosition', 'float3'),
						new RedInterleaveInfo('vertexNormal', 'float3'),
						new RedInterleaveInfo('texCord', 'float2')
					]
				),
				new RedBuffer(
					redGPU,
					`${typeKey}_indexBuffer`,
					RedBuffer.TYPE_INDEX,
					new Uint32Array(indexData)
				)
			)
		}
	})();

	constructor(redGPU, radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
		let typeKey;
		widthSegments = Math.max(3, Math.floor(widthSegments));
		heightSegments = Math.max(2, Math.floor(heightSegments));
		// 유일키 생성
		typeKey = [this.constructor.name, radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength].join('_');
		if (redGPU.state.RedGeometry.has(typeKey)) return redGPU.state.RedGeometry.get(typeKey);
		let tData = this.#makeData(redGPU, typeKey, radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
		this['interleaveBuffer'] = tData['interleaveBuffer'];
		this['indexBuffer'] = tData['indexBuffer'];
		this['vertexState'] = tData['vertexState'];
		redGPU.state.RedGeometry.set(typeKey, this);
		console.log(this)
	}
}