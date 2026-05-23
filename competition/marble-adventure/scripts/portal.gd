extends Area3D
## Portal — Walk through to open a Marble world in the Spark viewer.

@export var world_id: String = ""
@export var portal_label: String = ""
@export var portal_color: Color = Color.WHITE
@export var spark_url: String = ""

var active := true


func _ready() -> void:
	body_entered.connect(_on_enter)


func _on_enter(body: Node3D) -> void:
	if not active or not body.is_in_group("player"):
		return
	active = false

	if not spark_url.is_empty():
		OS.shell_open(spark_url)
	else:
		var mid := world_id
		OS.shell_open("https://marble.worldlabs.ai/world/%s" % mid)

	await get_tree().create_timer(3.0).timeout
	active = true
