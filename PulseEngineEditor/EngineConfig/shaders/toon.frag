#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec3 Tangent;
in vec3 Bitangent;

out vec4 FragColor;

// === MATERIAL (existing uniforms kept, no new uniforms added) ===
uniform vec3 viewPos;
uniform vec3 objectColor;

uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;

// === LIGHT (as provided) ===
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

// === CONSTANT ART PARAMETERS (no uniforms) ===
const int   TOON_LEVELS = 3;          // number of cel bands
const float RIM_INTENS   = 0.45;      // rim highlight intensity
const float RIM_POWER    = 2.0;       // rim falloff
const float OUTLINE_STR  = 0.95;      // silhouette bias strength (higher -> thicker)
const float OUTLINE_THRESH = 0.45;    // where silhouette starts
const float OUTLINE_WIDTH  = 0.18;    // smoothstep width for silhouette
const vec3  OUTLINE_COL = vec3(0.02); // near-black ink

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

// === SHADOW CALC (simple PCF, constants) ===
float CalculateDirectionalShadow(DirectionalLight light, vec3 fragPos, vec3 normal)
{
    vec3 up = vec3(0.0, 1.0, 0.0);
    mat4 lightView = makeLookAt(light.position, light.target, up);
    mat4 lightProj = makeOrtho(-10.0, 10.0, -10.0, 10.0, 0.1, 40.0);
    mat4 lightSpaceMatrix = lightProj * lightView;

    vec4 fragPosLightSpace = lightSpaceMatrix * vec4(fragPos, 1.0);
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0)
        return 0.0;

    vec3 lightDir = normalize(light.position - light.target);
    float bias = max(0.001 * (1.0 - dot(normal, -lightDir)), 0.0001);
    float currentDepth = projCoords.z;

    float shadow = 0.0;
    vec2 texel = 1.0 / textureSize(light.shadowMap, 0);

    // small fixed kernel that balances quality/perf
    const int KERNEL = 2; // 5x5
    int total = (KERNEL*2+1)*(KERNEL*2+1);

    for (int x = -KERNEL; x <= KERNEL; ++x)
    {
        for (int y = -KERNEL; y <= KERNEL; ++y)
        {
            vec2 ofs = vec2(x, y) * texel;
            float pcfDepth = texture(light.shadowMap, projCoords.xy + ofs).r;
            shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
        }
    }
    shadow /= float(total);
    return shadow;
}

// === NORMAL MAPPING ===
vec3 GetNormalFromMap(vec3 normal, vec3 tangent, vec3 bitangent)
{
    vec3 tangentNormal = texture(normalMap, TexCoords).rgb * 2.0 - 1.0;

    vec3 N = normalize(normal);
    vec3 T = normalize(tangent - dot(tangent, N) * N);
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

// === HELPERS ===
float QuantizeFloat(float v, int levels)
{
    if (levels <= 1) return v;
    float l = float(levels);
    return floor(v * l) / l;
}

// fast "ramp" approximation (no texture): bias + gain + piecewise smooth
vec3 RampShade(float intensity)
{
    // borderlands palette feel: slightly desaturated mid, dark ink accent
    if (intensity < 0.25) return vec3(0.08, 0.06, 0.05);          // almost shadow tint
    else if (intensity < 0.5) return vec3(0.55, 0.45, 0.38);     // mid tone
    else if (intensity < 0.75) return vec3(0.85, 0.75, 0.66);    // light tone
    return vec3(1.0, 0.95, 0.88);                               // highlight
}

// === LIGHTING (toon/Borderlands-like) ===
vec3 ComputeDirectionalLightToon(DirectionalLight light, vec3 normal, vec3 viewDir, vec3 fragPos, float roughness)
{
    // derive light dir (direction from light to target then invert to get incoming)
    vec3 lightDir = normalize(light.target - light.position);
    lightDir = normalize(-lightDir);

    float NdotL = max(dot(normal, lightDir), 0.0);

    // quantized diffuse using TOON_LEVELS
    float q = QuantizeFloat(NdotL, TOON_LEVELS);
    vec3 diffuseTone = RampShade(q);

    // multiply by light color + intensity (keeps stylized color)
    vec3 diffuse = diffuseTone * light.color * light.intensity * q;

    // specular: Blinn style but quantized and compressed (Borderlands has strong stylized highlights)
    float gloss = pow(1.0 - roughness, 2.0);
    float specPower = mix(4.0, 128.0, gloss);
    vec3 halfway = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfway), 0.0), specPower);
    float qSpec = QuantizeFloat(spec, TOON_LEVELS);
    vec3 specular = light.color * (qSpec * 1.2);

    // stylized rim
    float NdotV = max(dot(normal, viewDir), 0.0);
    float rim = pow(1.0 - NdotV, RIM_POWER) * RIM_INTENS;
    vec3 rimCol = vec3(rim);

    // shadow (keeps PCF)
    float shadow = light.castsShadow ? CalculateDirectionalShadow(light, fragPos, normal) : 0.0;

    // combine
    vec3 combined = diffuse + specular + rimCol;

    // when fully in shadow, keep a low ambient ink-tone, not full black
    if (shadow >= 1.0) return vec3(0.05, 0.04, 0.03);

    return (1.0 - shadow) * combined;
}

// === EDGE / INK DETECTION (single-pass silhouette + creases) ===
float InkEdgeFactor(vec3 N, vec3 V, vec3 L)
{
    // silhouette component (view angle)
    float sil = 1.0 - clamp(dot(N, V), 0.0, 1.0); // 0 @ facing, 1 @ grazing

    // crease component (lighting crease)
    float crease = 1.0 - abs(dot(N, L)); // high at grazing between N and L

    // normal variance in screen-space (gives crisp/local ink strokes on sharp normal changes)
    vec3 dndx = dFdx(N);
    vec3 dndy = dFdy(N);
    float normVariance = length(dndx) + length(dndy); // bigger on normal discontinuities

    // combine heuristics; OUTLINE_STR boosts silhouette/crease contribution
    float edge = max(sil * OUTLINE_STR, crease * 0.8) + clamp(normVariance * 25.0, 0.0, 1.0);

    return clamp(edge, 0.0, 1.0);
}

// === MAIN ===
void main()
{
    // sample textures
    vec4 albedoColor = texture(albedoMap, TexCoords);
    float roughness = texture(roughnessMap, TexCoords).r;

    // view direction
    vec3 viewDir = normalize(viewPos - FragPos);

    // tangent-space normal
    vec3 norm = GetNormalFromMap(Normal, Tangent, Bitangent);

    // lighting result (toon)
    vec3 lightResult = ComputeDirectionalLightToon(dirLight, norm, viewDir, FragPos, roughness);

    // base color tinted by albedo (art direction)
    vec3 color = lightResult * albedoColor.rgb;

    // compute edge/ink factor (uses same light direction as shading)
    vec3 lightDirScene = normalize(dirLight.target - dirLight.position);
    lightDirScene = normalize(-lightDirScene);

    float edge = InkEdgeFactor(norm, viewDir, lightDirScene);

    // silhouette smoothstep to create thick outer stroke
    float silhouette = smoothstep(OUTLINE_THRESH, OUTLINE_THRESH + OUTLINE_WIDTH, edge);

    // darken and push toward outline color at silhouette/crease regions
    // raise silhouette to add contrast on the strongest lines
    float inkStrength = pow(silhouette, 1.3);
    color = mix(color, OUTLINE_COL, inkStrength);

    // final tone mapping / slight gamma compress to emulate comic print
    color = pow(color, vec3(1.0/2.2));

    FragColor = vec4(color, 1.0);
}
