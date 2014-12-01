var meshers = {
	'greedy': require('./meshers/greedy_tri.js').mesher,
}

var CEWBS = {};
CEWBS.Util = require('./helpers/util.js');

CEWBS.version = '%VERSION%';

CEWBS.VoxelMesh = function(name, scene) {
	BABYLON.Mesh.call(this, name, scene);
}
CEWBS.VoxelMesh.prototype = Object.create(BABYLON.Mesh.prototype);
CEWBS.VoxelMesh.prototype.constructor = CEWBS.VoxelMesh;
CEWBS.VoxelMesh.prototype.mesher = meshers.greedy;


CEWBS.VoxelMesh.prototype.evaluateFunction = function(id, meta) {
	return !!id;
}
//Default coloring function
CEWBS.VoxelMesh.prototype.coloringFunction = function(id) {
	return [id/5, id/5, id/5];
}

//Set the voxel at x,y,z position, with the id metadata.
CEWBS.VoxelMesh.prototype.setVoxelAt = function(pos, id, meta) {
	if(this.voxelData.voxels != null) {
		if(Array.isArray(pos)) {
			this.voxelData.voxels[this.positionToIndex(pos)] = [id,meta];
			return true;
		}
	}
	
	return 'Error: please set the dimensions of the voxelData first!';
}

CEWBS.VoxelMesh.prototype.setMetaAt = function(pos, meta) {
	if(this.voxelData.voxels != null) {
		if(Array.isArray(x)) {
			var index = this.positionToIndex(pos);
			if(Array.isArray(this.voxelData.voxels[index])) {
				this.voxelData.voxels[this.positionToIndex(pos)][1] = meta;
				return true;
			}
		}
	}
	
	return 'Error: please set the dimensions of the voxelData first!';
}

//Set a collection of voxels at different positions. Each can have it's own id or use the group id.
//Useful for importing the non-raw export.
CEWBS.VoxelMesh.prototype.setVoxelBatch = function(voxels, id, meta) {
	for(var i = 0; i < voxels.length; i++) {
		var voxel = voxels[i];
		if(voxel.length < 4 && meta != null) {
			this.setVoxelAt(voxel, id, meta);
		} else if (voxel.length < 5 && meta != null) {
			this.setVoxelAt(voxel, voxel[3], meta);
		} else {
			this.setVoxelAt(voxel, voxel[3], voxel[4]);
		}
	}
}

//Returns the voxel id at coordinates pos [x,y,z].
CEWBS.VoxelMesh.prototype.getVoxelAt = function(pos) {
	if(this.voxelData.voxels != null) {
		return this.voxelData.voxels[this.positionToIndex(pos)];
	} else {
		return 'Error: please set the dimensions of the voxelData first!';
	}
}

/*Set the entire voxel volume. Should be in the form:
{
	dimensions: [x,y,z]
	voxels: [] // Length should be dimensions x*y*z
}*/
CEWBS.VoxelMesh.prototype.setVoxelData = function(voxelData) {
	this.voxelData = voxelData;
}

//Returns the entire voxel volume. 
//Warning, this is dimension-dependant, so don't try to use it in a differently-sized volume. use exportVoxelData for that.
CEWBS.VoxelMesh.prototype.getVoxelData = function() {
	return this.voxelData;
}

