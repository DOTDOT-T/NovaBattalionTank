#pragma once

#include "PulseEngine/CustomScripts/IScripts.h"
#include "Common/dllExport.h"

class CameraAPI;

class CameraCin : public IScript
{
    public:
        CameraCin()
        {
            // if you need to expose variables, do it here with these macro : 
            // AddExposedVariable(EXPOSE_VAR(speed, INT));
            // REGISTER_VAR(speed); both are needed to make the variable exposed in the editor
        }
        void OnStart() override;
        void OnUpdate() override;
        void OnRender() override;
        void OnEditorDisplay() override;
        const char* GetName() const override;

        CameraAPI* cam = nullptr;

        bool cinematicMode = false;   
};

