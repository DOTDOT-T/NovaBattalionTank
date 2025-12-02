#version 330 core
in vec3 worldPos;
out vec4 FragColor;

uniform float gridSpacing = 1.0;
uniform float gridThickness = 0.03;
uniform vec3 gridColor = vec3(0.5, 0.5, 0.5);
uniform vec3 axisColorX = vec3(1.0, 0.0, 0.0);
uniform vec3 axisColorZ = vec3(0.0, 0.0, 1.0);

void main()
{
    float lineX = abs(fract(worldPos.x / gridSpacing - 0.5) - 0.5) / fwidth(worldPos.x);
    float lineZ = abs(fract(worldPos.z / gridSpacing - 0.5) - 0.5) / fwidth(worldPos.z);
    float grid = min(lineX, lineZ);
    float axisX = smoothstep(0.0, gridThickness, abs(worldPos.x));
    float axisZ = smoothstep(0.0, gridThickness, abs(worldPos.z));

    vec3 color = gridColor;
    float alpha = 0.0;
    // Axis lines: fully opaque
    if (axisX < 0.1) {
        color = axisColorX;
        alpha = 1.0;
    } else if (axisZ < 0.1) {
        color = axisColorZ;
        alpha = 1.0;
    } else if (min(lineX, lineZ) < 1.0) {
        // Grid lines: semi-transparent
        alpha = 0.5;
    }
    FragColor = vec4(color, alpha);
}
