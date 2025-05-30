/*-------------------------------------------------------------------------
17_GouraudShading.js

- Viewing a 3D unit cube at origin with perspective projection
- Rotating the cube by ArcBall interface (by left mouse button dragging)
- press key 'a' to switch between camera and model rotation modes in ArcBall interface
- Applying Specular reflection using Gouraud shading to the cube
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText} from './util.js';
import { Shader, readShaderFile } from './shader.js';
import { Cube } from './cube.js';
import { Arcball } from './arcball.js';
import { Cone } from './cone.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let shaderG;
let shaderP;
let lampShader;
let textOverlay; 
let textOverlay2;
let textOverlay3;
let textOverlay4;
let textOverlay5;
let textOverlay6;
let textOverlay7;
let textOverlay8;
let textOverlay9;
let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
let lampModelMatrix = mat4.create();
let arcBallMode = 'CAMERA';     // 'CAMERA' or 'MODEL'
let shadingMode = 'FLAT';       // 'FLAT' or 'SMOOTH'
let renderingMode = 'GOURAUD';

const cone = new Cone(gl, 32);
const lamp = new Cube(gl);

const cameraPos = vec3.fromValues(0, 0, 3);
const lightPos = vec3.fromValues(1.0, 0.7, 1.0);
const lightSize = vec3.fromValues(0.1, 0.1, 0.1);

// Arcball object: initial distance 5.0, rotation sensitivity 2.0, zoom sensitivity 0.0005
// default of rotation sensitivity = 1.5, default of zoom sensitivity = 0.001
const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        if (event.key == 'a') {
            if (arcBallMode == 'CAMERA') {
                arcBallMode = 'MODEL';
            }
            else {
                arcBallMode = 'CAMERA';
            }
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 'r') {
            arcball.reset();
            modelMatrix = mat4.create(); 
            arcBallMode = 'CAMERA';
            updateText(textOverlay2, "arcball mode: " + arcBallMode);
        }
        else if (event.key == 's') {
            cone.copyVertexNormalsToNormals();
            cone.updateNormals();
            shadingMode = 'SMOOTH';
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + renderingMode + ")");
            render();
        }
        else if (event.key == 'f') {
            cone.copyFaceNormalsToNormals();
            cone.updateNormals();
            shadingMode = 'FLAT';
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + renderingMode + ")");
            render();
        }
        else if (event.key == 'g') {
            renderingMode = 'GOURAUD';
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + renderingMode + ")");
            render();
        }
        else if (event.key == 'p') {
            renderingMode = 'PHONG';
            updateText(textOverlay3, "shading mode: " + shadingMode + " (" + renderingMode + ")");
            render();
        }
    });
}

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

async function initGShader() {
    const vertexShaderSource = await readShaderFile('shGVert.glsl');
    const fragmentShaderSource = await readShaderFile('shGFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initPShader() {
    const vertexShaderSource = await readShaderFile('shPVert.glsl');
    const fragmentShaderSource = await readShaderFile('shPFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function initLampShader() {
    const vertexShaderSource = await readShaderFile('shLampVert.glsl');
    const fragmentShaderSource = await readShaderFile('shLampFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    if(renderingMode === 'GOURAUD') {
        shader = shaderG;
    }
    else {
        shader = shaderP;
    }

    // clear canvas
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (arcBallMode == 'CAMERA') {
        viewMatrix = arcball.getViewMatrix();
    }
    else { // arcBallMode == 'MODEL'
        modelMatrix = arcball.getModelRotMatrix();
        viewMatrix = arcball.getViewCamDistanceMatrix();
    }

    // drawing the cube
    shader.use();  // using the cube's shader
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setVec3('u_viewPos', cameraPos);
    cone.draw(shader);

    // drawing the lamp
    lampShader.use();
    lampShader.setMat4('u_view', viewMatrix);
    lamp.draw(lampShader);

    // call the render function the next time for animation
    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        // View transformation matrix (camera at cameraPos, invariant in the program)
        mat4.translate(viewMatrix, viewMatrix, cameraPos);

        // Projection transformation matrix (invariant in the program)
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view (fov, degree)
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // creating shaders
        shaderP = await initPShader();
        shaderG = await initGShader();
        lampShader = await initLampShader();
        
        shaderP.use();
        shaderP.setMat4("u_projection", projMatrix);

        shaderP.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
        shaderP.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
        shaderP.setFloat("material.shininess", 32);

        shaderP.setVec3("light.position", lightPos);
        shaderP.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
        shaderP.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shaderP.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shaderP.setVec3("u_viewPos", cameraPos);

        shaderG.use();
        shaderG.setMat4("u_projection", projMatrix);

        shaderG.setVec3("material.diffuse", vec3.fromValues(1.0, 0.5, 0.31));
        shaderG.setVec3("material.specular", vec3.fromValues(0.5, 0.5, 0.5));
        shaderG.setFloat("material.shininess", 32);

        shaderG.setVec3("light.position", lightPos);
        shaderG.setVec3("light.ambient", vec3.fromValues(0.2, 0.2, 0.2));
        shaderG.setVec3("light.diffuse", vec3.fromValues(0.7, 0.7, 0.7));
        shaderG.setVec3("light.specular", vec3.fromValues(1.0, 1.0, 1.0));
        shaderG.setVec3("u_viewPos", cameraPos);


        lampShader.use();
        lampShader.setMat4("u_projection", projMatrix);
        const lampModelMatrix = mat4.create();
        mat4.translate(lampModelMatrix, lampModelMatrix, lightPos);
        mat4.scale(lampModelMatrix, lampModelMatrix, lightSize);
        lampShader.setMat4('u_model', lampModelMatrix);

        textOverlay = setupText(canvas, "Cone with Lighting", 1);
        textOverlay2 = setupText(canvas, "arcball mode: " + arcBallMode, 2);
        textOverlay3 = setupText(canvas, "shading mode: " + shadingMode + " (" + renderingMode + ")", 3);
        textOverlay4 = setupText(canvas, "press 'a' to change arcball mode", 4);
        textOverlay5 = setupText(canvas, "press 'r' to reset arcball", 5);
        textOverlay6 = setupText(canvas, "press 's' to switch to smooth shading", 6);
        textOverlay7 = setupText(canvas, "press 'f' to switch to flat shading", 7);
        textOverlay8 = setupText(canvas, "press 'g' to switch to Gouraud shading", 8);
        textOverlay9 = setupText(canvas, "press 'p' to switch to Phong shading", 9);

        setupKeyboardEvents();

        // call the render function the first time for animation
        requestAnimationFrame(render);

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}
