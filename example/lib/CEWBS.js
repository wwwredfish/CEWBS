(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var meshers = {
	'greedy': require('./meshers/greedy_tri.js').mesher,
}

var CEWBS = window.CEWBS = {};
CEWBS.Util = require('./helpers/util.js');

CEWBS.version = '0.2.5';

CEWBS.VoxelMesh = function(name, scene) {
	BABYLON.Mesh.call(this, name, scene);
	this.noVoxels = true;
	this.oldVisibility = true;

	//Set up transparent mesh
	this.transparentMesh = new BABYLON.Mesh(name+'-tsp', scene);
	this.transparentMesh.noVoxels = true;
	this.transparentMesh.oldVisibility = true;
	this.transparentMesh.hasVertexAlpha = true;
	this.transparentMesh.parent = this;
	
	this.transparentMesh.root = this;
	this.root = this;
}

CEWBS.VoxelMesh.prototype = Object.create(BABYLON.Mesh.prototype);
CEWBS.VoxelMesh.prototype.hasTransparency = false;
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
CEWBS.VoxelMesh.prototype.updateMesh = function(passID) {
		if(passID == null) passID = 0;
		
		var rawMesh = this.mesher(this.voxelData.voxels, this.voxelData.dimensions, this.evaluateFunction, passID);
		
		var indices = [];
		var colors = [];
	
		for(var i=0; i<rawMesh.faces.length; ++i) {
			var q = rawMesh.faces[i];
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
					
		var vertexData = new BABYLON.VertexData();
		vertexData.positions = rawMesh.vertices;
		vertexData.indices = indices;
		vertexData.normals = rawMesh.normals;
		vertexData.colors = colors;
		
		if(!passID) {
			if(vertexData.positions.length > 0) {
				if(this.noVoxels = true) {
					this.isVisible = this.oldVisibility;
					this.noVoxels = false;
				}
				
				vertexData.applyToMesh(this, 1);
				this._updateBoundingInfo();
				
				if(this.hasTransparency) {
					this.updateMesh(1);
				}
			} else {
				this.noVoxels = true;
				this.oldVisibility = this.isVisible;
				this.isVisible = false;
			}
		} else if (passID == 1) {
			if(vertexData.positions.length > 0) {
				if(this.transparentMesh.noVoxels = true) {
					this.transparentMesh.isVisible = this.transparentMesh.oldVisibility;
					this.transparentMesh.noVoxels = false;
				}
				vertexData.applyToMesh(this.transparentMesh, 1);
				this.transparentMesh._updateBoundingInfo();
			} else {
				this.transparentMesh.noVoxels = true;
				this.transparentMesh.oldVisibility = this.transparentMesh.isVisible;
				this.transparentMesh.isVisible = false;
			}
		}
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
	var mesh = pickResult.pickedMesh.root;
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

},{"./helpers/util.js":2,"./meshers/greedy_tri.js":3}],2:[function(require,module,exports){
var util = {};

util.toHex = function(n) {
	n = parseInt(n,10);
	if (isNaN(n)) {return "00"};
	
	n = Math.max(0,Math.min(n,255));
	return "0123456789ABCDEF".charAt((n-n%16)/16)
	+ "0123456789ABCDEF".charAt(n%16);
}

util.rgb2hex = function(rgba) {
	if(rgba.length == 3) {
		return util.toHex(rgb[0])+util.toHex(rgb[1])+util.toHex(rgb[2]);
	} else if(rgba.length == 4) {
		return util.toHex(rgb[0])+util.toHex(rgb[1])+util.toHex(rgb[2])+util.toHex(rgb[3]);
	}
}

util.hex2rgb = function(hexStr) {
	var R = parseInt((hexStr).substring(0,2),16);
	var G = parseInt((hexStr).substring(2,4),16);
	var B = parseInt((hexStr).substring(4,6),16);
	
	if(hexStr.length == 8) {
		var A = parseInt((hexStr).substring(6,8),16);
		return [R,G,B,A];
	}
	
	return [R,G,B];
}

module.exports = util;

},{}],3:[function(require,module,exports){
var GreedyMesh = (function() {
//Cache buffer internally
var mask = new Int32Array(4096);
var meta = new Array(4096);

return function(volume, dims, evaluateFunction, passID) {
  function f(i,j,k) {
    return volume[i + dims[0] * (j + dims[1] * k)];
  }
  
  var vertices = [], faces = [], normals = [];
  //Sweep over 3-axes
  for(var d=0; d<3; ++d) {
    var i, j, k, l, w, h
      , u = (d+1)%3
      , v = (d+2)%3
      , x = [0,0,0]
      , q = [0,0,0]
      , nm;
    if(mask.length < dims[u] * dims[v]) {
      mask = new Int32Array(dims[u] * dims[v]);
    }
    q[d] = 1;
    for(x[d]=-1; x[d]<dims[d]; ) {
      //Compute mask
      var n = 0;
      for(x[v]=0; x[v]<dims[v]; ++x[v])
      for(x[u]=0; x[u]<dims[u]; ++x[u], ++n) {
        var a = (0    <= x[d]      ? f(x[0],      x[1],      x[2])      : 0)
          , b = (x[d] <  dims[d]-1 ? f(x[0]+q[0], x[1]+q[1], x[2]+q[2]) : 0);
        var metaA,metaB;
        
        if(Array.isArray(a)) {metaA = a[1]; a = a[0]};
        if(Array.isArray(b)) {metaB = b[1]; b = b[0]};

        if(evaluateFunction(a, metaA, passID) === evaluateFunction(b, metaB, passID)) {
          mask[n] = 0;
          meta[n] = 0;
        } else if(evaluateFunction(a, metaA, passID)) {
          mask[n] = a;
          meta[n] = metaA;
        } else {
          mask[n] = -b;
          meta[n] = metaB;
        }
      }
      //Increment x[d]
      ++x[d];
      //Generate mesh for mask using lexicographic ordering
      n = 0;
      for(j=0; j<dims[v]; ++j)
      for(i=0; i<dims[u]; ) {
        var c = mask[n];
        var metaC = meta[n];
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
          
          nm = [0,0,0]
          nm[d] = c > 0 ? 1 : -1

          
          var vertex_count = vertices.length/3;
          vertices.push(x[0],             x[1],             x[2],
            x[0]+du[0],       x[1]+du[1],       x[2]+du[2]      ,
            x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2],
            x[0]      +dv[0], x[1]      +dv[1], x[2]      +dv[2]);

          faces.push([vertex_count, vertex_count+1, vertex_count+2, c, metaC]);
          faces.push([vertex_count, vertex_count+2, vertex_count+3, c, metaC]);

          normals.push(nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2],
            nm[0], nm[1], nm[2]);

          
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
  return { vertices: vertices, faces: faces, normals: normals };
}
})();

if(exports) {
  exports.mesher = GreedyMesh;
}

},{}]},{},[1]);
