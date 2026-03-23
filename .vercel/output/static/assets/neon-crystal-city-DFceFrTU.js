import{j as R}from"./vendor-query-C4CRe4I0.js";import{r as i}from"./vendor-react-CEgNRFgA.js";const N=`#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`,M=`#version 300 es
precision highp float;
uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_cameraSpeed;
uniform float u_tileSize;
uniform float u_unionK;
uniform int   u_maxSteps;
uniform float u_maxDist;
uniform float u_surfDist;
out vec4 fragColor;

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5*(d2 - d1)/k, 0.0, 1.0);
  return mix(d2, d1, h) - k*h*(1.0 - h);
}

float getDist(vec3 p) {
  vec2 id = floor(p.xz / u_tileSize);
  p.xz = mod(p.xz, u_tileSize) - u_tileSize*0.5;
  float n = fract(sin(dot(id, vec2(12.9898,78.233))) * 43758.5453);
  float h = 1.0 + n * 4.0;
  float b = sdBox(p - vec3(0.0, h - 1.0, 0.0), vec3(0.4, h, 0.4));
  if (n > 0.8) {
    float s = length(p - vec3(0.0, h*2.0, 0.0)) - 0.5;
    b = opSmoothUnion(b, s, u_unionK);
  }
  float ground = p.y + 1.0;
  return min(b, ground);
}

float rayMarch(vec3 ro, vec3 rd) {
  float dist = 0.0;
  for (int i = 0; i < u_maxSteps; i++) {
    vec3 pos = ro + rd * dist;
    float dS = getDist(pos);
    dist += dS;
    if (dist > u_maxDist || abs(dS) < u_surfDist) break;
  }
  return dist;
}

vec3 palette(float t) {
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0,1.0,0.5);
  vec3 d = vec3(0.8,0.9,0.3);
  return a + b * cos(6.28318 * (c*t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, u_time * u_cameraSpeed);
  vec3 rd = normalize(vec3(uv, 1.0));

  float mx = (u_mouse.x / u_resolution.x - 0.5) * 3.14;
  float my = (u_mouse.y / u_resolution.y - 0.5) * 1.5;
  mat3 rotX = mat3(1,0,0, 0,cos(my),-sin(my), 0,sin(my),cos(my));
  mat3 rotY = mat3(cos(mx),0,sin(mx), 0,1,0, -sin(mx),0,cos(mx));
  rd = rotY * rotX * rd;

  float dist = rayMarch(ro, rd);
  vec3 col = vec3(0.0);
  if (dist < u_maxDist) {
    vec3 p = ro + rd * dist;
    float idSeed = floor(p.xz / u_tileSize).x * 157.0 + floor(p.xz / u_tileSize).y * 311.0;
    float n = fract(sin(idSeed) * 43758.5453);
    float lines = abs(fract(p.y * 2.0) - 0.5);
    float glow = pow(0.01 / lines, 1.5);
    col += palette(n + u_time * 0.1) * glow;
  }
  col = mix(col, vec3(0.0, 0.0, 0.05), smoothstep(0.0, u_maxDist * 0.7, dist));
  fragColor = vec4(col, 1.0);
}
`;function O({cameraSpeed:f=3,tileSize:m=2,unionK:l=.5,maxSteps:d=80,maxDist:v=80,surfDist:_=.001,className:b="",opacity:A=.3}){const p=i.useRef(null),[E,a]=i.useState(null),c=i.useRef(),s=i.useRef({x:0,y:0}),U=i.useRef(Date.now());return i.useEffect(()=>{const t=p.current;if(!t)return;const e=t.getContext("webgl2");if(!e){a("WebGL2 not supported");return}const h=(r,q)=>{const n=e.createShader(r);return e.shaderSource(n,q),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(console.error(e.getShaderInfoLog(n)),e.deleteShader(n),null)},x=h(e.VERTEX_SHADER,N),g=h(e.FRAGMENT_SHADER,M);if(!x||!g){a("Shader error");return}const o=e.createProgram();if(e.attachShader(o,x),e.attachShader(o,g),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS)){a("Link error");return}const S=e.getAttribLocation(o,"a_position"),z=e.getUniformLocation(o,"u_resolution"),F=e.getUniformLocation(o,"u_time"),D=e.getUniformLocation(o,"u_mouse"),T=e.getUniformLocation(o,"u_cameraSpeed"),P=e.getUniformLocation(o,"u_tileSize"),B=e.getUniformLocation(o,"u_unionK"),C=e.getUniformLocation(o,"u_maxSteps"),I=e.getUniformLocation(o,"u_maxDist"),k=e.getUniformLocation(o,"u_surfDist"),L=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,L),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,1,-1,-1,1,1,1,-1]),e.STATIC_DRAW);const w=r=>{s.current.x=r.clientX,s.current.y=r.clientY};window.addEventListener("mousemove",w);const u=()=>{const r=Math.min(window.devicePixelRatio,1.5);t.width=t.clientWidth*r,t.height=t.clientHeight*r,e.viewport(0,0,t.width,t.height)};window.addEventListener("resize",u),u();const y=()=>{e.clear(e.COLOR_BUFFER_BIT),e.useProgram(o),e.enableVertexAttribArray(S),e.bindBuffer(e.ARRAY_BUFFER,L),e.vertexAttribPointer(S,2,e.FLOAT,!1,0,0);const r=(Date.now()-U.current)*.001;e.uniform2f(z,t.width,t.height),e.uniform1f(F,r),e.uniform2f(D,s.current.x,s.current.y),e.uniform1f(T,f),e.uniform1f(P,m),e.uniform1f(B,l),e.uniform1i(C,d),e.uniform1f(I,v),e.uniform1f(k,_),e.drawArrays(e.TRIANGLE_STRIP,0,4),c.current=requestAnimationFrame(y)};return c.current=requestAnimationFrame(y),()=>{cancelAnimationFrame(c.current),window.removeEventListener("resize",u),window.removeEventListener("mousemove",w)}},[f,m,l,d,v,_]),E?null:R.jsx("div",{className:`absolute inset-0 overflow-hidden ${b}`,style:{opacity:A},children:R.jsx("canvas",{ref:p,className:"block w-full h-full"})})}export{O as N};
