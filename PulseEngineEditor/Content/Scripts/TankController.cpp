#include "PulseEngine/CustomScripts/IScripts.h"
#include "TankController.h"

void TankController::OnStart()
{
    // Your initialization code here
}

void TankController::OnUpdate()
{
    // Your update code here
}

void TankController::OnRender()
{
    // Your render code here
}

void TankController::OnEditorDisplay()
{
    // Your render code for editor here
}

const char* TankController::GetName() const
{
    return "PulseScriptTankController";
}

// Register the script
extern "C" __declspec(dllexport) IScript* PulseScriptTankController()
{
    return new TankController();
}

