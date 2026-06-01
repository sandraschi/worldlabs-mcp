extends Area3D
## Portal — walk through to open a Marble world in the browser.

@export var portal_id: String = ""
@export var portal_label: String = ""
@export var portal_color: Color = Color.WHITE
@export var view_url: String = ""
@export var is_bonus: bool = false

var ring_mesh: MeshInstance3D = null
var title_label: Label3D = null

var active := true
var _player_near := false
var _base_emission := 2.5
var _flash_timer := 0.0
var _approach_cooldown := 0.0


func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if ring_mesh and ring_mesh.get_surface_override_material(0):
		var mat := ring_mesh.get_surface_override_material(0) as StandardMaterial3D
		_base_emission = mat.emission_energy_multiplier


func _process(delta: float) -> void:
	if ring_mesh == null:
		return
	var mat := ring_mesh.get_surface_override_material(0) as StandardMaterial3D
	if mat == null:
		return

	var pulse := _base_emission
	if _player_near:
		pulse += sin(Time.get_ticks_msec() * 0.008) * 0.9
	if _flash_timer > 0.0:
		pulse += 4.0
		_flash_timer -= delta
	if WorldManager and WorldManager.is_visited(portal_id):
		pulse *= 0.65
		mat.albedo_color = portal_color.lerp(Color.WHITE, 0.25)
	mat.emission_energy_multiplier = pulse


func _on_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_near = false


func _on_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player"):
		return
	_player_near = true
	if not active:
		return
	active = false
	_flash_timer = 0.35

	var url := view_url
	if url.is_empty() and GameConfig:
		url = "https://marble.worldlabs.ai/world/%s" % portal_id

	OS.shell_open(url)

	if hub_audio():
		hub_audio().play_portal_enter()

	if WorldManager:
		WorldManager.notify_portal_triggered(portal_id, portal_label, url)

	await get_tree().create_timer(3.0).timeout
	active = true


func _physics_process(delta: float) -> void:
	_approach_cooldown = maxf(0.0, _approach_cooldown - delta)
	if not _player_near or not active:
		return
	if WorldManager == null or WorldManager.player_node == null:
		return
	var dist := global_position.distance_to(WorldManager.player_node.global_position)
	if dist < 4.5 and dist > 2.0 and _approach_cooldown <= 0.0:
		if hub_audio():
			hub_audio().play_portal_approach()
		_approach_cooldown = 1.8


func hub_audio() -> Node:
	var hub := get_tree().get_first_node_in_group("hub_root")
	if hub and hub.has_node("HubAudio"):
		return hub.get_node("HubAudio")
	return null


func refresh_visited_label() -> void:
	if title_label == null:
		return
	var prefix := "✓ " if WorldManager and WorldManager.is_visited(portal_id) else ""
	title_label.text = "%s%s" % [prefix, portal_label]
