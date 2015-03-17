var Base = {
	canvas: null,
	engine: null,
	scene: null,
	first_person_camera: null,
	third_person_camera: null,
	cameraMode: 0,
	status: null,
	axisIndicator: null,
	controlEnabled: false,
	controls: [
		'G - Grab Mouse',
		'W - Forward',
		'S - Backward',
		'A - Left',
		'D - Right',
		'F - Switch flying and walking',
		'C - Switch Cameras',
	],
	Player : {},
};

Base.createScene = function() {
	if (BABYLON.Engine.isSupported()) {
		try {
			Base.canvas = document.getElementById("viewport");
			Base.engine = new BABYLON.Engine(Base.canvas, false);
			
			Base.scene = new BABYLON.Scene(Base.engine);
			Base.scene.gravity = new BABYLON.Vector3(0,-0.2,0);
			Base.scene.clearColor = new BABYLON.Color3(0.2, 0.7, 0.8);;
			Base.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
			Base.scene.fogDensity = 0.03;
			Base.scene.fogColor = new BABYLON.Color3(0.2, 0.7, 0.8);
			Base.scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.1);

			Base.first_person_camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), Base.scene);
			Base.first_person_camera.ellipsoid = new BABYLON.Vector3(0.6, 1.3, 0.6);
			Base.first_person_camera.checkCollisions = true;
			Base.first_person_camera.applyGravity = true;
			Base.first_person_camera.keysUp = [87];
			Base.first_person_camera.keysDown = [83];
			Base.first_person_camera.keysLeft = [65];
			Base.first_person_camera.keysRight = [68];
			Base.first_person_camera.speed = 1.5;
			Base.first_person_camera.inertia = 0.6;
			Base.first_person_camera.angularSensibility = 500;
		
			Base.first_person_camera.rotation.y = Math.PI;
			
			Base.third_person_camera = new BABYLON.ArcRotateCamera("camera2", 1, 0.8, 10, new BABYLON.Vector3(0, 0, 0), Base.scene);
			
			var light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), Base.scene);
			light0.diffuse = new BABYLON.Color3(1.6, 1.6, 1.2);
			light0.specular = new BABYLON.Color3(0.3, 0.3, 0.1);
			light0.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2);
			
			Base.axisIndicator = new BABYLON.Mesh('axisIndicator', Base.scene);
			
			var lineX = BABYLON.Mesh.CreateLines("linex", [
				new BABYLON.Vector3(0, 0, 0),
				new BABYLON.Vector3(1, 0, 0),
			], Base.scene);
			lineX.color = BABYLON.Color3.Red();
			lineX.parent = Base.axisIndicator;
			
			var lineY = BABYLON.Mesh.CreateLines("liney", [
				new BABYLON.Vector3(0, 0, 0),
				new BABYLON.Vector3(0, 1, 0),
			], Base.scene);
			lineY.color = BABYLON.Color3.Blue();
			lineY.parent = Base.axisIndicator;
			
			var lineZ = BABYLON.Mesh.CreateLines("linez", [
				new BABYLON.Vector3(0, 0, 0),
				new BABYLON.Vector3(0, 0, 1),
			], Base.scene);
			lineZ.color = BABYLON.Color3.Green();
			lineZ.parent = Base.axisIndicator;
			
			//Setup events
			
			document.body.addEventListener('keydown', function(evt) {
				
				//Handle Mouse Grabbing [Press G]
				if(String.fromCharCode(evt.keyCode) == 'G') {
					if(!Base.controlEnabled) {
						Base.canvas.requestPointerLock = Base.canvas.requestPointerLock || Base.canvas.msRequestPointerLock || Base.canvas.mozRequestPointerLock || Base.canvas.webkitRequestPointerLock;
						if (Base.canvas.requestPointerLock) {
							Base.canvas.requestPointerLock();
							if(Base.cameraMode == 0) {
								Base.first_person_camera.attachControl(Base.canvas, false);
							} else if (Base.cameraMode == 1) {
								Base.third_person_camera.attachControl(Base.canvas, false);
							}
							Base.controlEnabled = true;
						}
					} else {
						document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
						document.exitPointerLock();
						Base.first_person_camera.detachControl(Base.canvas);
						Base.third_person_camera.detachControl(Base.canvas);
						Base.controlEnabled = false;
					}
				
				//Toggle Walk/Fly Mode [Press F]
				} else if(String.fromCharCode(evt.keyCode) == 'F') {
					if(Base.first_person_camera.applyGravity) {
						Base.first_person_camera.applyGravity = false;
						Base.first_person_camera.speed = 5;
					} else {
						Base.first_person_camera.applyGravity = true;
						Base.first_person_camera.speed = 1.5;
					}
				//Toggle camera Modes
				} else if (String.fromCharCode(evt.keyCode) == 'C') {
					if(Base.cameraMode == 0) {
						Base.scene.activeCamera = Base.third_person_camera;
						Base.third_person_camera.attachControl(Base.canvas);
						Base.first_person_camera.detachControl(Base.canvas);
						
						for(var i = 0; i < Object.keys(Base.Player).length; i++) {
							Base.Player[Object.keys(Base.Player)[i]].isVisible = true;
						}
						
						Base.cameraMode = 1;
					} else if (Base.cameraMode == 1) {
						Base.scene.activeCamera = Base.first_person_camera;
						Base.first_person_camera.attachControl(Base.canvas);
						Base.third_person_camera.detachControl(Base.canvas);
						
						for(var i = 0; i < Object.keys(Base.Player).length; i++) {
							Base.Player[Object.keys(Base.Player)[i]].isVisible = false;
						}
						Base.Player.handl.isVisible = true;
						Base.Player.handr.isVisible = true;
						
						Base.cameraMode = 0;
					}
				}
			});
			
			Base.engine.runRenderLoop(function () {
				kd.tick();
				Base.scene.render();
			});
		
			window.addEventListener("resize", function () {
				Base.engine.resize();
			});
			
			Base.status.setText('Scene Created');
			Base.status.addClass('white');

			return true;
		} catch(e) {
			console.log(e.message);
			Base.status.setText('Error: WebGL not supported or incorrectly initialized.');
			Base.status.addClass('red');
			
			return false;
		}
	} else {
		Base.status.setText('Error: WebGL not supported or incorrectly initialized.');
		Base.status.addClass('red');
		
		return false;
	}
}

