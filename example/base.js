var Base = {
	canvas: null,
	engine: null,
	scene: null,
	camera: null,
	status: null,
	axisIndicator: null,
	controlEnabled: false,
	controls: [
		'G - Grab Mouse',
		'W - Forward',
		'S - Backward',
		'A - Left',
		'D - Right',
		'F - Switch between flying and walking'
	]
};

Base.createScene = function() {
	if (BABYLON.Engine.isSupported()) {
		try {
		    Base.canvas = document.getElementById("viewport");
			Base.engine = new BABYLON.Engine(Base.canvas, false);
			
			Base.scene = new BABYLON.Scene(Base.engine);
			
			Base.scene.gravity = new BABYLON.Vector3(0,-0.2,0);
			Base.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 3, 0), Base.scene);
			Base.camera.ellipsoid = new BABYLON.Vector3(0.6, 1.1, 0.6);
			Base.camera.checkCollisions = true;
			Base.camera.applyGravity = false;
			Base.camera.keysUp = [87];
			Base.camera.keysDown = [83];
			Base.camera.keysLeft = [65];
			Base.camera.keysRight = [68];
			Base.camera.speed = 5;
			Base.camera.inertia = 0.6;
			Base.camera.angularSensibility = 500;
		
			Base.camera.setTarget(BABYLON.Vector3.Zero());
			
			var light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), Base.scene);
			light0.diffuse = new BABYLON.Color3(1.2, 1.2, 1.2);
			light0.specular = new BABYLON.Color3(0.2, 0.2, 0.2);
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
							Base.camera.attachControl(Base.canvas, false);
							Base.controlEnabled = true;
						}
					} else {
						document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
						document.exitPointerLock();
						Base.camera.detachControl(Base.canvas);
						Base.controlEnabled = false;
					}
				
				//Toggle Walk/Fly Mode [Press F]
				} else if(String.fromCharCode(evt.keyCode) == 'F') {
					if(Base.camera.applyGravity) {
						Base.camera.applyGravity = false;
						Base.camera.speed = 5;
					} else {
						Base.camera.applyGravity = true;
						Base.camera.speed = 1.5;
					}
				}
			});
			
			Base.engine.runRenderLoop(function () {
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
	var baseButton = new MVCJS.Controls.Button('Base', 'black borderleft', null, null, elementStyles);
	
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
	
	baseButton.onclick = function() {
		window.location = root+'examples/base/index.html';
	}
	
	
	MainFrame.addChild(headerLabel);
	MainFrame.addChild(animationButton);
	MainFrame.addChild(collisionButton);
	MainFrame.addChild(transformsButton);
	MainFrame.addChild(physicsButton);
	MainFrame.addChild(baseButton);
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
