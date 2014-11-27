(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var meshers = {
	'greedy': require('./meshers/greedy_tri.js').mesher,
}

var CEWBS = window.CEWBS = {};
CEWBS.Util = require('./helpers/util.js');

CEWBS.version = '0.2.2';

CEWBS.VoxelMesh = function(name, scene) {
	BABYLON.Mesh.call(this, name, scene);
}
CEWBS.VoxelMesh.prototype = Object.create(BABYLON.Mesh.prototype);
CEWBS.VoxelMesh.prototype.constructor = CEWBS.VoxelMesh;
CEWBS.VoxelMesh.prototype.mesher = meshers.greedy;

//Default coloring function
CEWBS.VoxelMesh.prototype.coloringFunction = function(id) {
	return [id/5, id/5, id/5];
}

//Set the voxel at x,y,z position, with the id metadata.
CEWBS.VoxelMesh.prototype.setVoxelAt = function(x,y,z, metaData) {
	if(this.voxelData.voxels != null) {
		if(Array.isArray(x)) {
			this.voxelData.voxels[x[0]+(x[1]*this.voxelData.dimensions[0])+(x[2]*this.voxelData.dimensions[0]*this.voxelData.dimensions[1])] = y;
		} else {
			this.voxelData.voxels[x+(y*this.voxelData.dimensions[0])+(z*this.voxelData.dimensions[0]*this.voxelData.dimensions[1])] = metaData;
		}
	} else {
		return 'Error: please set the dimensions of the voxelData first!';
	}
}

//Set a collection of voxels at different positions. Each can have it's own id or use the group id.
//Useful for importing the non-raw export.
CEWBS.VoxelMesh.prototype.setVoxelBatch = function(voxels, metaData) {
	for(var i = 0; i < voxels.length; i++) {
		var voxel = voxels[i];
		if(voxel.length < 4 && metaData != null) {
			this.setVoxelAt(voxel, metaData);
		} else {
			this.setVoxelAt(voxel, voxel[3]);
		}
	}
}

//Returns the voxel id at coordinates x,y,z.
CEWBS.VoxelMesh.prototype.getVoxelAt = function(x,y,z) {
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

//Used to update the actual mesh after voxels have been set.
CEWBS.VoxelMesh.prototype.updateMesh = function() {
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
CEWBS.VoxelMesh.prototype.originToCenterOfBounds = function(ignoreY) {
	var pivotX = -this.voxelData.dimensions[0]/2;
	var pivotY = -this.voxelData.dimensions[1]/2;
	var pivotZ = -this.voxelData.dimensions[2]/2;
	
	if(ignoreY) {
		pivotY = 0;
	}
	
	this.setPivot(pivotX, pivotY, pivotZ);
}

//Sets the origin (pivot point) of the mesh.
CEWBS.VoxelMesh.prototype.setPivot = function(pivotX, pivotY, pivotZ) {
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
CEWBS.VoxelMesh.prototype.exportVoxelData = function() {
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

//Import a Zoxel file into a CEWBS VoxelMesh
CEWBS.VoxelMesh.prototype.importZoxel = function(zoxelData) {
	var cewbsData = {};
	cewbsData.dimensions = [zoxelData.width, zoxelData.height, zoxelData.depth];
	
	cewbsData.voxels = zoxelData.frame1;
	
	for(var i = 0; i < cewbsData.voxels.length; i++) {
		cewbsData.voxels[i][3] = parseInt(cewbsData.voxels[i][3].toString(16).substring(0,6), 16);
	}
	
	this.setDimensions(cewbsData.dimensions)
	this.setVoxelBatch(cewbsData.voxels, 0xFFFFFF);
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
		zoxelData.frame1[i][3] = parseInt(CEWBS.Util.rgb2hex(this.coloringFunction(zoxelData.frame1[i][3]))+'FF', 16);
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
	
	if(!mesh.getVoxelAt(voxel1[0],voxel1[1],voxel1[2])) {
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

},{"./helpers/util.js":2,"./meshers/greedy_tri.js":3}],2:[function(require,module,exports){
var util = {};

util.toHex = function(n) {
	n = parseInt(n,10);
	if (isNaN(n)) {return "00"};
	
	n = Math.max(0,Math.min(n,255));
	return "0123456789ABCDEF".charAt((n-n%16)/16)
	+ "0123456789ABCDEF".charAt(n%16);
}

util.rgb2hex = function(rgb) {
	return util.toHex(rgb[0])+util.toHex(rgb[1])+util.toHex(rgb[2]);
}

util.hex2rgb = function(hexStr) {
	R = parseInt((hexStr).substring(0,2),16);
	G = parseInt((hexStr).substring(2,4),16);
	B = parseInt((hexStr).substring(4,6),16);
	return [R,G,B];
}

module.exports = util;

},{}],3:[function(require,module,exports){
var GreedyMesh = (function() {
//Cache buffer internally
var mask = new Int32Array(4096);
var origMask = new Array(4096);

return function(volume, dims) {
  function f(i,j,k) {
    return volume[i + dims[0] * (j + dims[1] * k)];
  }
  //Sweep over 3-axes
  var vertices = [], faces = [];
  for(var d=0; d<3; ++d) {
    var i, j, k, l, w, h
      , u = (d+1)%3
      , v = (d+2)%3
      , x = [0,0,0]
      , q = [0,0,0];
    if(mask.length < dims[u] * dims[v]) {
      mask = new Int32Array(dims[u] * dims[v]);
    }
    q[d] = 1;
    for(x[d]=-1; x[d]<dims[d]; ) {
      //Compute mask
      var n = 0;
      for(x[v]=0; x[v]<dims[v]; ++x[v])
      for(x[u]=0; x[u]<dims[u]; ++x[u], ++n) {
		var a,b,origA,origB;
        a = origA = (0    <= x[d]      ? f(x[0],      x[1],      x[2])      : 0),
        b = origB = (x[d] <  dims[d]-1 ? f(x[0]+q[0], x[1]+q[1], x[2]+q[2]) : 0);

		if(typeof a != 'number' && a != null) {
			a = stringToChars(JSON.stringify(a));
		}
		
		if(typeof b != 'number' && b != null) {
			b = stringToChars(JSON.stringify(b));
		}

        if((!!origA) === (!!origB) ) {
          mask[n] = 0;
          origMask[n] = 0;
        } else if(!!origA) {
          mask[n] = a;
          origMask[n] = origA;
        } else {
          mask[n] = -b;
          origMask[n] = origB;
        }
      }
      //Increment x[d]
      ++x[d];
      //Generate mesh for mask using lexicographic ordering
      n = 0;
      for(j=0; j<dims[v]; ++j)
      for(i=0; i<dims[u]; ) {
        var c = mask[n];
        var origC = origMask[n];
        if(!!c) {
          //Compute width
          for(w=1; c === mask[n+w] && i+w<dims[u]; ++w) {
          }
          //Compute height (this is slightly awkward
          var done = false;
          for(h=1; j+h<dims[v]; ++h) {
            for(k=0; k<w; ++k) {
              if(c !== mask[n+k+h*dims[u]]) {
                done = true;
                break;
              }
            }
            if(done) {
              break;
            }
          }
          //Add quad
          x[u] = i;  x[v] = j;
          var du = [0,0,0]
            , dv = [0,0,0]; 
          if(c > 0) {
            dv[v] = h;
            du[u] = w;
          } else {
            c = -c;
            du[v] = h;
            dv[u] = w;
          }
          var vertex_count = vertices.length;
          vertices.push([x[0],             x[1],             x[2]            ]);
          vertices.push([x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ]);
          vertices.push([x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]);
          vertices.push([x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]]);
          faces.push([vertex_count, vertex_count+1, vertex_count+2, origC]);
          faces.push([vertex_count, vertex_count+2, vertex_count+3, origC]);
          
          //Zero-out mask
          for(l=0; l<h; ++l)
          for(k=0; k<w; ++k) {
            mask[n+k+l*dims[u]] = 0;
          }
          //Increment counters and continue
          i += w; n += w;
        } else {
          ++i;    ++n;
        }
      }
    }
  }
  return { vertices:vertices, faces:faces };
}
})();

function stringToChars(str) {
	var num = 0;
	for(var i = 0; i < str.length; i++) {
		num+=str.charCodeAt(i);
	}
	return num;
}

if(exports) {
  exports.mesher = GreedyMesh;
}

},{}]},{},[1]);
