

var main=function() {
  var CANVAS=document.getElementById("gl-canvas");
  //CANVAS.width=window.innerWidth;
  //CANVAS.height=window.innerHeight;


  /*========================= CAPTURE MOUSE EVENTS ========================= */

  var AMORTIZATION=0.95;
  var drag=false;
  var old_x, old_y;
  var dX=0, dY=0;

  var mouseDown=function(e) {
    drag=true;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
    return false;
  };

  var mouseUp=function(e){
    drag=false;
  };

  var mouseMove=function(e) {
    if (!drag) return false;
    dX=(e.pageX-old_x)*Math.PI/CANVAS.width,
      dY=(e.pageY-old_y)*Math.PI/CANVAS.height;
    THETA+=dX;
    PHI+=dY;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  /*========================= GET WEBGL CONTEXT ========================= */
  var GL;
  try {
    GL = CANVAS.getContext("experimental-webgl", {antialias: true});
  } catch (e) {
    alert("You are not webgl compatible :(") ;
    return false;
  }

  /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  var shader_vertex_source="\n\
attribute vec3 position;\n\
uniform mat4 Pmatrix,Vmatrix,Mmatrix;\n\
attribute vec2 uv;\n\
varying vec2 vUV;\n\
\n\
\n\
void main(void) {\n\
gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
vUV=uv;\n\
}";

  var shader_fragment_source="\n\
precision mediump float;\n\
uniform sampler2D samplerVideo;\n\
varying vec2 vUV;\n\
\n\
\n\
void main(void) {\n\
gl_FragColor = texture2D(samplerVideo, vUV);\n\
}";

  var get_shader=function(source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };

  var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

  var SHADER_PROGRAM=GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");
  var _samplerVideo = GL.getUniformLocation(SHADER_PROGRAM, "samplerVideo");
  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

  GL.enableVertexAttribArray(_uv);
  GL.enableVertexAttribArray(_position);

  GL.useProgram(SHADER_PROGRAM);
  GL.uniform1i(_samplerVideo, 0);

  /*========================= THE QUAD ========================= */
  //POINTS :
  var quad_vertex=[
    -1,-1,0,    
    0,0,
    1,-1,0,     
    1,0,
    1, 1,0, 
    1,1,
    -1, 1,0,
    0,1
  ];

  var QUAD_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, QUAD_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(quad_vertex),
    GL.STATIC_DRAW);

  //FACES :
  var quad_faces = [0,1,2,  0,2,3];

  var QUAD_FACES= GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, QUAD_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(quad_faces),
    GL.STATIC_DRAW);

  /*========================= MATRIX ========================= */

  var PROJMATRIX=LIBS.get_projection(10, CANVAS.width/CANVAS.height, 0.1, 10);
  var MOVEMATRIX=LIBS.get_I4();
  var VIEWMATRIX=LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -6);
  var THETA=0,
      PHI=0;


  /*========================= THE VIDEO TEXTURE ========================= */
  var video=document.getElementById("bunny_video");

  var videoTexture=GL.createTexture();
  GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
  GL.bindTexture(GL.TEXTURE_2D, videoTexture);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);


  GL.texParameteri( GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE );
  GL.texParameteri( GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE );

  var refresh_texture=function() {
    GL.bindTexture(GL.TEXTURE_2D, videoTexture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, video);
  };


  /*========================= DRAWING ========================= */
  //set WebGL states
  GL.enable(GL.DEPTH_TEST);
  GL.clearDepth(1.0);

  GL.clearColor(0.2, 0.2, 0.0,0.0); //#2f83e0 in HTML notation

  //there is only 1 VBO -> we can put it out of the render loop
  GL.bindBuffer(GL.ARRAY_BUFFER, QUAD_VERTEX);
  GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,4*(3+2),0) ;
  GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false,4*(3+2),3*4) ;

  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, QUAD_FACES);

  var time_old=0, time_video=0;

  //the render loop :
  var animate=function(time) {
    var dt=(time-time_old)/1000;
    time_old=time;

    if (!drag) {
      dX*=AMORTIZATION, dY*=AMORTIZATION;
      THETA+=dX, PHI+=dY;
    }
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);

    GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

    if (video.currentTime>0 && video.currentTime!==time_video) {
      time_video=video.currentTime;
      refresh_texture();
    }

    GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);

    GL.flush();
    window.requestAnimationFrame(animate);
  };
  animate(0);
};