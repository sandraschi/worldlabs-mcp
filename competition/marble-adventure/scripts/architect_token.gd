extends Area3D
## Collectible architect token — unlocks extended terminal lore.

@export var token_id: String = ""


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	add_to_group("architect_token")


func _on_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	if WorldManager and WorldManager.collect_token(token_id):
		queue_free()
