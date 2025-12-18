#include "PulseEngine/CustomScripts/IScripts.h"
#include "FloorInit.h"
#include "PulseEngine/API/EntityAPI/EntityApi.h"
#include "PulseEngine/API/PhysicAPI/PhysicAPI.h"

void FloorInit::OnStart()
{
    EDITOR_LOG("x : " << owner->GetTransform()->scale.x << " y : " << owner->GetTransform()->scale.y << " z : " << owner->GetTransform()->scale.z);
    PhysicAPI::SetBodySize(owner, PulseEngine::Vector3(std::abs(owner->GetTransform()->scale.x),0.1f, std::abs(owner->GetTransform()->scale.z)));
}

void FloorInit::OnUpdate()
{
    // Your update code here
}

void FloorInit::OnRender()
{
    // Your render code here
}

void FloorInit::OnEditorDisplay()
{
    // Your render code for editor here
}

const char* FloorInit::GetName() const
{
    return "PulseScriptFloorInit";
}

// Register the script
extern "C" __declspec(dllexport) IScript* PulseScriptFloorInit()
{
    return new FloorInit();
}

