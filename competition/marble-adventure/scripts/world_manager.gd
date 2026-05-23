extends Node
## WorldManager — Manages hub scene reference. Portals open Spark viewer directly.

var hub_scene: Node3D = null
var player_node: Node3D = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	name = "WorldManager"


func register_world(_id: String, _name: String, _desc: String = "", _color: Color = Color.WHITE) -> void:
	pass


func register_player(p: Node3D) -> void:
	player_node = p
