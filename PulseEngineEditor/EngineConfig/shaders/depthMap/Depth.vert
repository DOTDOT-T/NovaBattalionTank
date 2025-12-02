#version 460 core
layout(location = 0) in vec3 aPos;

uniform mat4 shadowMatrix;
uniform mat4 model;
// uniform bool hasSkeleton;

void main()
{
    gl_Position = shadowMatrix * model * vec4(aPos, 1.0);
}
