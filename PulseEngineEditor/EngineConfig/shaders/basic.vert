#version 330 core

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout (location = 2) in ivec4 a_BoneIDs;
layout(location = 3) in vec3 aTangent;
layout(location = 4) in vec2 aTexCoords;
layout (location = 5) in vec4 a_BoneWeights;
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

#define MAX_BONES 128
uniform mat4 u_BoneMatrices[MAX_BONES];

void main()
{
    mat4 skinMatrix = mat4(1.0);
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = normalize(mat3(transpose(inverse(model))) * aNormal);
    Tangent = normalize(mat3(model) * aTangent);
    Bitangent = normalize(mat3(model) * aBitangent);
    TexCoords = aTexCoords;

    if(hasSkeleton)
    {
        skinMatrix = 
            a_BoneWeights.x * u_BoneMatrices[int(a_BoneIDs.x)] +
            a_BoneWeights.y * u_BoneMatrices[int(a_BoneIDs.y)] +
            a_BoneWeights.z * u_BoneMatrices[int(a_BoneIDs.z)] +
            a_BoneWeights.w * u_BoneMatrices[int(a_BoneIDs.w)];

        vec4 skinnedPos = skinMatrix * vec4(aPos, 1.0);
        gl_Position = projection * view * model * skinnedPos;

    }
    else
    {
        gl_Position = projection * view * vec4(FragPos, 1.0);    
    }

    
}
