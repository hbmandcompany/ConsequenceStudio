export const NOTE_VERTEX_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;

in vec2 a_corner;
in vec4 a_rect;
in vec4 a_color;
in float a_selected;

out vec4 v_color;
out vec2 v_local;
out vec2 v_half;
out float v_selected;

void main() {
  vec2 pixel = a_rect.xy + a_corner * a_rect.zw;
  gl_Position = vec4(
    (pixel.x / u_resolution.x) * 2.0 - 1.0,
    1.0 - (pixel.y / u_resolution.y) * 2.0,
    0.0,
    1.0
  );
  v_color = a_color;
  v_local = (a_corner - 0.5) * a_rect.zw;
  v_half = a_rect.zw * 0.5;
  v_selected = a_selected;
}
`;

export const NOTE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_local;
in vec2 v_half;
in float v_selected;

out vec4 outColor;

float sdRoundRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float radius = min(8.0, min(v_half.x, v_half.y));
  float d = sdRoundRect(v_local, v_half, radius);
  float alpha = 1.0 - smoothstep(-1.0, 0.5, d);
  if (alpha < 0.01) discard;
  vec3 fill = v_color.rgb * 0.7;
  float border = smoothstep(1.5, 0.0, abs(d));
  vec3 borderColor = v_selected > 0.5 ? vec3(1.0) : v_color.rgb;
  float borderMix = v_selected > 0.5 ? smoothstep(2.0, 0.0, abs(d)) : border;
  vec3 color = mix(fill, borderColor, borderMix);
  outColor = vec4(color, alpha * v_color.a);
}
`;

export const GRID_VERTEX_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
in vec2 a_position;

void main() {
  gl_Position = vec4(
    (a_position.x / u_resolution.x) * 2.0 - 1.0,
    1.0 - (a_position.y / u_resolution.y) * 2.0,
    0.0,
    1.0
  );
}
`;

export const GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

export const PLAYHEAD_VERTEX_SHADER = GRID_VERTEX_SHADER;
export const PLAYHEAD_FRAGMENT_SHADER = GRID_FRAGMENT_SHADER;
