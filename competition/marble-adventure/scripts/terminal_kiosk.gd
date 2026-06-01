extends Area3D
## Fleet terminal — press E when nearby to show kiosk text in HUD.

@export var kiosk_id: String = ""
@export var kiosk_title: String = "Terminal"
@export_multiline var kiosk_body: String = ""

var _player_near := false


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	add_to_group("terminal_kiosk")


func _on_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_near = true
		if WorldManager:
			WorldManager.set_active_kiosk(kiosk_id, kiosk_title, kiosk_body)


func _on_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_near = false
		if WorldManager:
			WorldManager.clear_active_kiosk(kiosk_id)
