/* Wind Bender — the wind. WebGL2 fluid (primary) + 2D ribbons (fallback),
   both consuming the frame-state contract (SPEC §11, §13).
   Globals: window.WindField.fluid(canvas, opts) / .lines(canvas, opts) */
(function () {
  const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

  const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 o;`;

  const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float pot(vec2 p,float t){ return vnoise(p*2.6+vec2(0.,t*0.11)) + 0.5*vnoise(p*5.7-vec2(t*0.08,t*0.03)); }
vec2 curlN(vec2 p,float t){ float e=0.006;
  return vec2(pot(p+vec2(0,e),t)-pot(p-vec2(0,e),t), -(pot(p+vec2(e,0),t)-pot(p-vec2(e,0),t)))/(2.*e); }`;

  const ADVECT = HEAD + `
uniform sampler2D uSrc,uVel; uniform float uDt,uDecay;
void main(){ vec2 v = texture(uVel,vUv).xy; vec2 p = vUv - v*uDt; o = texture(uSrc,p)*uDecay; }`;

  const FORCE = HEAD + NOISE + `
uniform sampler2D uVel,uMask; uniform vec2 uTexel,uTap,uPin;
uniform float uDt,uT,uAspect,uCY,uFlow,uAmp,uGust,uStill,uEmpty,uTurb,uTapK,uPinK,uTemp,uWisp,uCore,uBurst;
float curlAt(vec2 p){
  float L=texture(uVel,p-vec2(uTexel.x,0.)).y, R=texture(uVel,p+vec2(uTexel.x,0.)).y;
  float B=texture(uVel,p-vec2(0.,uTexel.y)).x, T=texture(uVel,p+vec2(0.,uTexel.y)).x;
  return (R-L)-(T-B); }
void main(){
  vec2 uv=vUv; vec2 c=vec2(0.5,uCY);
  vec2 d=(uv-c)*vec2(uAspect,1.); float r=length(d)+1e-4; vec2 rad=d/r; vec2 tang=vec2(-rad.y,rad.x);
  float core = max(uCore,0.05);
  float inh = max(uFlow,0.), exh = max(-uFlow,0.);
  float calm = uStill*(1.0-uEmpty);                          // a held breath, not the squeeze
  float amp = 0.55+0.75*uAmp;
  float rn = r/core;
  float swirl = min(rn, 1.0/max(rn,0.14));                    // Rankine vortex: solid-body in, 1/r out
  vec2 f = vec2(0.);
  // the draw: air is pulled in through the mouth of the tunnel
  float draw = inh*amp*(1.0+1.0*uGust);
  f += -rad*draw*(0.22+1.35*smoothstep(0.85,2.6,rn));
  // once inside it stops falling inward and turns instead — the circle is full, not hollow
  f +=  tang*draw*(0.55+2.20*swirl);
  f +=  tang*inh*1.15*smoothstep(1.7,0.20,rn);
  f += -rad*inh*(r-core*0.55)*1.85*smoothstep(core*2.6,core*0.30,r);
  // held: still turning inside the circle, slowly
  f += -rad*calm*(r-core*0.55)*1.30;
  f +=  tang*calm*(0.22+0.34*swirl);
  // the release: born at the centre, thrown past the edge of the screen
  float blast = exh*amp + uBurst*1.9;
  f += rad*blast*(0.60+2.60*exp(-r*r*24.0));
  f += tang*exh*0.30*exp(-r*r*3.0);
  // the technique keeps a slow spin alive even when nothing moves
  f += tang*(0.05+0.13*uTemp)*swirl*0.9;
  // texture of moving air — almost switched off while the breath is held
  f += curlN(uv*vec2(uAspect,1.)*1.7, uT)*(uWisp*(0.34+1.10*uTurb)*(1.0-0.86*calm));
  // vorticity confinement — keeps eddies from dying
  float cc=curlAt(uv);
  vec2 g=vec2(abs(curlAt(uv+vec2(uTexel.x,0.)))-abs(curlAt(uv-vec2(uTexel.x,0.))),
              abs(curlAt(uv+vec2(0.,uTexel.y)))-abs(curlAt(uv-vec2(0.,uTexel.y))));
  g /= (length(g)+1e-4); f += vec2(g.y,-g.x)*cc*1.10*(1.0-0.80*calm);
  // the fingertip pushes the air away; a held finger pins it
  vec2 td=(uv-uTap)*vec2(uAspect,1.); float tl=length(td)+1e-4;
  f += (td/tl)*uTapK*exp(-tl*tl*70.)*3.0;
  vec2 v = texture(uVel,vUv).xy + f*uDt;
  float pl=length((uv-uPin)*vec2(uAspect,1.));
  v *= mix(1.0, 1.0-0.92*exp(-pl*pl*55.), uPinK);
  float m = texture(uMask,vUv).a;
  v = mix(v, vec2(0.), clamp(m,0.,1.)*0.94);              // the word is a no-slip obstacle
  v *= pow(0.55-0.32*calm, uDt);                            // per-second decay (§13 rule 1), held air sheds it fast
  v = mix(v, vec2(0.), float(!(v.x==v.x && v.y==v.y)));     // NaN scrub (§17.2)
  o = vec4(clamp(v,-6.,6.),0.,1.); }`;

  const DIVERGENCE = HEAD + `
uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L=texture(uVel,vUv-vec2(uTexel.x,0.)).x, R=texture(uVel,vUv+vec2(uTexel.x,0.)).x;
  float B=texture(uVel,vUv-vec2(0.,uTexel.y)).y, T=texture(uVel,vUv+vec2(0.,uTexel.y)).y;
  o = vec4(0.5*((R-L)+(T-B)),0.,0.,1.); }`;

  const JACOBI = HEAD + `
uniform sampler2D uP,uDiv; uniform vec2 uTexel;
void main(){
  float L=texture(uP,vUv-vec2(uTexel.x,0.)).x, R=texture(uP,vUv+vec2(uTexel.x,0.)).x;
  float B=texture(uP,vUv-vec2(0.,uTexel.y)).x, T=texture(uP,vUv+vec2(0.,uTexel.y)).x;
  o = vec4((L+R+B+T - texture(uDiv,vUv).x)*0.25,0.,0.,1.); }`;

  const GRAD = HEAD + `
uniform sampler2D uP,uVel; uniform vec2 uTexel;
void main(){
  float L=texture(uP,vUv-vec2(uTexel.x,0.)).x, R=texture(uP,vUv+vec2(uTexel.x,0.)).x;
  float B=texture(uP,vUv-vec2(0.,uTexel.y)).x, T=texture(uP,vUv+vec2(0.,uTexel.y)).x;
  o = vec4(texture(uVel,vUv).xy - vec2(R-L,T-B),0.,1.); }`;

  const DYE = HEAD + NOISE + `
uniform sampler2D uSrc,uVel,uMask; uniform vec2 uTexel;
uniform float uDt,uT,uAspect,uCY,uFlow,uFill,uGust,uPulse,uStill,uEmpty,uGetset,uDone,uIdle,uTurb,uTapK,uAmp,uCore,uBurst;
uniform vec2 uTap;
void main(){
  vec2 v=texture(uVel,vUv).xy; vec2 p=vUv - v*uDt;
  float d=texture(uSrc,p).r*pow(0.40,uDt);
  vec2 c=vec2(0.5,uCY); float r=length((vUv-c)*vec2(uAspect,1.));
  // air is injected in filaments, never as fog
  float n1=vnoise(vUv*vec2(uAspect,1.)*9.0 + vec2(uT*0.14,-uT*0.21));
  float n2=vnoise(vUv*vec2(uAspect,1.)*26.0 - vec2(uT*0.31,uT*0.12));
  float grain=0.10 + 1.35*n1*n1 + 0.65*n2*n2;
  float rn = r/max(uCore,0.05);
  float inj=0.;
  // breathing in: the air is drawn in from the edges of the field
  inj += max(uFlow,0.)*smoothstep(0.9,2.6,rn)*(0.40+0.80*uGust)*grain*0.85;
  // and it fills the inside of the tunnel rather than piling into a ring
  inj += max(uFlow,0.)*exp(-pow((rn-0.52)/0.62,2.))*1.15*grain;
  inj += uStill*(1.0-uEmpty)*exp(-pow((rn-0.50)/0.58,2.))*0.55*grain;
  // breathing out: born at the core, thrown outward
  inj += max(-uFlow,0.)*exp(-r*r*22.)*(0.85+1.3*uGust+2.4*uBurst)*grain;
  // a held breath beats once a second so it can be counted without reading
  inj += uPulse*uStill*exp(-pow((rn-0.50)/0.46,2.))*(0.35+0.55*grain);
  // the squeeze: air still leaving, a low continuous veil
  inj += uEmpty*0.13*exp(-r*r*5.5)*grain;
  // count-in: the field gathers inward, faint
  inj += uGetset*smoothstep(0.5,1.1,r)*0.34*grain;
  inj += uIdle*exp(-pow((rn-0.55)/0.85,2.))*0.13*grain;
  inj += uDone*exp(-r*r*3.0)*0.5*grain;
  // the word sheds air from its edges
  float m=texture(uMask,vUv).a;
  float me=max(max(texture(uMask,vUv+vec2(uTexel.x*2.,0.)).a,texture(uMask,vUv-vec2(uTexel.x*2.,0.)).a),
               max(texture(uMask,vUv+vec2(0.,uTexel.y*2.)).a,texture(uMask,vUv-vec2(0.,uTexel.y*2.)).a));
  inj += clamp(me-m,0.,1.)*(0.14+abs(uFlow)*0.55);
  inj += uTapK*exp(-pow(length((vUv-uTap)*vec2(uAspect,1.))/0.10,2.))*0.7*grain;
  d += inj*uDt*3.0;
  d *= 1.0-clamp(m,0.,1.)*0.93;
  d = mix(d,0.,float(!(d==d)));
  o = vec4(clamp(d,0.,2.4),0.,0.,1.); }`;

  const DISPLAY = HEAD + `
uniform sampler2D uDye,uVel; uniform vec3 uBg,uLo,uHi,uWarm; uniform vec2 uDTex;
uniform float uDim,uRim,uStill,uTurb,uAspect,uCY,uT;
float hsh(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv=vUv;
  vec2 v=texture(uVel,uv).xy;
  float sp=length(v); vec2 dir=v/(sp+1e-4);
  // wind is streaky: the density is smeared along its own flow, never bloomed outward
  float d=0., ws=0.;
  for(int i=-3;i<=3;i++){
    float w=1.0-abs(float(i))/4.2;
    d+=texture(uDye, uv+dir*float(i)*uDTex.x*2.2*(1.0+min(sp,2.0)*1.6)).r*w; ws+=w; }
  d/=ws;
  float dens=clamp(d,0.,1.35);
  // a medium seen against the dark — alpha over the ground, not light added to it
  float a=1.0-exp(-dens*2.05);
  vec3 air=mix(uLo,uHi,pow(clamp(dens,0.,1.),0.86));
  air=mix(air,uWarm,clamp(uStill*0.50*dens,0.,0.55));
  vec3 col=mix(uBg,air,clamp(a*0.94,0.,1.));
  // relief across the direction of travel, so the air has grain instead of glow
  vec2 nrm=vec2(-dir.y,dir.x);
  float g1=texture(uDye,uv+nrm*uDTex.y*2.0).r, g2=texture(uDye,uv-nrm*uDTex.y*2.0).r;
  col += uHi*clamp((g1-g2)*1.1,-0.5,0.5)*0.085*min(1.0,dens*2.2);
  float r=length((uv-vec2(0.5,uCY))*vec2(uAspect,1.));
  col *= 1.0-0.30*smoothstep(0.52,1.34,r);
  col *= uDim;
  float n=hsh(uv*vec2(1927.,2871.)+uT);
  col *= 1.0+(n-0.5)*0.20*min(1.0,dens*2.0);   // dust in the air
  col += (n-0.5)*0.010;
  o=vec4(col,1.); }`;

  function sh(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s), src); return null; }
    return s;
  }
  function prog(gl, fs) {
    const p = gl.createProgram(), v = sh(gl, gl.VERTEX_SHADER, VERT), f = sh(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]',''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  }

  function fluid(canvas, opts) {
    const o = Object.assign({ centerY: 0.52, palette: {}, wisp: 1, sim: 112, dyeScale: 3.2, core: 0.25 }, opts);
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const P = { advect: prog(gl, ADVECT), force: prog(gl, FORCE), div: prog(gl, DIVERGENCE),
                jac: prog(gl, JACOBI), grad: prog(gl, GRAD), dye: prog(gl, DYE), disp: prog(gl, DISPLAY) };
    for (const k in P) if (!P[k]) return null;

    function tex(w, h) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0,0,w,h); gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, f, w, h };
    }
    const dbl = (w,h) => { let a = tex(w,h), b = tex(w,h); return { get r(){return a;}, get w(){return b;}, swap(){ const t=a; a=b; b=t; } }; };

    let vel, dye, pres, divT, SW, SH, DW, DH, res = 1;
    const maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function alloc() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cw = Math.max(80, canvas.clientWidth), ch = Math.max(80, canvas.clientHeight);
      canvas.width = Math.round(cw*dpr); canvas.height = Math.round(ch*dpr);
      const aspect = cw/ch;
      SW = Math.max(48, Math.round(o.sim*res*Math.max(1, aspect)));
      SH = Math.max(48, Math.round(SW/aspect));
      DW = Math.round(SW*o.dyeScale); DH = Math.round(SH*o.dyeScale);
      vel = dbl(SW,SH); dye = dbl(DW,DH); pres = dbl(SW,SH); divT = tex(SW,SH);
    }
    alloc();

    function blit(target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null);
      if (target) gl.viewport(0,0,target.w,target.h); else gl.viewport(0,0,canvas.width,canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function bind(pr) { gl.useProgram(pr.p); return pr.u; }
    function unit(i, t) { gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D, t); return i; }

    const pal = Object.assign({ bg:[0.043,0.055,0.070], lo:[0.16,0.27,0.34], hi:[0.88,0.95,0.99], warm:[0.86,0.55,0.31] }, o.palette);
    let lastW = 0, lastH = 0;

    return {
      gl,
      setMask(src) {
        gl.bindTexture(gl.TEXTURE_2D, maskTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL ?? 0x9240, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL ?? 0x9240, false);
      },
      degrade() { if (res > 0.62) { res *= 0.72; alloc(); return true; } return false; },
      frame(s, dt) {
        if (canvas.clientWidth !== lastW || canvas.clientHeight !== lastH) { lastW = canvas.clientWidth; lastH = canvas.clientHeight; alloc(); }
        const aspect = Math.max(0.2, canvas.clientWidth/Math.max(1,canvas.clientHeight));
        const txS = [1/SW, 1/SH], cy = 1 - o.centerY;
        dt = Math.min(dt, 1/20);

        let u = bind(P.advect);
        gl.uniform1i(u.uSrc, unit(0, vel.r.t)); gl.uniform1i(u.uVel, unit(1, vel.r.t));
        gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDecay, Math.pow(0.85, dt));
        blit(vel.w); vel.swap();

        u = bind(P.force);
        gl.uniform1i(u.uVel, unit(0, vel.r.t)); gl.uniform1i(u.uMask, unit(1, maskTex));
        gl.uniform2f(u.uTexel, txS[0], txS[1]); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uT, s.t||0);
        gl.uniform1f(u.uAspect, aspect); gl.uniform1f(u.uCY, cy);
        gl.uniform1f(u.uFlow, s.flow||0); gl.uniform1f(u.uAmp, s.amp||0); gl.uniform1f(u.uGust, s.gust||0);
        gl.uniform1f(u.uStill, s.still?1:0); gl.uniform1f(u.uEmpty, s.phase==='empty'?1:0);
        gl.uniform1f(u.uTurb, s.turb||0); gl.uniform1f(u.uTemp, s.temp||0); gl.uniform1f(u.uWisp, o.wisp);
        gl.uniform1f(u.uTapK, s.tapK||0); gl.uniform1f(u.uPinK, s.pinK||0);
        gl.uniform2f(u.uTap, s.tapU ?? -1, s.tapV ?? -1); gl.uniform2f(u.uPin, s.pinU ?? -1, s.pinV ?? -1);
        gl.uniform1f(u.uCore, o.core); gl.uniform1f(u.uBurst, s.burst||0);
        blit(vel.w); vel.swap();

        u = bind(P.div);
        gl.uniform1i(u.uVel, unit(0, vel.r.t)); gl.uniform2f(u.uTexel, txS[0], txS[1]);
        blit(divT);

        u = bind(P.jac);
        gl.uniform2f(u.uTexel, txS[0], txS[1]); gl.uniform1i(u.uDiv, unit(1, divT.t));
        for (let i = 0; i < 10; i++) { gl.uniform1i(u.uP, unit(0, pres.r.t)); blit(pres.w); pres.swap(); }

        u = bind(P.grad);
        gl.uniform2f(u.uTexel, txS[0], txS[1]);
        gl.uniform1i(u.uP, unit(0, pres.r.t)); gl.uniform1i(u.uVel, unit(1, vel.r.t));
        blit(vel.w); vel.swap();

        u = bind(P.dye);
        gl.uniform1i(u.uSrc, unit(0, dye.r.t)); gl.uniform1i(u.uVel, unit(1, vel.r.t)); gl.uniform1i(u.uMask, unit(2, maskTex));
        gl.uniform2f(u.uTexel, 1/DW, 1/DH); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uT, s.t||0);
        gl.uniform1f(u.uAspect, aspect); gl.uniform1f(u.uCY, cy);
        gl.uniform1f(u.uFlow, s.flow||0); gl.uniform1f(u.uFill, s.fill||0); gl.uniform1f(u.uGust, s.gust||0);
        gl.uniform1f(u.uPulse, s.pulse||0); gl.uniform1f(u.uStill, s.still?1:0);
        gl.uniform1f(u.uEmpty, s.phase==='empty'?1:0); gl.uniform1f(u.uGetset, s.phase==='getset'?1:0);
        gl.uniform1f(u.uDone, s.phase==='done'?1:0); gl.uniform1f(u.uIdle, s.idle?1:0);
        gl.uniform1f(u.uTurb, s.turb||0); gl.uniform1f(u.uAmp, s.amp||0); gl.uniform1f(u.uTapK, s.tapK||0);
        gl.uniform2f(u.uTap, s.tapU ?? -1, s.tapV ?? -1);
        gl.uniform1f(u.uCore, o.core); gl.uniform1f(u.uBurst, s.burst||0);
        blit(dye.w); dye.swap();

        u = bind(P.disp);
        gl.uniform1i(u.uDye, unit(0, dye.r.t)); gl.uniform1i(u.uVel, unit(1, vel.r.t));
        gl.uniform3fv(u.uBg, pal.bg); gl.uniform3fv(u.uLo, pal.lo); gl.uniform3fv(u.uHi, pal.hi); gl.uniform3fv(u.uWarm, pal.warm);
        gl.uniform1f(u.uDim, s.dim ?? 1); gl.uniform1f(u.uRim, s.rim||0); gl.uniform1f(u.uStill, s.still?1:0);
        gl.uniform1f(u.uTurb, s.turb||0); gl.uniform1f(u.uAspect, aspect); gl.uniform1f(u.uCY, cy);
        gl.uniform1f(u.uT, s.t||0); gl.uniform1f(u.uFill, s.fill||0);
        gl.uniform2f(u.uDTex, 1/DW, 1/DH);
        blit(null);
      },
      destroy() { const e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); },
    };
  }

  /* ── 2D air (SPEC §13). Not ink: air is drawn as volume. Every parcel is a soft
        translucent body stretched along its own velocity, laid down additively so
        overlapping air reads as dense and thin air stays transparent; a sparse set of
        streaklines is drawn over the top for structure. A perfectly circular tunnel sits
        at the centre — the draw pulls everything onto its wall and makes it orbit, a held
        breath parks it there, the release detonates it out past every edge. */
  function lines(canvas, opts) {
    const o = Object.assign({ centerY: 0.5, count: 120, len: 14, palette: {}, wisp: 1,
                              spacing: 4, core: 0.26, density: 1 }, opts);
    const ctx = canvas.getContext('2d');
    const pal = Object.assign({ bg:'#0B0E12', lo:'#2A4453', hi:'#E2ECF2', warm:'#DB8C50' }, o.palette);
    const rgb = (hx) => { const v = parseInt(hx.slice(1), 16);
      return [(v>>16)&255, (v>>8)&255, v&255]; };
    const C = { bg: rgb(pal.bg), lo: rgb(pal.lo), hi: rgb(pal.hi), warm: rgb(pal.warm) };
    const csv = (a) => a.join(',');
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x-a)/((b-a)||1e-4))); return t*t*(3-2*t); };
    let W = 0, H = 0, S = 1, cx = 0, cy = 0, P = [], mode = 'idle', burst = 0, lastFlow = 0;

    /* one soft body, rendered once: a gaussian smudge with no edge of its own */
    const SP = 64;
    const mkPuff = (col) => {
      const c = document.createElement('canvas'); c.width = c.height = SP;
      const g = c.getContext('2d');
      const im = g.createImageData(SP, SP), d = im.data;
      for (let y = 0; y < SP; y++) for (let x = 0; x < SP; x++) {
        const dx = (x - SP/2)/(SP/2), dy = (y - SP/2)/(SP/2);
        const q = dx*dx + dy*dy;
        const a = Math.exp(-q*3.6) * (1 - sm(0.72, 1, Math.sqrt(q)));
        const k = (y*SP + x)*4;
        d[k] = col[0]; d[k+1] = col[1]; d[k+2] = col[2];
        d[k+3] = Math.max(0, Math.min(255, a*255))|0;
      }
      g.putImageData(im, 0, 0);
      return c;
    };
    const mix3 = (a, b, u) => [0,1,2].map(i => Math.round(a[i]*(1-u) + b[i]*u));
    // slow air is cold and dark, fast air is pale, held air is ember
    const PUFF = [ mkPuff(mix3(C.lo, C.hi, 0.10)), mkPuff(mix3(C.lo, C.hi, 0.32)),
                   mkPuff(mix3(C.lo, C.hi, 0.58)), mkPuff(mix3(C.warm, C.hi, 0.22)) ];

    function spawn(p, seed) {
      const a = Math.random()*Math.PI*2;
      let rr;
      if (mode === 'out')       rr = o.core*(0.02 + Math.random()*0.40);
      else if (mode === 'in')   rr = 0.42 + Math.random()*0.72;
      else if (mode === 'hold') rr = o.core*(0.12 + Math.random()*0.92);
      else                      rr = 0.06 + Math.random()*0.50;
      p.x = cx + Math.cos(a)*rr*S; p.y = cy + Math.sin(a)*rr*S;
      p.vx = 0; p.vy = 0; p.life = seed ? Math.random()*3 : 0; p.max = 4 + Math.random()*7;
      p.pts = [[p.x, p.y]];
      p.seed = Math.random()*100;
      p.band = 0.28 + Math.random()*0.80;       // which lane inside the tunnel it rides
      p.spin = Math.random() < 0.22 ? -1 : 1;
      p.mass = 0.45 + Math.random()*1.05;       // body size
      p.glow = 0.5 + Math.random()*0.8;
      p.streak = Math.random() < 0.34;          // only some are drawn as filaments
      return p;
    }
    function alloc() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(40, canvas.clientWidth); H = Math.max(40, canvas.clientHeight);
      S = Math.min(W, H); cx = W*0.5; cy = H*o.centerY;
      canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle = pal.bg; ctx.fillRect(0,0,W,H);
      P = []; for (let i = 0; i < o.count; i++) P.push(spawn({}, true));
    }
    alloc();

    return {
      degrade() { return false; },
      setMask() {},
      frame(s, dt) {
        if (canvas.clientWidth !== W || canvas.clientHeight !== H) alloc();
        dt = Math.min(dt, 1/20);
        const t = s.t || 0, flow = s.flow || 0;
        const inh = Math.max(flow, 0), exh = Math.max(-flow, 0);
        const calm = (s.still && s.phase !== 'empty') ? 1 : 0;
        const amp = 0.55 + 0.75*(s.amp || 0);
        if (flow < -0.02 && lastFlow >= -0.02) { burst = 1; for (const p of P) p.pts = [[p.x, p.y]]; }
        lastFlow = flow;
        burst = Math.max(burst*Math.pow(0.02, dt), s.burst || 0);
        mode = exh > 0.04 ? 'out' : inh > 0.04 ? 'in' : calm ? 'hold' : 'idle';
        const core = o.core, blast = exh*amp + burst*1.9;

        for (const p of P) {
          const dx = p.x - cx, dy = p.y - cy, rr = Math.hypot(dx, dy)/S + 1e-4;
          const ux = dx/(rr*S), uy = dy/(rr*S), tx = -uy, ty = ux;
          const rn = rr/core;
          const swirl = Math.min(rn, 1/Math.max(rn, 0.14));
          let vr = 0, vt = 0;
          // the draw: in through the mouth of the tunnel, then around inside it
          vr += -inh*amp*(0.22 + 1.35*sm(0.85, 2.6, rn))*(0.66 + 0.58*p.mass);
          vt +=  inh*amp*(0.50 + 1.75*swirl)*p.spin;
          vt +=  inh*0.95*sm(1.7, 0.20, rn)*p.spin;
          vr += -inh*(rr - core*0.55*p.band)*1.55*sm(core*2.8, core*0.25, rr);
          // held: still turning inside, slowly
          vr +=  calm*(core*0.55*p.band - rr)*1.10 + calm*(s.pulse || 0)*0.10;
          vt +=  calm*(0.20 + 0.30*swirl)*p.spin;
          // the release
          vr +=  blast*(0.60 + 2.60*Math.exp(-rr*rr*24));
          vt +=  exh*0.28*Math.exp(-rr*rr*3)*p.spin;
          vt += (0.05 + 0.12*(s.temp || 0))*swirl*0.85*(1 - 0.70*calm);
          let fx = (ux*vr + tx*vt)*S, fy = (uy*vr + ty*vt)*S;
          const wob = o.wisp*(0.10 + 0.40*(s.turb || 0) + 0.14*inh)*(1 - 0.80*calm)*S;
          fx += Math.sin(p.y*0.0130 + t*0.55 + p.seed)*Math.cos(p.x*0.0110 - t*0.40)*wob;
          fy += Math.cos(p.x*0.0140 + t*0.47 + p.seed*1.3)*Math.sin(p.y*0.0120 + t*0.33)*wob;
          const k = calm ? 2.0 : exh > 0.02 ? 3.6 : 5.0;
          const lp = 1 - Math.exp(-dt*k);
          p.vx += (fx - p.vx)*lp; p.vy += (fy - p.vy)*lp;
          p.x += p.vx*dt; p.y += p.vy*dt; p.life += dt;
          const gone = p.x < -90 || p.x > W+90 || p.y < -90 || p.y > H+90;
          if (gone || p.life > p.max || (inh > 0.25 && p.life > 4.2)) { spawn(p); continue; }
          if (p.streak) {
            const h = p.pts[0];
            if (Math.hypot(p.x-h[0], p.y-h[1]) > o.spacing) {
              p.pts.unshift([p.x, p.y]); if (p.pts.length > o.len) p.pts.pop();
            }
            const cap = calm ? 4 : o.len;
            while (p.pts.length > cap) p.pts.pop();
          }
        }

        ctx.setTransform(ctx.getTransform());
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgb(' + csv(C.bg) + ')';
        ctx.fillRect(0, 0, W, H);

        const dim = (s.dim ?? 1);
        const heat = calm ? 1 : Math.min(1, (s.turb || 0)*1.2);
        const tint = [0,1,2].map(i => Math.round(C.hi[i]*(1-heat*0.55) + C.warm[i]*heat*0.55));
        const cold = [0,1,2].map(i => Math.round(C.lo[i]*0.75 + C.hi[i]*0.25));

        /* the body of the air: a translucent medium laid over the dark, stretched along
           its own motion. Composited, never added — added light is what made it glow. */
        ctx.globalCompositeOperation = 'source-over';
        for (const p of P) {
          const sp = Math.hypot(p.vx, p.vy);
          const spd = Math.min(1, sp/(S*0.8));
          const fade = Math.min(1, p.life/0.7) * Math.min(1, (p.max - p.life)/1.6);
          if (fade <= 0.02) continue;
          const w = S*(0.075 + 0.085*p.mass);
          const l = w*(1 + spd*4.2 + (calm ? 0 : 0.4));
          const a = dim*p.glow*fade*(0.050 + 0.070*spd + 0.018*calm)*o.density;
          if (a <= 0.004) continue;
          const puff = calm ? PUFF[3] : PUFF[spd > 0.34 ? 2 : spd > 0.13 ? 1 : 0];
          ctx.globalAlpha = Math.min(0.15, a);
          ctx.save();
          ctx.translate(p.x, p.y);
          if (sp > 1) ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.drawImage(puff, -l/2, -w/2, l, w);
          // a tighter core inside the body, so it has a spine and does not read as fog
          ctx.globalAlpha = Math.min(0.18, a*1.15);
          ctx.drawImage(puff, -l*0.34, -w*0.20, l*0.68, w*0.40);
          ctx.restore();
        }

        /* structure over the top: streaklines through the same field */
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgb(' + csv(tint) + ')';
        const base = (0.040 + 0.11*Math.min(1, Math.abs(flow)*1.7) + 0.03*calm) * dim;
        const B = 4;
        for (const p of P) {
          if (!p.streak) continue;
          const ch = p.pts, n = ch.length;
          if (n < 3) continue;
          const fade = Math.min(1, p.life/0.8) * Math.min(1, (p.max - p.life)/1.4);
          if (fade <= 0.02) continue;
          const spd = Math.min(1, Math.hypot(p.vx, p.vy)/(S*0.85));
          for (let b = 0; b < B; b++) {
            const i0 = Math.floor(n*b/B), i1 = Math.min(n-1, Math.ceil(n*(b+1)/B));
            if (i1 - i0 < 1) continue;
            const prof = Math.sin(Math.PI*Math.pow((b+0.5)/B, 0.8));
            const a = base*(0.3 + 0.95*prof)*fade*(0.4 + 0.8*spd + 0.35*calm)*p.glow;
            if (a <= 0.012) continue;
            ctx.globalAlpha = Math.min(0.26, a);
            ctx.lineWidth = 0.7 + 1.1*prof*(0.6 + 0.7*p.mass);
            ctx.beginPath(); ctx.moveTo(ch[i0][0], ch[i0][1]);
            for (let i = i0+1; i <= i1; i++) ctx.lineTo(ch[i][0], ch[i][1]);
            ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      },
      destroy() {},
    };
  }

  window.WindField = { fluid, lines };
})();
