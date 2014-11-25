var meshers = {
	'greedy': require('./meshers/greedy_tri.js').mesher,
	'monotone': require('./meshers/monotone.js').mesher,
}

var COOBS = {};

COOBS.VoxelMesh = function(name, scene) {
	BABYLON.Mesh.call(this, name, scene);
}
COOBS.VoxelMesh.prototype = Object.create(BABYLON.Mesh.prototype);
COOBS.VoxelMesh.prototype.constructor = COOBS.VoxelMesh;
COOBS.VoxelMesh.prototype.mesher = meshers.greedy;

//Default coloring function
COOBS.VoxelMesh.prototype.coloringFunction = function(id) {
	return [id/5, id/5, id/5];
}

//Stores the voxel volume information
/*COOBS.VoxelMesh.prototype.voxelData = {
	dimensions: [16,16,16],
	voxels: null,
}*/

//Switch between the greedy mesher (faster) and the monotone mesher (more accurate)
COOBS.VoxelMesh.prototype.setMesher = function(type) {
	if(type == 'greedy') {
		this.mesher = meshers.greedy;
	} else if (type == 'monotone') {
		this.mesher = meshers.monotone;
	} else {
		return 'Error: type must be either "greedy", or "monotone".';
	}
}

//Set the voxel at x,y,z position, with the id metadata.
COOBS.VoxelMesh.prototype.setVoxelAt = function(x,y,z, metaData) {
	if(this.voxelData.voxels != null) {
		this.voxelData.voxels[x+(y*this.voxelData.dimensions[0])+(z*this.voxelData.dimensions[0]*this.voxelData.dimensions[1])] = metaData;
	} else {
		return 'Error: please set the dimensions of the voxelData first!';
	}
}

//Set a collection of voxels at different positions. Each can have it's own id or use the group id.
//Useful for importing the non-raw export.
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

//Returns the voxel id at coordinates x,y,z.
COOBS.VoxelMesh.prototype.getVoxelAt = function(x,y,z) {
	if(this.voxelData.voxels != null) {
		return this.voxelData.voxels[x+(y*this.voxelData.dimensions[0])+(z*this.voxelData.dimensions[0]*this.voxelData.dimensions[1])];
	} else {
		return 'Error: please set the dimensions of the voxelData first!';
	}
}

/*Set the entire voxel volume. Should be in the form:
{
	dimensions: [x,y,z]
	voxels: [] // Length should be dimensions x*y*z
}*/
COOBS.VoxelMesh.prototype.setVoxelData = function(voxelData) {
	this.voxelData = voxelData;
}

//Returns the entire voxel volume. 
//Warning, this is dimension-dependant, so don't try to use it in a differently-sized volume. use exportVoxelData for that.
COOBS.VoxelMesh.prototype.getVoxelData = function() {
	return this.voxelData;
}

//Sets the dimensions of the voxel volume. Input should be ([x,y,z]);
COOBS.VoxelMesh.prototype.setDimensions = function(dims) {
	if (Array.isArray(dims) && dims.length == 3) {
		if(this.voxelData == null) {
			this.voxelData = {};
		}
		
		this.voxelData.dimensions = dims;
		if(this.voxelData.voxels == null) {
			this.voxelData.voxels = new Array(dims[0]*dims[1]*dims[2]);
		}
	} else {
		return 'Error: dimensions must be an array [x,y,z]';
	}
}

//Used to update the actual mesh after voxels have been set.
COOBS.VoxelMesh.prototype.updateMesh = function() {
	var rawMesh = this.mesher(this.voxelData.voxels, this.voxelData.dimensions);

	var positions = [];
	var indices = [];
	var colors = [];
	var normals = [];
	
	if(rawMesh.vertices.length < 1) {
		this.isPickable = false;
	}
	
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
				colors[q[i2]*3] = color[0]/255;
				colors[(q[i2]*3)+1] = color[1]/255;
				colors[(q[i2]*3)+2] = color[2]/255;
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

//Utility functions//

//Set the origin (pivot point) of the mesh to the center of the dimensions.
//If ignoreY is true, then the y axis will remain 0.
COOBS.VoxelMesh.prototype.originToCenterOfBounds = function(ignoreY) {
	var pivotX = -this.voxelData.dimensions[0]/2;
	var pivotY = -this.voxelData.dimensions[1]/2;
	var pivotZ = -this.voxelData.dimensions[2]/2;
	
	if(ignoreY) {
		pivotY = 0;
	}
	
	this.setPivot(pivotX, pivotY, pivotZ);
}

//Sets the origin (pivot point) of the mesh.
COOBS.VoxelMesh.prototype.setPivot = function(pivotX, pivotY, pivotZ) {
	var pivot = BABYLON.Matrix.Translation(pivotX,pivotY,pivotZ);
	
	this.setPivotMatrix(pivot);
}

/*Exports the voxel data to a more portable form which is dimension-independant and can be more compact.
format:
{
	dimensions: [x,y,z],
	voxels: [
		[0,0,0, 3], //x,y,z coordinates, then the voxel id.
		[1,1,0, 1],
	],
}
*/
COOBS.VoxelMesh.prototype.exportVoxelData = function(raw) {
	var convertedVoxels = [];
	for (var i = 0; i < this.voxelData.voxels.length; i++) {
		var voxel = this.voxelData.voxels[i];
		if (voxel != null) {
			var x = i % this.voxelData.dimensions[0];
			var y = Math.floor((i / this.voxelData.dimensions[0]) % this.voxelData.dimensions[1]);
			var z = Math.floor(i / (this.voxelData.dimensions[1] * this.voxelData.dimensions[0])); 
			convertedVoxels.push([x,y,z,voxel]);
		}
	}
	return {dimensions: this.voxelData.dimensions, voxels: convertedVoxels};
}

module.exports = COOBS;
