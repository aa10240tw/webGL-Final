
var gl;
var points;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];
var paused = 0;
var depthTest = 0;
//
var xP=0;
var yP=1;
var zP=-2;
var x2P=0;
var y2P=0;
var z2P=0;
var arrR=[Math.cos(-1),(-1)*Math.sin(-1),Math.sin(-1),Math.cos(-1)];
var arrL=[Math.cos(1),(-1)*Math.sin(1),Math.sin(1),Math.cos(1)];
var fov=50;
//

// event handlers for mouse input (borrowed from "Learning WebGL" lesson 11)
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var moonRotationMatrix = mat4();
function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) 
    {
      return;
    }

    var newX = event.clientX;
    var newY = event.clientY;
    var deltaX = newX - lastMouseX;
    var newRotationMatrix = rotate(deltaX/10, 0, 1, 0);
    var deltaY = newY - lastMouseY;

    newRotationMatrix = mult(rotate(deltaY/10, 1, 0, 0), newRotationMatrix);
    moonRotationMatrix = mult(newRotationMatrix, moonRotationMatrix);
    lastMouseX = newX
    lastMouseY = newY;
}




var matrixLoc;

var numVertices  = 18;

var vertices = [
        vec3(0.5, 0,  0.5),
        vec3(0.5, 0,  -0.5),
        vec3( -0.5,  0,  -0.5),
        vec3( -0.5, 0,  0.5),
        vec3(0, 1, 0)
];

var vertexColors = [
	vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
	vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
	vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
	vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
	vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
	vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
	vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
	vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

// indices of the 12 triangles that compise the cube

var indices = [ //構成的面 (用vertices表示)
   0,1,4,
   1,4,2,
   4,2,3,
   3,4,0,
   3,0,2,
   0,2,1
];


window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // array element buffer
    
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
    
    // color array atrribute buffer
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // vertex array attribute buffer
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation(program, "transform"); 
    


    //event listeners for buttons 
    document.getElementById( "xButton" ).onclick = rotateX;
    document.getElementById( "yButton" ).onclick = rotateY;
    document.getElementById( "zButton" ).onclick = rotateZ;
    document.getElementById( "pButton" ).onclick = function() {paused=!paused;};
    document.getElementById( "dButton" ).onclick = function() {depthTest=!depthTest;};
    document.getElementById( "fButton" ).onclick = Forward;
    document.getElementById( "bButton" ).onclick = Backward;
    document.getElementById( "lButton" ).onclick = Left;
    document.getElementById( "rButton" ).onclick = Right;
    document.getElementById( "fovUp" ).onclick = function fovUp(){ fov+=5;};
    document.getElementById( "fovDown" ).onclick = function fovDown(){ fov-=5;};
    
    
    // event handlers for mouse input (borrowed from "Learning WebGL" lesson 11)
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
	
    render();
};

function rotateX() {
	paused = 0;
    axis = xAxis;
};
function rotateY() {
	paused = 0;
	axis = yAxis;
};
function rotateZ() {
	paused = 0;
	axis = zAxis;
};
function Forward()
{
    zP+=0.1;
};
function Backward()
{
    zP-=0.1;
};
function Left()
{
	x2P+=0.1;
    xP+=0.1;
}
function Right()
{
	x2P-=0.1;
    xP-=0.1;
}

function render() {
	var modeling = mult(rotate(theta[xAxis], 1, 0, 0),
	                 mult(rotate(theta[yAxis], 0, 1, 0),rotate(theta[zAxis], 0, 0, 1)));
	var viewing = lookAt([xP,yP,zP], [x2P,0.25,0], [0,1,0]);//eye,at,up
	var projection = perspective(fov, 1.0, 0.5, 200.0); //投影
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    if (paused) modeling = moonRotationMatrix;
    if (! paused) theta[axis] += 2.0;
	if (depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);

	var mvpMatrix = mult(projection, mult(viewing, modeling));//p*v*m
    gl.uniformMatrix4fv(matrixLoc, 0, flatten(mvpMatrix));

    gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );

    requestAnimFrame( render );
}