Base.createShaders = function() {
}

Base.createPlayer = function(callback) {
	$.getJSON("../../assets/body.zox", function(body) {
		Base.Player.body = new CEWBS.VoxelMesh('body1', Base.scene);
		Base.Player.body.importZoxel(body);
		Base.Player.body.originToCenterOfBounds();

		Base.Player.body.updateMesh();
		Base.Player.body.scaling = new BABYLON.Vector3(0.125,0.125,0.125);
		Base.Player.body.position = new BABYLON.Vector3(0,0,0);
		Base.Player.body.isVisible = false;
		Base.third_person_camera.target = Base.Player.body;

		var beginWalkAnim, stopWalkAnim;
		$.getJSON("../../assets/hand.zox", function(hand) {
			Base.Player.handl = new CEWBS.VoxelMesh('handl', Base.scene);
			Base.Player.handl.importZoxel(hand);
			Base.Player.handl.parent = Base.Player.body;
			Base.Player.handl.originToCenterOfBounds();
			
			Base.Player.handl.updateMesh();
			Base.Player.handl.setPivot([0,3,0]);
			Base.Player.handl.position = new BABYLON.Vector3(-5,12,6);
			Base.Player.handl.rotation.x = -4;
			Base.Player.handl.anims = {};
			
			Base.Player.handr = new CEWBS.VoxelMesh('handr', Base.scene);
			Base.Player.handr.importZoxel(hand);
			Base.Player.handr.parent = Base.Player.body;
			Base.Player.handr.originToCenterOfBounds();
			
			Base.Player.handr.updateMesh();
			Base.Player.handr.setPivot([0,3,0]);
			Base.Player.handr.position = new BABYLON.Vector3(11,12,6);
			Base.Player.handr.rotation.x = -4;
			Base.Player.handr.anims = {};
			
			var handlWalk = new BABYLON.Animation(
				"myAnimation",
				"rotation.x",
				30,
				BABYLON.Animation.ANIMATIONTYPE_FLOAT,
				BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);
			
			var keys = [];
				
			keys.push({
				frame: 0,
				value: -2,
			}, {
				frame: 5,
				value: -2.5,
			}, {
				frame: 15,
				value: -4.5,
			}, {
				frame: 25,
				value: -2.5,
			}, {
				frame: 30,
				value: -2,
			});
			
			handlWalk.setKeys(keys);
			
			Base.Player.handl.animations.push(handlWalk);
			Base.Player.handl.anims.walk = Base.scene.beginAnimation(Base.Player.handl, 0, 30, true);
			
			var handrWalk = new BABYLON.Animation(
				"myAnimation",
				"rotation.x",
				30,
				BABYLON.Animation.ANIMATIONTYPE_FLOAT,
				BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);
				
			keys = [];
			
			keys.push({
				frame: 0,
				value: -4.5,
			}, {
				frame: 5,
				value: -4,
			}, {
				frame: 15,
				value: -2,
			}, {
				frame: 25,
				value: -4,
			}, {
				frame: 30,
				value: -4.5,
			});
			
			handrWalk.setKeys(keys);
			
			Base.Player.handr.animations.push(handrWalk);
			Base.Player.handr.anims.walk = Base.scene.beginAnimation(Base.Player.handr, 0, 30, true);

					
			$.getJSON("../../assets/foot.zox", function(foot) {
				Base.Player.footl = new CEWBS.VoxelMesh('footl', Base.scene);
				Base.Player.footl.importZoxel(foot);
				Base.Player.footl.parent = Base.Player.body;
				Base.Player.footl.originToCenterOfBounds();
				Base.Player.footl.isVisible = false;
				
				Base.Player.footl.updateMesh();
				Base.Player.footl.setPivot([-2,-3,0]);
				Base.Player.footl.position = new BABYLON.Vector3(0.5,-2.8,3);
				Base.Player.footl.anims = {};
				
				Base.Player.footr = new CEWBS.VoxelMesh('footr', Base.scene);
				Base.Player.footr.importZoxel(foot);
				Base.Player.footr.parent = Base.Player.body;
				Base.Player.footr.originToCenterOfBounds();
				Base.Player.footr.isVisible = false;
				
				Base.Player.footr.updateMesh();
				Base.Player.footr.setPivot([2,-3,0]);
				Base.Player.footr.position = new BABYLON.Vector3(5.5,-2.8,3);
				Base.Player.footr.anims = {};
	
				var footlWalk = new BABYLON.Animation(
					"myAnimation",
					"rotation.x",
					30,
					BABYLON.Animation.ANIMATIONTYPE_FLOAT,
					BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);
					
				var keys = [];
				
				keys.push({
					frame: 0,
					value: 2,
				}, {
					frame: 15,
					value: -0.6,
				}, {
					frame: 30,
					value: 2,
				});
				
				footlWalk.setKeys(keys);
				
				Base.Player.footl.animations.push(footlWalk);
				Base.Player.footl.anims.walk = Base.scene.beginAnimation(Base.Player.footl, 0, 30, true);
				
				var footrWalk = new BABYLON.Animation(
					"myAnimation",
					"rotation.x",
					30,
					BABYLON.Animation.ANIMATIONTYPE_FLOAT,
					BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE);
					
				keys = [];
				
				keys.push({
					frame: 0,
					value: -0.6,
				}, {
					frame: 15,
					value: 2,
				}, {
					frame: 30,
					value: -0.6,
				});
				
				footrWalk.setKeys(keys);
				
				Base.Player.footr.animations.push(footrWalk);
				Base.Player.footr.anims.walk = Base.scene.beginAnimation(Base.Player.footr, 0, 30, true);
				
				beginWalkAnim = function() {
					Base.Player.handl.anims.walk.restart();
					Base.Player.handr.anims.walk.restart();
					Base.Player.footl.anims.walk.restart();
					Base.Player.footr.anims.walk.restart();
				};
				stopWalkAnim = function() {
					Base.Player.handl.anims.walk.pause();
					Base.Player.handr.anims.walk.pause();
					Base.Player.footl.anims.walk.pause();
					Base.Player.footr.anims.walk.pause();
					Base.Player.handl.rotation.x = -4;
					Base.Player.handr.rotation.x = -4;
					Base.Player.footl.rotation.x = 0;
					Base.Player.footr.rotation.x = 0;
				};
				stopWalkAnim();
			});
		});
		
		$.getJSON("../../assets/head.zox", function(head) {
			Base.Player.head = new CEWBS.VoxelMesh('head', Base.scene);
			Base.Player.head.importZoxel(head);
			Base.Player.head.parent = Base.Player.body;
			Base.Player.head.originToCenterOfBounds(true);
			Base.Player.head.isVisible = false;
			Base.Player.head.updateMesh();
			Base.Player.head.position = new BABYLON.Vector3(5,15,4);
			Base.Player.head.scaling = new BABYLON.Vector3(1.01,1.01,1.01);
			
			Base.scene.registerBeforeRender(function(){
							
				kd.W.down(function() {
					if(Base.cameraMode == 1) {
						Base.Player.body.translate(BABYLON.Axis.Z, 1, BABYLON.Space.Local);
					}
					
				});
				kd.W.press(beginWalkAnim);
				kd.W.up(stopWalkAnim);
				
				kd.A.down(function() {
					if(Base.cameraMode == 1) {
						Base.first_person_camera.rotation.y -= 0.1;
					}
				});
				kd.A.press(beginWalkAnim);
				kd.A.up(stopWalkAnim);
				kd.S.down(function() {
					if(Base.cameraMode == 1) {
						Base.Player.body.translate(BABYLON.Axis.Z, -1, BABYLON.Space.Local);
					}				});
				kd.S.press(beginWalkAnim);
				kd.S.up(stopWalkAnim);
				kd.D.down(function() {
					if(Base.cameraMode == 1) {
						Base.first_person_camera.rotation.y += 0.1;
					}
				});
				kd.D.press(beginWalkAnim);
				kd.D.up(stopWalkAnim);
				if(Base.cameraMode == 0) {
					Base.Player.body.position.x = Base.first_person_camera.position.x
					Base.Player.body.position.y = Base.first_person_camera.position.y-1;
					Base.Player.body.position.z = Base.first_person_camera.position.z;
				} else if (Base.cameraMode == 1) {
					Base.first_person_camera.position.x = Base.Player.body.position.x
					Base.first_person_camera.position.y = Base.Player.body.position.y+1;
					Base.first_person_camera.position.z = Base.Player.body.position.z;
				}
				Base.Player.head.rotation.x = Base.first_person_camera.rotation.x;
				Base.Player.head.rotation.z = Base.first_person_camera.rotation.z;
				Base.Player.body.rotation.y = Base.first_person_camera.rotation.y;
			});
			callback ? callback() : null;
		});
	});
};

