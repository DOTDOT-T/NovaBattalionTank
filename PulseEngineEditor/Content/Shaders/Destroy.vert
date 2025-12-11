#version 330 core

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in ivec4 a_BoneIDs;
layout(location = 3) in vec3 aTangent;
layout(location = 4) in vec2 aTexCoords;
layout(location = 5) in vec4 a_BoneWeights;
layout(location = 6) in vec3 aBitangent;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;
out vec3 Tangent;
out vec3 Bitangent;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

uniform bool hasSkeleton;
uniform float internalClock;

#define MAX_BONES 128
uniform mat4 u_BoneMatrices[MAX_BONES];

float rand(vec3 co){
    return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,45.164))) * 43758.5453);
}

void main()
{
    vec3 pos = aPos;

    // --- Skeleton
    if(hasSkeleton)
    {
        mat4 skinMatrix = 
            a_BoneWeights.x * u_BoneMatrices[int(a_BoneIDs.x)] +
            a_BoneWeights.y * u_BoneMatrices[int(a_BoneIDs.y)] +
            a_BoneWeights.z * u_BoneMatrices[int(a_BoneIDs.z)] +
            a_BoneWeights.w * u_BoneMatrices[int(a_BoneIDs.w)];
        pos = vec3(skinMatrix * vec4(pos, 1.0));
    }

    // --- Explosion force
    float t = internalClock;
    float explode = pow(sin(t * 3.0) * 1.5, 3.0); // intensité progressive
    pos += aNormal * explode;

    // --- Spin & twist
    float angle = explode * 12.0 + rand(pos)*6.2831; // random rotation per vertex
    float s = sin(angle);
    float c = cos(angle);
    pos = vec3(pos.x * c - pos.z * s, pos.y + sin(t*5.0+rand(pos)*10.0)*0.3, pos.x * s + pos.z * c);

    // --- Vibration / noise
    pos += aNormal * sin(dot(pos.xy, vec2(12.3, 45.6)) * 5.0 + t*10.0) * 0.2;

    FragPos = vec3(model * vec4(pos, 1.0));
    Normal = normalize(mat3(transpose(inverse(model))) * aNormal);
    Tangent = normalize(mat3(model) * aTangent);
    Bitangent = normalize(mat3(model) * aBitangent);
    TexCoords = aTexCoords;

    gl_Position = projection * view * vec4(FragPos, 1.0);
}
