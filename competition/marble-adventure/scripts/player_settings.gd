extends Node
## Persists accessibility and comfort settings.

const SAVE_PATH := "user://player_settings.json"

signal settings_changed

var fov := 80.0
var mouse_sensitivity := 0.002
var colorblind_icons := false


func _ready() -> void:
	_load()


func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	fov = clampf(float(parsed.get("fov", fov)), 30.0, 110.0)
	mouse_sensitivity = clampf(float(parsed.get("mouse_sensitivity", mouse_sensitivity)), 0.0005, 0.008)
	colorblind_icons = bool(parsed.get("colorblind_icons", colorblind_icons))


func save() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify({
		"fov": fov,
		"mouse_sensitivity": mouse_sensitivity,
		"colorblind_icons": colorblind_icons,
	}))
	file.close()
	settings_changed.emit()


func apply_to_player(player: Node) -> void:
	if player == null:
		return
	if "mouse_sensitivity" in player:
		player.mouse_sensitivity = mouse_sensitivity
	var cam: Camera3D = player.get_node_or_null("Camera3D")
	if cam:
		cam.fov = fov
