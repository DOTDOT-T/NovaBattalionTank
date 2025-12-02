#version 460 core

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in ivec4 a_BoneIDs;
layout(location = 3) in vec3 aTangent;
layout(location = 4) in vec2 aTexCoords;
layout(location = 5) in vec4 a_BoneWeights;
layout(location = 6) in vec3 aBitangent;

uniform mat4 model;
uniform vec3 lightPos;
uniform vec3 target;

#define MAX_BONES 128
uniform mat4 u_BoneMatrices[MAX_BONES];

mat4 makeLookAt(vec3 eye, vec3 center, vec3 up)
{
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);

    mat4 m = mat4(1.0);
    m[0][0] =  s.x; m[1][0] =  s.y; m[2][0] =  s.z;
    m[0][1] =  u.x; m[1][1] =  u.y; m[2][1] =  u.z;
    m[0][2] = -f.x; m[1][2] = -f.y; m[2][2] = -f.z;
    m[3][0] = -dot(s, eye);
    m[3][1] = -dot(u, eye);
    m[3][2] =  dot(f, eye);
    return m;
}

mat4 makeOrtho(float left, float right, float bottom, float top, float near, float far)
{
    mat4 m = mat4(1.0);
    m[0][0] = 2.0 / (right - left);
    m[1][1] = 2.0 / (top - bottom);
    m[2][2] = -2.0 / (far - near);
    m[3][0] = -(right + left) / (right - left);
    m[3][1] = -(top + bottom) / (top - bottom);
    m[3][2] = -(far + near) / (far - near);
    return m;
}

void main()
{
    // View/Projection pour la light
    vec3 up = vec3(0.0, 1.0, 0.0);
    mat4 lightView = makeLookAt(lightPos, target, up);
    mat4 lightProj = makeOrtho(-10.0, 10.0, -10.0, 10.0, 0.1, 40.0);
    mat4 fakeShadowMatrix = lightProj * lightView;

    // --- Skinning universel ---
    // Par défaut : identité → mesh statique
    mat4 skinMatrix = mat4(1.0);

    // Si l'objet a des bones valides, le CPU aura rempli u_BoneMatrices
    // (sinon elles sont toutes identité, aucun coût de test)
    float totalWeight = 
    abs(a_BoneWeights.x) + abs(a_BoneWeights.y) +
    abs(a_BoneWeights.z) + abs(a_BoneWeights.w);

    if (totalWeight > 0.999 && totalWeight <= 1.001)
    {
        skinMatrix =
            a_BoneWeights.x * u_BoneMatrices[clamp(a_BoneIDs.x, 0, MAX_BONES - 1)] +
            a_BoneWeights.y * u_BoneMatrices[clamp(a_BoneIDs.y, 0, MAX_BONES - 1)] +
            a_BoneWeights.z * u_BoneMatrices[clamp(a_BoneIDs.z, 0, MAX_BONES - 1)] +
            a_BoneWeights.w * u_BoneMatrices[clamp(a_BoneIDs.w, 0, MAX_BONES - 1)];
        vec4 skinnedPos = skinMatrix * vec4(aPos, 1.0);
        gl_Position = fakeShadowMatrix * model * skinnedPos;
    }
    else
    {
        gl_Position = fakeShadowMatrix * model * vec4(aPos, 1.0);

    }
    // Position finale
}
