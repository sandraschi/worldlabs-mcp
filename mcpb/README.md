# worldlabs-mcp (MCPB Bundle)

MCP server wrapping the World Labs Marble API for 3D world generation and the Spark 2.0 spatial viewer

## Usage

Add to \claude_desktop_config.json\:
\\\json
{
  "mcpServers": {
    "worldlabs-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "\D:\Dev\repos", "python", "-m", "worldlabs_mcp"],
      "env": { "PYTHONPATH": "\D:\Dev\repos/src" }
    }
  }
}
\\\

## Tools

- **get_system_stats**: get_system_stats
- **push_narration**: push_narration
- **adb_devices**: adb_devices
- **narration_stream**: narration_stream
- **logs_stream**: logs_stream
- **health**: health
- **system_info**: system_info
- **capabilities**: capabilities
- **serve_local_asset**: serve_local_asset
- **list_local_assets**: list_local_assets
- **serve_tts_audio**: serve_tts_audio
- **tts_status**: tts_status
- **get_default_agent**: get_default_agent
- **generate_from_text**: generate_from_text
- **generate_from_image**: generate_from_image
- **generate_from_video**: generate_from_video
- **generate_from_upload**: generate_from_upload
- **get_media_asset**: get_media_asset
- **get_operation**: get_operation
- **stream_operation**: stream_operation
- **get_world**: get_world
- **delete_world**: delete_world
- **download_world_asset**: download_world_asset
- **get_history**: get_history
- **get_remote_history**: get_remote_history
- **list_prompts**: list_prompts
- **create_prompt**: create_prompt
- **update_prompt**: update_prompt
- **delete_prompt**: delete_prompt
- **discover_llms**: discover_llms
- **refine_prompt**: refine_prompt
- **export_to_blender**: export_to_blender
- **export_to_unity3d**: export_to_unity3d
- **export_to_resonite**: export_to_resonite
- **proxy_splat_asset**: proxy_splat_asset
- **handoff_asset**: handoff_asset
- **list_scenes**: list_scenes
- **bake_scene**: bake_scene
- **delete_scene**: delete_scene
- **search_plex**: search_plex
- **get_plex_stream_url**: get_plex_stream_url
- **avatar_mcp_status**: avatar_mcp_status
- **place_avatar_in_world**: place_avatar_in_world
- **show_worlds_card**: show_worlds_card
- **show_world_card**: show_world_card
- **generate_world_from_text**: generate_world_from_text
- **generate_world_from_image**: generate_world_from_image
- **generate_world_from_multi_image**: generate_world_from_multi_image
- **generate_world_from_video**: generate_world_from_video
- **upload_and_generate**: upload_and_generate
- **prepare_media_upload**: prepare_media_upload
- **generate_world_from_media_asset**: generate_world_from_media_asset
- **wait_for_world**: wait_for_world
- **list_worlds**: list_worlds
- **broadcast_spatial_audio**: broadcast_spatial_audio
- **place_world_tv**: place_world_tv
- **spawn_agent_avatar**: spawn_agent_avatar
- **broadcast_spatial_notification**: broadcast_spatial_notification
- **refine_with_local_llm**: refine_with_local_llm
- **worldlabs_help**: worldlabs_help

## Requirements

- Python 3.12+
- uv
