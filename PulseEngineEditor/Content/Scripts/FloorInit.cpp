#include "PulseEngine/CustomScripts/IScripts.h"
#include "FloorInit.h"
#include "PulseEngine/API/EntityAPI/EntityApi.h"

void FloorInit::OnStart()
{
    owner->SetColliderSize(PulseEngine::Vector3(100.0f,0.2f,100.0f));
    owner->SetColliderMass(900000.0f);
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

