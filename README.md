CEWBS ([Demo](http://triblade9.wc.lt/CEWBS/index.html))
=====

A Voxel Mesher for BabylonJS. Supports both Greedy And Monotone Meshing, based on http://mikolalysenko.github.io/MinecraftMeshes2/

Pardon the incredibly immature name, I was having a bout of 12-year-old-ness for some reason. (I'm 23.)

Voxel Format:
---
A voxel (when passed to the engine) must consist of an x, y, and z position (front/back, top/down, left/right) respectively, and an integer for an id. The id is used for determining which voxels are the same type and which are different, which is vital for optimizing the meshing process. ID 0 cannot be used, as it is interpereted as air.

Any additional data must be stored separately, at least for the moment.

Internally, voxels are stored as a flat array for speed, so be careful when changing the dimensions of the mesh dynamically, as it will really flip out.

**Usage:**

Include CEWBS in your HTML file, after BabylonJS and its dependencies.
```html
<script src="CEWBS.min.js"></script>
```
Or, if using node-webkit, require the commonJS version. (The meshers and helpers directories must be in the same directory as CWEBS-commonjs.js.)
```javascript
var CEWBS = require('CEWBS-commonjs.js');
```

Set up your scene as [normal](https://github.com/BabylonJS/Babylon.js/wiki/01---Basic-scene).
```javascript
//Create the mesh like a standard Babylon Mesh.
var voxMesh1 = new CEWBS.VoxelMesh('testMesh1', scene);

//Set the bounding box of the Voxel area, !IMPORTANT! [Does not need to be cubic, can be rectangular]
//If your code stops working, it's probably because you forgot to set the dimensions before anything else.
voxMesh1.setDimensions([3,3,3]);
```
All voxel meshes can be rotated, scaled, positioned, and parented without problem.

To set voxels in the mesh, use
```javascript
//setVoxelAt(x,y,z, meta); {Or ([x,y,z], meta)}
voxMesh1.setVoxelAt(1,1,0, 2);
voxMesh1.setVoxelAt([2,0,1], 3);
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

Getting Voxels:
---
To retrieve the id of a voxel at a given position, use `getVoxelAt(x,y,z)`.

You can also get the entirety of the voxel data using `getVoxelData()`.

**Example:**

```javascript
var id = voxMesh1.getVoxelAt(1,2,2);
```

Picking (Selecting the clicked voxel):
---
To get the voxel clicked on by the user, use a standard BabylonJS collision pick like so.

```javascript
window.addEventListener("click", function (evt) {
	var pickResult = scene.pick(evt.clientX, evt.clientY); //Perform a BabylonJS pick
	var mesh = pickResult.pickedMesh; //Get the mesh picked
	
	if(mesh != null && mesh instanceof CEWBS.VoxelMesh) { //Make sure it's a CEWBS voxelmesh
		var pickedVoxels = CEWBS.VoxelMesh.handlePick(pickResult); //Get the picked voxels object, which wraps pickResult
		if(evt.which == 1) {
			mesh.setVoxelAt(pickedVoxels.under, 0); //Remove the block that is pointed at.
		} else if(evt.which == 3) {
			mesh.setVoxelAt(pickedVoxels.over, 2); //Place a block over the one that is pointed at.
		}
		mesh.updateMesh(); //Update the mesh
	}
});
```
`CEWBS.VoxelMesh.handlePick(pickResult)` takes a BabylonJS pick and returns it with the additional properties
`under` and `over`, which are both arrays of x,y,and z voxel coordinates in the picked mesh.
`under` is the voxel that was picked, and `over` is the voxel adjacent to the face of the voxel that was picked.


Importing/Exporting Voxels:
---
**CEWBS Import/Export**

To copy voxels in an interchangable format that is not dependant on the dimensions, use `exportVoxelData()`, which
returns an object in the form of

```javascript
{
	dimensions: [x,y,z],
	voxels: [
		[0,0,0, 3], //x,y,z coordinates, then the voxel id.
		[1,1,0, 1],
	],
}
```
To import the format described above into a VoxelMesh, follow the procedure shown:

```javascript
voxMesh1.setDimensions(exportedData.dimensions);
voxMesh1.setVoxelBatch(exportedData.voxels, 1);
```

**[Zoxel](https://github.com/grking/zoxel) Import/Export**

*Note, transparency is not supported and is ignored.*

*Note, animations are not supported. Import/export only deals with frame 1.*

To export a Zoxel string, run `exportZoxel()` on the VoxelMesh that you wish to export. This returns a JSON string which can then be
written to a Zoxel (.zox) file.

To import Zoxel files (.zox), create your CEWBS Voxel Mesh, then run `importZoxel(zoxelData)` with Zoxel's JSON string as the argument.
This will set the voxels in your mesh, so don't use it on something you've already created.


Coloring Voxels:
---
By default, the mesher just generates grayscale colors for the voxels depending on their id. You can change this easily by modifying the mesh's `coloringFunction` property.

The coloring function is passed the voxel id, and is expected to return an array in the form of [RED, GREEN, BLUE], each value being a integer ranging from 0 to 255. (Higher values work, and are effectively emmision colors.)

If a custom coloringFunction is set, but no value returned, all voxels will be a bright pink, indicating that something went wrong.

**Example coloringFunction:**
```javascript
var voxColors = [
	null, //ID 0 is air, and unused
	[255,0,0], //ID 1 is red
	[0,0,255] //ID 2 is blue
]
voxMesh1.coloringFunction = function(id) {
	return voxColors[id];
}
```

Utility:
---

**Set center of mesh**
Sets the pivot point of the mesh to the center of the dimensions. (Default is voxel position 0,0,0's bottom corner)
Passing a boolean argument true will ignore the Y axis.
**Example:**

```javascript
voxMesh1.originToCenterOfBounds(); //Origin of a 5x5x5 mesh becomes 2.5,2.5,2.5
voxMesh1.originToCenterOfBounds(true); //Ignores the Y axis. Origin of a 5x5x5 mesh becomes 2.5,0,2.5
```

**Set the pivot point of the mesh**
Sets the pivot point of the mesh to an arbitrary point in the world space. Best called before positioning the mesh.

```javascript
voxMesh1.setPivot(x,y,z);
```

This is essentially a wrapper for

```javascript
var pivot = BABYLON.Matrix.Translation(x,y,z);
voxMesh1.setPivotMatrix(pivot);
```

and will likely be removed.

**Change mesher algorithms**
There are two meshing algorithms which can be used, greedy and monotone. (Both from http://mikolalysenko.github.io/MinecraftMeshes2/)
Default is greedy. To select one, call

```javascript
voxMesh1.setMesher('monotone'); //Or greedy.
```

then update the mesh.

TODO:
---
**Short Term:**
* ~~Implement Picking~~ DONE
* Implement Damage levels (?)

**Long Term Possibilities (Difficult due to meshing algorithms)**
* Ambient Occlusion (HARD)
* Proper Lighting (HARD)

LICENSE (MIT):
---
```
Copyright (c) 2014 Stephen Andrews, http://triblade9.wc.lt

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
