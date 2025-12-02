#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec3 Tangent;
in vec3 Bitangent;

out vec4 FragColor;

// === MATERIAL ===
uniform vec3 viewPos;
uniform vec3 objectColor;

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;

// === LIGHT ===
struct DirectionalLight
{
    vec3 direction;
    vec3 target;
    vec3 color;
    float intensity;
    bool castsShadow;
    float near;
    float far;
    sampler2D shadowMap;
    vec3 position;
};

uniform DirectionalLight dirLight;

// === MATRIX HELPERS ===
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

// === SHADOW CALC ===
float CalculateDirectionalShadow(DirectionalLight light, vec3 fragPos, vec3 normal)
{
    vec3 up = vec3(0.0, 1.0, 0.0);
    mat4 lightView = makeLookAt(light.position, light.target, up);
    mat4 lightProj = makeOrtho(-10.0, 10.0, -10.0, 10.0, 0.1, 40.0);
    mat4 lightSpaceMatrix = lightProj * lightView;

    vec4 fragPosLightSpace = lightSpaceMatrix * vec4(fragPos, 1.0);
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    // outside light frustum
    if (projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0 ||
        projCoords.z > 1.0)
        return 0.0;

    float closestDepth = texture(light.shadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    // normal-dependent bias
    vec3 lightDir = normalize(light.target - light.position);
    float bias = max(0.0005 * (1.0 - dot(normal, lightDir)), 0.00005);

    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    return shadow;
}

// === NORMAL MAPPING ===
vec3 GetNormalFromMap(vec3 normal, vec3 tangent, vec3 bitangent)
{
    // Tangent space normal (RGB → [-1,1])
    vec3 tangentNormal = texture(normalMap, TexCoords).rgb * 2.0 - 1.0;

    // Construct TBN matrix
    vec3 N = normalize(normal);
    vec3 T = normalize(tangent - dot(tangent, N) * N);
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

// === LIGHTING ===
vec3 ComputeDirectionalLight(DirectionalLight light, vec3 normal, vec3 viewDir, vec3 fragPos, float roughness)
{
    vec3 lightDir = normalize(light.target - light.position);
    lightDir = normalize(-lightDir);
    float NdotL = max(dot(normal, lightDir), 0.0);

    // diffuse
    vec3 diffuse = light.color * light.intensity * NdotL;

    // specular (Blinn–Phong, roughness² → exponent remap)
    float gloss = pow(1.0 - roughness, 2.0);
    float specPower = mix(2.0, 256.0, gloss);
    vec3 halfway = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfway), 0.0), specPower);
    vec3 specular = spec * light.color;

    float shadow = light.castsShadow ? CalculateDirectionalShadow(light, fragPos, normal) : 0.0;
    return shadow < 1.0 ? (1.0 - shadow) * (specular + diffuse) : vec3(0.05, 0.05, 0.05);
}

// === MAIN ===
void main()
{
    // sample textures
    vec4 albedoColor = texture(albedoMap, TexCoords);
    float roughness = texture(roughnessMap, TexCoords).r;

    // view direction
    vec3 viewDir = normalize(viewPos - FragPos);

    // proper tangent-space normal
    vec3 norm = GetNormalFromMap(Normal, Tangent, Bitangent);

    // lighting
    vec3 lightResult = ComputeDirectionalLight(dirLight, norm, viewDir, FragPos, roughness);

    // final shading
    vec3 color = lightResult * albedoColor.rgb;
    FragColor = vec4(color, 1.0);
}
