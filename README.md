COOBS
=====

A Voxel Mesher for BabylonJS. Supports both Greedy And Monotone Meshing, based on http://mikolalysenko.github.io/MinecraftMeshes2/

Pardon the incredibly immature name, I was having a bout of 12-year-old-ness for some reason. (I'm 23.)

Voxel Format:
---
A voxel (when passed to the engine) must consist of an x, y, and z position (front/back, top/down, left/right) respectively, and an integer for an id. The id is used for determining which voxels are the same type and which are different, which is vital for optimizing the meshing process. ID 0 cannot be used, as it is interpereted as air.

Any additional data must be stored separately, at least for the moment.

Internally, voxels are stored as a flat array for speed, so be careful when changing the dimensions of the mesh dynamically, as it will really flip out.

**Usage (Currently only tested with node-webkit):**

Set up your scene as [normal](https://github.com/BabylonJS/Babylon.js/wiki/01---Basic-scene).
```javascript
var COOBS = require('Coobs.js');

//Create the mesh like a standard Babylon Mesh.
var voxMesh1 = new COOBS.VoxelMesh('testMesh1', scene);

//Set the bounding box of the Voxel area, !IMPORTANT! [Does not need to be cubic, can be rectangular]
voxMesh1.setDimensions(3,3,3);
```

To set voxels in the mesh, use
```javascript
//setVoxelAt(x,y,z, meta);
voxMesh1.setVoxelAt(1,1,0, 2);
```
or (Not recommended, all it does is loop over the array and call the above method.)
```javascript
//setVoxelBatch(voxelArray, meta);
voxMesh1.setVoxelBatch([
	[1,1,1],
	[2,1,0],
	[2,0,0],
	[0,0,0, 2]
], 1);
```
After changing any voxel data, rebuild the optomized mesh using
```javascript
voxMesh1.updateMesh();
```

Coloring Voxels:
---
By default, the mesher just generates greyscale colors for the voxels depending on their id. You can change this easily by modifying the mesh's `coloringFunction` property.

The coloring function is passed the voxel id, and is expected to return an array in the form of [RED, GREEN, BLUE], each value being a float ranging from 0 to 1. (Higher values work, and are effectively emmision colors.)

If a custom coloringFunction is set, but no value returned, all voxels will be a bright pink, indicating that something went wrong.

**Example coloringFunction:**
```javascript
var voxColors = [
	null, //ID 0 is air, and unused
	[1,0,0], //ID 1 is red
	[0,0,1] //ID 2 is blue
]
voxMesh1.coloringFunction = function(id) {
	return voxColors[id];
}
```

Utility:
---

Sets the pivot point of the mesh to the center of the dimensions. (Default is voxel position 0,0,0's bottom corner)
Passing a boolean argument true will ignore the Y axis.
**Example:**
```javascript
voxMesh1.originToCenterOfBounds(); //Origin of a 5x5x5 mesh becomes 2.5,2.5,2.5
voxMesh1.originToCenterOfBounds(true); //Ignores the Y axis. Origin of a 5x5x5 mesh becomes 2.5,0,2.5
```


TODO:
---
**Short Term:**
* Implement Picking
* Implement Damage levels (?)

**Long Term Possibilities (Difficult due to meshing algorithms)**
* Ambient Occlusion (HARD)
* Proper Lighting (HARD)

LICENSE:
---
HAVEN'T DECIDED