Base.createDemoList = function(root) {
	MVCJS.Base.id = '#MVCJS';

	var MainFrame = new MVCJS.Containers.Frame();
	MainFrame.setStyles({
		height: '100%',
		width: '200px',
	});
	MainFrame.parent = MVCJS.Base;
	
	var elementStyles = {
		textAlign: 'center',
		width: 180,
		minHeight: 0,
	}
	
	var headerLabel = new MVCJS.Controls.Label('CEWBS Examples', 'purple borderleft frame');
	headerLabel.setStyles($.extend({marginBottom: 8}, elementStyles));
	
	var animationButton = new MVCJS.Controls.Button('Voxel Animation', 'red borderleft', null, null, elementStyles);
	var collisionButton = new MVCJS.Controls.Button('Collision', 'red borderleft', null, null, elementStyles);
	var transformsButton = new MVCJS.Controls.Button('Transforms', 'red borderleft', null, null, elementStyles);
	var physicsButton = new MVCJS.Controls.Button('Physics', 'red borderleft', null, null, elementStyles);
	//var baseButton = new MVCJS.Controls.Button('Base', 'black borderleft', null, null, elementStyles);
	
	var statusIDLabel = new MVCJS.Controls.Label('Status:');
	statusIDLabel.setStyles({
		position: 'absolute',
		bottom: -6,
		left: 130,
		fontWeight: 'bold'
	});
	
	animationButton.onclick = function() {
		window.location = root+'examples/animation/index.html';
	}
	
	collisionButton.onclick = function() {
		window.location = root+'examples/collision/index.html';
	}
	
	transformsButton.onclick = function() {
		window.location = root+'examples/transforms/index.html';
	}
	
	physicsButton.onclick = function() {
		window.location = root+'examples/physics/index.html';
	}
	
	/*baseButton.onclick = function() {
		window.location = root+'examples/base/index.html';
	}*/
	
	
	MainFrame.addChild(headerLabel);
	MainFrame.addChild(animationButton);
	MainFrame.addChild(collisionButton);
	MainFrame.addChild(transformsButton);
	MainFrame.addChild(physicsButton);
	//MainFrame.addChild(baseButton);
	MainFrame.addChild(statusIDLabel);
	
	var ControlFrame = new MVCJS.Containers.Frame();
	ControlFrame.setStyles({
		padding: 2,
		paddingBottom: 5,
		margin: 3,
		marginTop: 9,
	});
	MainFrame.addChild(ControlFrame);
	
	var ControlsLabel = new MVCJS.Controls.Label('Controls:');
	ControlsLabel.setStyles({
		textAlign: 'center',
		width: 180,
		paddingTop: 1,
		fontWeight: 'bold',
	});
	
	ControlFrame.addChild(ControlsLabel);
	for (var i = 0; i < Base.controls.length; i++) {
		var controlLabel = new MVCJS.Controls.Label(Base.controls[i]);
		controlLabel.setStyles({
			width: 180,
			textAlign: 'left',
			marign: 0,
			marginTop: -12,
			padding: 0,
			fontSize: '13px',
		});
		ControlFrame.addChild(controlLabel);
	}
	
	//Start UI
	MainFrame.open();
	
	var StatusFrame = new MVCJS.Containers.Frame();
	StatusFrame.setStyles({
		height: '32px',
		minHeight: '32px',
		width: 'calc(100% - 198px)',
		position: 'absolute',
		padding:0,
		bottom: 0,
		left:198,
	});
	StatusFrame.parent = MVCJS.Base;
	
	Base.status = new MVCJS.Controls.Label('', 'bordertop');
	Base.status.setStyles({
		width: 'calc(100% + 2px)',
		margin: 0,
		marginTop: -2,
		borderRadius:0,
		textAlign: 'left',
	});
	
	StatusFrame.addChild(Base.status);
	
	StatusFrame.open();
}
