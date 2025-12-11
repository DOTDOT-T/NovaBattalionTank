#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;
in vec3 Tangent;
in vec3 Bitangent;

out vec4 FragColor;

uniform float internalClock;

void main()
{
    float t = internalClock;

    // --- Couleur dynamique
    vec3 baseColor = vec3(1.0, 0.4, 0.0); // Orange / feu
    float flicker = 0.5 + 0.5*sin(dot(FragPos.xy, vec2(12.0,7.0)) + t*20.0);
    vec3 glow = baseColor * flicker;

    // --- Dissolution progressive
    float dissolve = fract(sin(dot(FragPos.xyz, vec3(3.0,7.0,11.0)) + t*5.0)*1000.0);
    glow *= smoothstep(0.0, 0.8, dissolve);

    // --- Explosion brightness
    glow += vec3(1.0,1.0,0.5) * pow(flicker, 3.0);

    FragColor = vec4(glow,1.0);
}
