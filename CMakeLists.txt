cmake_minimum_required(VERSION 4.0.1)
project(UserScripts LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Debug info
message(STATUS "CMake source directory: ${CMAKE_SOURCE_DIR}")
message(STATUS "CMake binary/build directory: ${CMAKE_BINARY_DIR}")
message(STATUS "Runtime output directory: ${CMAKE_SOURCE_DIR}/build")

# ============================================
#   DLL UserScripts
# ============================================

add_library(UserScripts SHARED)

target_compile_definitions(UserScripts PRIVATE
    PULSE_WINDOWS
    PULSE_ENGINE_DLL_IMPORT
)

# Includes
target_include_directories(UserScripts PRIVATE
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor
    ${CMAKE_SOURCE_DIR}/dist/include
    ${CMAKE_SOURCE_DIR}/dist/src
    ${CMAKE_SOURCE_DIR}/dist/src/dllexport
)

# Source files
file(GLOB_RECURSE USER_SCRIPTS_SRC
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor/*.cpp
    ${CMAKE_SOURCE_DIR}/PulseEngineEditor/*.h
)

target_sources(UserScripts PRIVATE ${USER_SCRIPTS_SRC})

# Engine lib directory
target_link_directories(UserScripts PRIVATE
    ${CMAKE_SOURCE_DIR}/dist
)

# Linking
target_link_libraries(UserScripts PRIVATE
    ${CMAKE_SOURCE_DIR}/dist/PulseEngine.AllInOne.lib
    ws2_32
    winmm
    mswsock
)

# Output directory
set_target_properties(UserScripts PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build
)

# Copy DLL after build
add_custom_command(
    TARGET UserScripts POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
            $<TARGET_FILE:UserScripts>
            ${CMAKE_SOURCE_DIR}/build/CustomScripts.dll
    COMMAND ${CMAKE_COMMAND} -E copy
            $<TARGET_FILE:UserScripts>
            ${CMAKE_SOURCE_DIR}/CustomScripts.dll
    COMMENT "Copying CustomScripts.dll to build/"
)