//Sets the dimensions of the voxel volume. Input should be ([x,y,z]);
CEWBS.VoxelMesh.prototype.setDimensions = function(dims) {
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

CEWBS.VoxelMesh.prototype.indexToPosition = function(i) {
	return [i % this.voxelData.dimensions[0], Math.floor((i / this.voxelData.dimensions[0]) % this.voxelData.dimensions[1]), Math.floor(i / (this.voxelData.dimensions[1] * this.voxelData.dimensions[0]))]
}

CEWBS.VoxelMesh.prototype.positionToIndex = function(pos) {
	return pos[0]+(pos[1]*this.voxelData.dimensions[0])+(pos[2]*this.voxelData.dimensions[0]*this.voxelData.dimensions[1]);
}

//Used to update the actual mesh after voxels have been set.
CEWBS.VoxelMesh.prototype.updateMesh = function() {
	var rawOpaqueMesh = this.mesher(this.voxelData.voxels, this.voxelData.dimensions, this.evaluateFunction, 0);
	
	var positions = [];
	var indices = [];
	var colors = [];
	var normals = [];
	
	for(var i=0; i<rawOpaqueMesh.vertices.length; ++i) {
		var q = rawOpaqueMesh.vertices[i];
		positions.push(q[0], q[1], q[2]);
	}

	for(var i=0; i<rawOpaqueMesh.faces.length; ++i) {
		var q = rawOpaqueMesh.faces[i];
		indices.push(q[2], q[1], q[0]);
		
		//Get the color for this voxel
		var color = this.coloringFunction(q[3], q[4]);
		if(color == null || color.length < 3) {
			color = [300,75,300,255];
		} else if (color.length == 3) {
			color.push(255);
		}
		
		for(var i2 = 0; i2 < 3; i2++) {
			colors[q[i2]*4] = color[0]/255;
			colors[(q[i2]*4)+1] = color[1]/255;
			colors[(q[i2]*4)+2] = color[2]/255;
			colors[(q[i2]*4)+3] = color[3]/255;
			continue;
		}
	}
	
	//Handle transparency (Broken)
	if(this.hasVertexAlpha) {
		var stride = positions.length/3;
		
		var rawTransparentMesh = this.mesher(this.voxelData.voxels, this.voxelData.dimensions, this.evaluateFunction, 1);
		
		for(var i=0; i<rawTransparentMesh.vertices.length; ++i) {
			var q = rawTransparentMesh.vertices[i];
			positions.push(q[0], q[1], q[2]);
		}
		
		for(var i=0; i<rawTransparentMesh.faces.length; ++i) {
			var q = rawTransparentMesh.faces[i];
			indices.push(q[2]+stride, q[1]+stride, q[0]+stride);
			
			//Get the color for this voxel
			var color = this.coloringFunction(q[3], q[4]);
			if(color == null || color.length < 3) {
				color = [300,75,300,255];
			} else if (color.length == 3) {
				color.push(255);
			}
			
			for(var i2 = 0; i2 < 3; i2++) {
				colors[((q[i2]+stride)*4)] = color[0]/255;
				colors[((q[i2]+stride)*4)+1] = color[1]/255;
				colors[((q[i2]+stride)*4)+2] = color[2]/255;
				colors[((q[i2]+stride)*4)+3] = color[3]/255;
				continue;
			}
		}
	}
	
	if(positions.length < 1) {
		this.isPickable = false;
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
CEWBS.VoxelMesh.prototype.originToCenterOfBounds = function(ignoreY) {
	var pivot = [
		-this.voxelData.dimensions[0]/2,
		-this.voxelData.dimensions[1]/2,
		-this.voxelData.dimensions[2]/2
	]
	
	if(ignoreY) {
		pivot[1] = 0;
	}
	
	this.setPivot(pivot);
}

//Sets the origin (pivot point) of the mesh.
CEWBS.VoxelMesh.prototype.setPivot = function(pivot) {
	var pivot = BABYLON.Matrix.Translation(pivot[0],pivot[1],pivot[2]);
	
	this.setPivotMatrix(pivot);
}

/*Exports the voxel data to a more portable form which is dimension-independent and can be more compact.
format:
{
	dimensions: [x,y,z],
	voxels: [
		[0,0,0, id, meta], //x,y,z coordinates, then the voxel id, then metadata.
		[1,1,0, id, meta],
	],
}
*/
CEWBS.VoxelMesh.prototype.exportVoxelData = function() {
	var convertedVoxels = [];
	for (var i = 0; i < this.voxelData.voxels.length; i++) {
		var voxel = this.voxelData.voxels[i];
		if (voxel != null) {
			var pos = this.indexToPosition(i);
			pos.push(voxel[0]);
			pos.push(voxel[1]);
			convertedVoxels.push(pos);
		}
	}
	return {dimensions: this.voxelData.dimensions, voxels: convertedVoxels};
}

//Import a Zoxel file into a CEWBS VoxelMesh
CEWBS.VoxelMesh.prototype.importZoxel = function(zoxelData) {
	var cewbsData = {};
	cewbsData.dimensions = [zoxelData.width, zoxelData.height, zoxelData.depth];
	
	cewbsData.voxels = JSON.parse(JSON.stringify(zoxelData.frame1));
	
	for(var i = 0; i < cewbsData.voxels.length; i++) {
		cewbsData.voxels[i][3] = cewbsData.voxels[i][3]/100;
	}
	
	this.coloringFunction = function(id) {
		return CEWBS.Util.hex2rgb((id*100).toString(16));
	}
	
	this.setDimensions(cewbsData.dimensions);
	this.setVoxelBatch(cewbsData.voxels, 0xFFFFFF, 0);
}

//Export the contents of the mesh to Zoxel format.
CEWBS.VoxelMesh.prototype.exportZoxel = function() {
	var cewbsData = this.exportVoxelData();
	var zoxelData = {};
	zoxelData.creator = "CEWBS Exporter";
	zoxelData.width = cewbsData.dimensions[0];
	zoxelData.height = cewbsData.dimensions[1];
	zoxelData.depth = cewbsData.dimensions[2];
	
	zoxelData.version = 1;
	zoxelData.frames = 1;
	
	zoxelData.frame1 = cewbsData.voxels;
	
	for(var i = 0; i < zoxelData.frame1.length; i++) {
		var hexColor = CEWBS.Util.rgb2hex(this.coloringFunction(zoxelData.frame1[i][3], zoxelData.frame1[i][4]));
		if(hexColor.length <= 6) {
			zoxelData.frame1[i][3] = parseInt(hexColor+'FF', 16);
		} else {
			zoxelData.frame1[i][3] = parseInt(hexColor, 16);
		}
	}
	
	return zoxelData;
}

//Handle Raycasting and picking to get the voxel coordinates
CEWBS.VoxelMesh.handlePick = function(pickResult) {
	var mesh = pickResult.pickedMesh;
	var point = pickResult.pickedPoint;
	
	var m = new BABYLON.Matrix();
	mesh.getWorldMatrix().invertToRef(m);
	var v = BABYLON.Vector3.TransformCoordinates(point, m);
	var x,y,z, voxel1,voxel2;
	
	var offsetX = +(v.x-v.x.toFixed(0)).toFixed(4);
	var offsetY = +(v.y-v.y.toFixed(0)).toFixed(4);
	var offsetZ = +(v.z-v.z.toFixed(0)).toFixed(4);
	
	if(offsetX == 0) {
		x = Math.round(v.x);
		y = Math.floor(v.y);
		z = Math.floor(v.z);
		if(x>=mesh.voxelData.dimensions[0]) x=mesh.voxelData.dimensions[0]-1;

		voxel1 = [x,y,z];
		voxel2 = [x-1,y,z];
	} else if (offsetY == 0) {
		x = Math.floor(v.x);
		y = Math.round(v.y);
		z = Math.floor(v.z);
		if(y>=mesh.voxelData.dimensions[1]) y=mesh.voxelData.dimensions[1]-1;

		voxel1 = [x,y,z];
		voxel2 = [x,y-1,z];
	} else if (offsetZ == 0) {
		x = Math.floor(v.x);
		y = Math.floor(v.y);
		z = Math.round(v.z);
		if(z>=mesh.voxelData.dimensions[2]) z=mesh.voxelData.dimensions[2]-1;

		voxel1 = [x,y,z];
		voxel2 = [x,y,z-1];
	}
	
	if(!mesh.getVoxelAt(voxel1)) {	
		pickResult.over = voxel1;
		pickResult.under = voxel2;
		return pickResult;
	} else {
		pickResult.over = voxel2;
		pickResult.under = voxel1;
		return pickResult;
	}
}

if(!window.CEWBS) {
	module.exports = CEWBS;
}
