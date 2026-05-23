extends Control

@onready var world_label: Label = $WorldLabel
@onready var hint_label: Label = $HintLabel

var _started := false


func _ready() -> void:
	if WorldManager:
		WorldManager.world_entered.connect(_on_world_entered)
		WorldManager.hub_entered.connect(_on_hub_entered)


func on_game_started() -> void:
	_started = true
	if hint_label:
		hint_label.text = "WASD: Move | Mouse: Look | Scroll: Zoom | Walk into rings"
	if world_label:
		world_label.text = ""


func _on_world_entered(world_id: String, world_name: String) -> void:
	if world_label:
		world_label.text = world_name
	if hint_label:
		hint_label.text = "Walk into the return portal to go back"


func _on_hub_entered() -> void:
	if world_label:
		world_label.text = ""
	if hint_label and _started:
		hint_label.text = "WASD: Move | Mouse: Look | Walk into a portal to enter a world"
