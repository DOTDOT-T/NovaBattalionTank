#include "PulseEngine/CustomScripts/IScripts.h"
#include "FloorInit.h"

void FloorInit::OnStart()
{
    // Your initialization code here
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

