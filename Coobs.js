var meshers = {
	'greedy': require('./meshers/greedy_tri.js').mesher,
	'monotone': require('./meshers/monotone.js').mesher,
}

var COOBS = {};

COOBS.VoxelMesh = BABYLON.Mesh;
COOBS.VoxelMesh.prototype.mesher = meshers.greedy;

COOBS.VoxelMesh.prototype.coloringFunction = function(id) {
	return [id/5, id/5, id/5];
}

COOBS.VoxelMesh.prototype.voxelData = {
	dimensions: [16,16,16],
	voxels: null,
}

COOBS.VoxelMesh.prototype.setMesher = function(type) {
	if(type == 'greedy') {
		this.mesher = meshers.greedy;
	} else if (type == 'monotone') {
		this.mesher = meshers.monotone;
	} else {
		return 'Error: type must be either "greedy", or "monotone".';
	}
}

COOBS.VoxelMesh.prototype.setVoxelAt = function(x,y,z, metaData) {
	if(this.voxelData.voxels != null) {
		this.voxelData.voxels[x+(y*this.voxelData.dimensions[0])+(z*this.voxelData.dimensions[0]*this.voxelData.dimensions[1])] = metaData;
	} else {
		return 'Error: please set the dimensions of the voxelData first!';
	}
}

COOBS.VoxelMesh.prototype.setVoxelBatch = function(voxels, metaData) {
	for(var i = 0; i < voxels.length; i++) {
		var voxel = voxels[i];
		if(voxel.length < 4 && metaData != null) {
			this.setVoxelAt(voxel[0], voxel[1], voxel[2], metaData);
		} else {
			this.setVoxelAt(voxel[0], voxel[1], voxel[2], voxel[3]);
		}
	}
}

COOBS.VoxelMesh.prototype.setVoxelData = function(voxelData, dimensions) {
	if(dimensions != null && dimensions.length == 3) {
		this.voxelData.dimensions = dimensions;
	}
	this.voxelData = voxelData;
}

COOBS.VoxelMesh.prototype.setDimensions = function(x,y,z) {
	this.voxelData.dimensions = [x,y,z];
	if(this.voxelData.voxels == null) {
		this.voxelData.voxels = new Array(x*y*z);
	}
}

COOBS.VoxelMesh.prototype.updateMesh = function() {
	var rawMesh = this.mesher(this.voxelData.voxels, this.voxelData.dimensions);

	var positions = [];
	var indices = [];
	var colors = [];
	var normals = [];
	
	for(var i=0; i<rawMesh.vertices.length; ++i) {
		var q = rawMesh.vertices[i];
		positions.push(q[0], q[1], q[2]);
	}

	for(var i=0; i<rawMesh.faces.length; ++i) {
		var q = rawMesh.faces[i];
		indices.push(q[2], q[1], q[0]);
		for(var i2 = 0; i2 < 3; i2++) {
			var color = this.coloringFunction(q[3]);
			if(color != null) {
				colors[q[i2]*3] = color[0];
				colors[(q[i2]*3)+1] = color[1];
				colors[(q[i2]*3)+2] = color[2];
			} else {
				colors[q[i2]*3] = 1.5;
				colors[(q[i2]*3)+1] = 0.3;
				colors[(q[i2]*3)+2] = 1.5;
			}
		}
	}

	BABYLON.VertexData.ComputeNormals(positions, indices, normals);
	var vertexData = new BABYLON.VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.normals = normals;
	vertexData.colors = colors;
	vertexData.applyToMesh(this, 1);
	this._updateBoundingInfo();
}

//Utility functions
COOBS.VoxelMesh.prototype.originToCenterOfBounds = function(ignoreY) {
	var pivot = BABYLON.Matrix.Translation(-this.voxelData.dimensions[0]/2,-this.voxelData.dimensions[1]/2,-this.voxelData.dimensions[2]/2);
	
	if(ignoreY) {
		pivot = BABYLON.Matrix.Translation(-this.voxelData.dimensions[0]/2,0,-this.voxelData.dimensions[2]/2);
	}
	
	this.setPivotMatrix(pivot);
}

module.exports = COOBS;
