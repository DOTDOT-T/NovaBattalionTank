#include "PulseEngine/CustomScripts/IScripts.h"
#include "TankController.h"
#include "PulseEngine/API/EntityAPI/EntityApi.h"
#include "PulseEngine/API/CameraAPI/CameraAPI.h"
#include "PulseEngine/API/InputAPI/InputAPI.h"
// #include "PulseEngine/core/Lights/Lights.h"
// #include "PulseEngine/core/Lights/DirectionalLight/DirectionalLight.h"
#include "PulseEngine/API/PhysicAPI/PhysicAPI.h"
#include "PulseEngine/API/GameEntity.h"

#include <iostream>

void TankController::OnStart()
{


}

void TankController::OnUpdate()
{
    if(!cam)
    {
        PhysicAPI::SetBodyType(owner, true);
        PhysicAPI::SetBodySize(owner, PulseEngine::Vector3(1.5f,1.0f, 1.5f));
        cam = PulseEngine::GameEntity::GetActiveCamera();
    }
    static PulseEngine::Vector2 lastMouse(InputAPI::getMouseX(), InputAPI::getMouseY());
    static PulseEngine::Vector3 cinematicTarget = PulseEngine::Vector3(0.0f); 
    static int cinematicStage = 0;          
    static float cinematicTimer = 0.0f; 
    static float stageDuration = 4.0f;     
    static int manualCinematicStage = 0;   
    static bool cinematicManual = false;   

    PulseEngine::Vector2 mouse(InputAPI::getMouseX(), InputAPI::getMouseY());
    PulseEngine::Vector2 delta = mouse - lastMouse;

    const float moveSpeed = 0.1f;
    static float rot = 0.0f;

    
    if (InputAPI::isActionDown(1)) PhysicAPI::AddVelocity(owner, owner->GetTransform()->GetForward() * moveSpeed);
    if (InputAPI::isActionDown(0)) PhysicAPI::AddVelocity(owner, owner->GetTransform()->GetForward() * -moveSpeed);
    if (InputAPI::isActionDown(2)) PhysicAPI::AddAngularVelocityFromVectors(owner, owner->GetTransform()->GetForward(), owner->GetTransform()->GetRight());
    if (InputAPI::isActionDown(3)) PhysicAPI::AddAngularVelocityFromVectors(owner, owner->GetTransform()->GetForward(), owner->GetTransform()->GetRight() * -1.0f);

    
    if (InputAPI::isActionDown(4)) cinematicMode = !cinematicMode;        
    if (InputAPI::isActionDown(5)) cinematicManual = !cinematicManual;    

    
    if (cinematicManual)
    {
        if (InputAPI::isActionDown(6)) manualCinematicStage = (manualCinematicStage + 1) % 9; 
        if (InputAPI::isActionDown(7)) manualCinematicStage = (manualCinematicStage + 8) % 9; 
    }

    // owner->SetRotation(PulseEngine::Vector3(0.0f, rot, 0.0f));

    PulseEngine::Vector3 tankPos = owner->GetPosition();
    PulseEngine::Vector3 currentPos = PulseEngineInstance->GetActiveCamera()->Position;

    if (!cinematicMode)
    {
        
        // const float spacing = 25.0f;
        // const float camHeight = 5.0f;
        // PulseEngine::Vector3 targetPoint(
        //     std::round(tankPos.x / spacing) * spacing,
        //     camHeight,
        //     std::round(tankPos.z / spacing) * spacing
        // );
        // const float smoothSpeed = 5.0f;
        // PulseEngine::Vector3 newPos = currentPos + (targetPoint - currentPos) * (smoothSpeed * PulseEngineInstance->GetDeltaTime());
        PulseEngine::Vector3 newPos = tankPos + PulseEngine::Vector3(5.0f, 5.0f, 5.0f);
        cam->SetPosition(newPos);
        cam->SetLookAt(tankPos);
    }
    else
    {
        
        int stageToUse = cinematicManual ? manualCinematicStage : cinematicStage;

        
        PulseEngine::Vector3 tankForward = owner->GetTransform()->GetForward();
        PulseEngine::Vector3 tankRight = owner->GetTransform()->GetRight();

        switch(stageToUse)
        {
            case 5: 
            {
                PulseEngine::Vector3 offset(-5.0f, 3.0f, -5.0f); 
                cinematicTarget = tankPos + tankForward * offset.z + tankRight * offset.x + PulseEngine::Vector3(0.0f, offset.y, 0.0f);
                break;
            }
            case 6: 
            {
                static float lateralAngle = 0.0f;
                lateralAngle += 1.0f * PulseEngineInstance->GetDeltaTime();
                float radius = 20.0f;
                cinematicTarget = tankPos + PulseEngine::Vector3(std::cos(lateralAngle)*radius, 5.0f, std::sin(lateralAngle)*radius);
                break;
            }
            case 7: 
            {
                cinematicTarget = tankPos + PulseEngine::Vector3(0.0f, 20.0f, 0.0f);
                break;
            }
            case 8: 
            {
                PulseEngine::Vector3 offset(0.0f, 2.5f, -10.0f);
                cinematicTarget = tankPos + tankForward * offset.z + tankRight * offset.x + PulseEngine::Vector3(0.0f, offset.y, 0.0f);
                break;
            }
        }

        
        if (!cinematicManual)
        {
            cinematicTimer += PulseEngineInstance->GetDeltaTime();
            if (cinematicTimer >= stageDuration)
            {
                cinematicTimer = 0.0f;
                cinematicStage = (cinematicStage + 1) % 9; 

                if (cinematicStage >= 0 && cinematicStage <= 4)
                {
                    float radius = 20.0f + (rand() % 10);
                    float height = 5.0f + rand() % 10;
                    float angle = static_cast<float>(rand()) / RAND_MAX * 2.0f * 3.14159f;

                    switch(cinematicStage)
                    {
                        case 0: cinematicTarget = tankPos + PulseEngine::Vector3(std::cos(angle)*radius, height, std::sin(angle)*radius); stageDuration = 4.0f; break;
                        case 1: cinematicTarget = tankPos + PulseEngine::Vector3(0.0f, height, -radius); stageDuration = 3.0f; break;
                        case 2: cinematicTarget = tankPos + PulseEngine::Vector3(radius, height, 0.0f); stageDuration = 3.0f; break;
                        case 3: cinematicTarget = tankPos + PulseEngine::Vector3(0.0f, height + 5.0f, 0.0f); stageDuration = 2.5f; break;
                        case 4: cinematicTarget = tankPos + PulseEngine::Vector3(-radius, height, -radius); stageDuration = 5.0f; break;
                    }
                }
                else if (cinematicStage == 5) stageDuration = 6.0f;
                else if (cinematicStage == 6) stageDuration = 10.0f;
                else if (cinematicStage == 7) stageDuration = 4.0f;
                else if (cinematicStage == 8) stageDuration = 3.5f;
            }
        }

        
        const float cinematicSpeed = 2.5f;
        PulseEngine::Vector3 newPos = currentPos + (cinematicTarget - currentPos) * (cinematicSpeed * PulseEngineInstance->GetDeltaTime());
        cam->SetPosition(newPos);
        cam->SetLookAt(tankPos);
    }

    
    // PulseEngineInstance->lights[0]->SetPosition(tankPos + PulseEngine::Vector3(5.0f, 5.0f, 7.0f));
    // dynamic_cast<DirectionalLight*>(PulseEngineInstance->lights[0])->target = tankPos;

    lastMouse = mouse;
}


void TankController::OnRender()
{

}

void TankController::OnEditorDisplay()
{
    
}

const char* TankController::GetName() const
{
    return "PulseScriptTankController";
}


extern "C" __declspec(dllexport) IScript* PulseScriptTankController()
{
    return new TankController();
}

