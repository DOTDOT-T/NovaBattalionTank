cmake_minimum_required(VERSION 3.15)
project(UserScripts LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
# Print the source directory
message(STATUS "CMake source directory: ${CMAKE_SOURCE_DIR}")

# Print the build directory
message(STATUS "CMake binary/build directory: ${CMAKE_BINARY_DIR}")

# Optional: print where the DLL will be output
message(STATUS "Runtime output directory: ${CMAKE_SOURCE_DIR}/build")

# DLL creation
set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
add_library(UserScripts SHARED)

target_compile_definitions(UserScripts PRIVATE
    BUILDING_DLL
    PULSE_GRAPHIC_OPENGL
    PULSE_WINDOWS
)

# Includes
target_include_directories(UserScripts PRIVATE
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor
    ${CMAKE_SOURCE_DIR}/dist/include
    ${CMAKE_SOURCE_DIR}/dist/src
    ${CMAKE_SOURCE_DIR}/dist/src/dllexport
)

# Find all sources in UserScripts
file(GLOB_RECURSE USER_SCRIPTS_SRC
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor/*.cpp
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor/*.h
)

target_sources(UserScripts PRIVATE ${USER_SCRIPTS_SRC})

target_link_directories(UserScripts PRIVATE
    ${CMAKE_SOURCE_DIR}/dist
)

# Link engine static libs
target_link_libraries(UserScripts PRIVATE
    PulseEngine.AllInOne
    ws2_32
    winmm
    mswsock
)

# Output directory
set_target_properties(UserScripts PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build
)

# Copy DLL to build/ after successful build (optional if you want a second copy somewhere else)
add_custom_command(TARGET UserScripts POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
            $<TARGET_FILE:UserScripts>
            ${CMAKE_SOURCE_DIR}/build/CustomScripts.dll
    COMMENT "Copying CustomScripts.dll to build/"
)
