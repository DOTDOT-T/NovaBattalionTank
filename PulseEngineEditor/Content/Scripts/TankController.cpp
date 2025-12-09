#include "PulseEngine/CustomScripts/IScripts.h"
#include "TankController.h"
#include "PulseEngine/API/EntityAPI/EntityApi.h"

#include <iostream>

void TankController::OnStart()
{
    owner->SetColliderSize(PulseEngine::Vector3(3.0f,2.0f,3.5f));
    owner->SetColliderMass(900.0f);
    owner->SetColliderBody(1);
}

void TankController::OnUpdate()
{
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

