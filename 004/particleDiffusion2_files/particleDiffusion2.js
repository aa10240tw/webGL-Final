var canvas;
var gl;

var flag = true;
var seconds = new Date().getTime() *0.00000000001;
var texSize = 1024;
var numPoints = 50;
var diffuse = 4.0;
var pointSize = 60;




var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 0),
    vec2(1, 1)
];

var vertices = [
    vec2(-1.0, -1.0), 
    vec2(-1.0, 1.0 ),
    vec2(1.0, -1.0) ,
    vec2(1.0, 1.0) 
];


var program1, program2;
var framebuffer;
var texture1, texture2;

var buffer;

var vPosition1, vPosition2;
var texLoc;
var vTexCoord;

function init() 
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport(0, 0, texSize, texSize);
    gl.activeTexture( gl.TEXTURE0 );
    
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    
    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

    gl.bindTexture(gl.TEXTURE_2D, texture2);
    
    //
    //  Load shaders and initialize attribute buffers
    //
    
    program1 = initShaders( gl, "vertex-shader1", "fragment-shader1" );
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" );
    
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = texSize;
    framebuffer.height = texSize;
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);
    
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(status != gl.FRAMEBUFFER_COMPLETE) alert('Framebuffer Not Complete');
    
    for(var i = 0; i<numPoints; i++) 
         vertices[4+i] = vec2(0.5*Math.random()-2.0, 0.5*Math.random()-20.0);
        
    buffer = gl.createBuffer();
    
    gl.useProgram(program2);
   
        gl.uniform1f( gl.getUniformLocation(program2, "pointSize"), pointSize );
        gl.uniform4f( gl.getUniformLocation(program2, "color"), Math.random(), 0.0, 0.0, 1.0);  
    
   

    gl.useProgram(program1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, 64+8*numPoints, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
    gl.bufferSubData(gl.ARRAY_BUFFER, 32+8*numPoints, flatten(texCoord));
    
    // buffers and vertex arrays
    
    
    vPosition1 = gl.getAttribLocation( program1, "vPosition1" );
    gl.enableVertexAttribArray( vPosition1 );
    gl.vertexAttribPointer( vPosition1, 2, gl.FLOAT, false, 0,0 );
    
    vTexCoord = gl.getAttribLocation( program1, "vTexCoord");
    gl.enableVertexAttribArray( vTexCoord );    
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 32+8*numPoints );
       
    gl.uniform1i( gl.getUniformLocation(program1, "texture"), 0 );
    gl.uniform1f( gl.getUniformLocation(program1, "d"), 1/texSize );
    gl.uniform1f( gl.getUniformLocation(program1, "s"), diffuse );

    gl.useProgram(program2);

	vPosition2 = gl.getAttribLocation(program2, "vPosition2");
	gl.enableVertexAttribArray(vPosition2);
	gl.vertexAttribPointer(vPosition2, 2, gl.FLOAT, false, 0, 0);

	gl.useProgram(program1);

    gl.bindTexture(gl.TEXTURE_2D, texture2);
    
    render();
}

var render = function(){

   // render to texture

    gl.useProgram(program1);
   
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
    
    if(flag) {
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);

    }
    else {
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);

    }
        
    //var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    //if(status != gl.FRAMEBUFFER_COMPLETE) alert('Framebuffer Not Complete');
   
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    
    gl.useProgram(program2);
	gl.enableVertexAttribArray(vPosition2);
    gl.vertexAttribPointer( vPosition2, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f( gl.getUniformLocation(program2, "color"), 1.0, 0.0, 0.0, Math.random()*0.9); 
    gl.drawArrays(gl.POINTS, 4, numPoints/2);
    gl.uniform4f( gl.getUniformLocation(program2, "color"), Math.random(), Math.random(), Math.random(), 0.8);
    gl.drawArrays(gl.POINTS, 4+numPoints/2, numPoints/2);
    
    gl.useProgram(program1);
	gl.enableVertexAttribArray(vTexCoord);
	gl.enableVertexAttribArray(vPosition1);
    gl.vertexAttribPointer( texLoc, 2, gl.FLOAT, false, 0, 32+8*numPoints);
    gl.vertexAttribPointer( vPosition1, 2, gl.FLOAT, false, 0, 0);
    

// render to display

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
    if(flag){gl.bindTexture(gl.TEXTURE_2D, texture2);} 
      else gl.bindTexture(gl.TEXTURE_2D, texture1);
    var r = 2048/texSize;
    texSize+=0.0015;
    if( texSize>=1028)
    {
        texSize=1024;
    }
    gl.viewport(0, 0, r*texSize, r*texSize);
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    
    gl.viewport(0,0, texSize, texSize);

    
    gl.useProgram(program1);
    
// move particles in a random direction
// wrap arounds
   
    for(var i=0; i<numPoints; i++) {
        vertices[4+i][0] += 0.8*(seconds*Math.random()-1.0);
        vertices[4+i][1] += 0.1*(seconds*Math.random()-1.0);
        if(vertices[4+i][0]>1.0) vertices[4+i][0]-= 40.0;
        if(vertices[4+i][0]<-1.0) vertices[4+i][0]+= 10.0;
        if(vertices[4+i][1]>1.0) vertices[4+i][1]-= 20.0;
        if(vertices[4+i][1]<-1.0) vertices[4+i][1]+= 3.0;
    }
    for(var i=0; i<numPoints/2; i++) {
        var x = Math.floor(10*(vertices[4+i][0]));
        var y = Math.floor(10*(vertices[4+i][1]));
        var color = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
        //if(color[0]>128) vertices[4+i][0] = 0;
        if(color[0]>128) vertices[4+i][0] = 0.5;
        if(color[0]>200) vertices[4+i][1] = 1;
    }
    for(var i=numPoints/2; i<numPoints; i++) {
        var x = Math.floor(20*(vertices[4+i][0]));
        var y = Math.floor(20*(vertices[4+i][1]));
        var color = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);
        //if(color[1]>128) vertices[4+i][1] = 0;
        if(color[1]>200) vertices[4+i][0] = -0.2;
        if(color[1]>128) vertices[4+i][1] = -0.2;
    }

    gl.bufferSubData(gl.ARRAY_BUFFER,  0, flatten(vertices));

// swap textures

    flag = !flag;
    
    requestAnimFrame(render);
}
