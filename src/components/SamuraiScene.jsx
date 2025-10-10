import React, { useEffect, useRef } from "react";

/**
 * SamuraiScene.jsx
 * - Lightweight WebGL fullscreen quad shader located where the samurai stands
 * - Renders a circular pedestal with animated rim and faint ripple
 * - No external libs required
 *
 * Usage: <SamuraiScene />
 */

export default function SamuraiScene() {
  const mountRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported for SamuraiScene");
      return;
    }

    // Resize helper
    const resize = () => {
      const w = Math.floor(mount.clientWidth * devicePixelRatio);
      const h = Math.floor(mount.clientHeight * devicePixelRatio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    // Vertex shader: full-screen triangle (cheap)
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader: circular pedestal with rim and subtle ripple
    const fs = `
      precision highp float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_res;

      // smooth circle
      float circleSDF(vec2 p, float r) {
        return length(p) - r;
      }

      void main() {
        // normalize coords to center (0,0)
        vec2 uv = v_uv;
        vec2 center = vec2(0.5, 0.55); // slightly lower to match feet
        vec2 pos = (uv - center) * vec2(u_res.x / u_res.y, 1.0);

        // pedestal base params
        float radius = 0.42;
        float d = circleSDF(pos, radius);

        // rim: smoothstep
        float rim = smoothstep(0.01, -0.02, d);
        float rimSoft = smoothstep(0.06, -0.06, d);

        // animated ripple (subtle)
        float ripple = 0.02 * sin(12.0 * length(pos) - u_time * 2.0) * exp(-2.0 * length(pos));

        // base color (dark paper tone)
        vec3 base = vec3(0.06, 0.04, 0.03);

        // rim light (red) and subtle highlight
        vec3 rimCol = vec3(1.0, 0.125, 0.125);
        float rimGlow = smoothstep(0.04, 0.0, abs(d - ripple));

        // combine
        vec3 color = base;
        // inside pedestal slightly lighter
        color += (1.0 - rimSoft) * 0.06;
        // rim contribution
        color = mix(color, rimCol * 0.9, rimGlow * rim * 0.85);

        // vignette falloff by distance
        float fog = exp(-2.5 * length(pos));
        color *= mix(0.8, 1.0, fog);

        // alpha so it's soft at edges
        float alpha = smoothstep(0.045, 0.03, abs(d + ripple));

        // subtle shadow beneath pedestal
        float shadow = smoothstep(0.35, 0.0, length(pos));
        color *= 0.6 + 0.4 * shadow;

        gl_FragColor = vec4(color, alpha * (rim + 0.5));
      }
    `;

    // compile shader helper
    const compile = (type, source) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(s);
        console.error("Shader compile error:", err);
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vsObj = compile(gl.VERTEX_SHADER, vs);
    const fsObj = compile(gl.FRAGMENT_SHADER, fs);
    if (!vsObj || !fsObj) return;

    const program = gl.createProgram();
    gl.attachShader(program, vsObj);
    gl.attachShader(program, fsObj);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // set up geometry (full-screen triangle)
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const verts = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_res");

    let start = performance.now();
    let mounted = true;

    const frame = () => {
      if (!mounted) return;
      resize();
      const now = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, now);
      gl.uniform2f(uRes, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

      // clear and draw
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    // cleanup
    return () => {
      mounted = false;
      try {
        mount.removeChild(canvas);
      // eslint-disable-next-line
      } catch (e) {}
      // delete GL resources if possible
      gl.deleteProgram(program);
      gl.deleteShader(vsObj);
      gl.deleteShader(fsObj);
      gl.deleteBuffer(quadBuf);
    };
  }, []);

  return <div className="samurai-scene" ref={mountRef} aria-hidden />;
}
