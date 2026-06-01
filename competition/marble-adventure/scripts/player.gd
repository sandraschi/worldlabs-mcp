extends CharacterBody3D

@export var walk_speed := 5.0
@export var sprint_speed := 10.0
@export var jump_velocity := 4.5
@export var mouse_sensitivity := 0.002
@export var look_angle_limit := 85.0

@onready var camera: Camera3D = $Camera3D
@onready var hud: Control = $HUD

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var look_angle_x := 0.0
var _mouse_captured := false
var _game_started := false


func _ready() -> void:
	add_to_group("player")
	camera.current = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	if PlayerSettings:
		PlayerSettings.apply_to_player(self)
		PlayerSettings.settings_changed.connect(_on_settings_changed)

	if WorldManager:
		WorldManager.register_player(self)


func _on_settings_changed() -> void:
	if PlayerSettings:
		PlayerSettings.apply_to_player(self)


func _input(event: InputEvent) -> void:
	if not _game_started:
		if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_game_started = true
			capture_mouse()
			if WorldManager and WorldManager.hub_scene and WorldManager.hub_scene.has_method("on_game_started"):
				WorldManager.hub_scene.on_game_started()
		return

	if event is InputEventMouseMotion and _mouse_captured:
		rotate_y(-event.relative.x * mouse_sensitivity)
		look_angle_x -= event.relative.y * mouse_sensitivity
		look_angle_x = clampf(look_angle_x, -deg_to_rad(look_angle_limit), deg_to_rad(look_angle_limit))
		camera.rotation.x = look_angle_x

	if event is InputEventMouseButton and _mouse_captured:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera.fov = clampf(camera.fov - 2.0, 30.0, 110.0)
			if PlayerSettings:
				PlayerSettings.fov = camera.fov
				PlayerSettings.save()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera.fov = clampf(camera.fov + 2.0, 30.0, 110.0)
			if PlayerSettings:
				PlayerSettings.fov = camera.fov
				PlayerSettings.save()

	if event.is_action_pressed("menu"):
		if _mouse_captured:
			release_mouse()
		else:
			capture_mouse()


func _physics_process(delta: float) -> void:
	if not _game_started:
		return

	if not is_on_floor():
		velocity.y -= gravity * delta

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity

	if Input.is_action_just_pressed("home_center") and is_on_floor():
		position = Vector3(0, 1.8, 0)
		velocity = Vector3.ZERO

	if Input.is_action_just_pressed("interact") and _game_started and WorldManager:
		_try_portal_kiosk()

	var input_dir := Input.get_vector("left", "right", "forward", "back")
	var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	var speed := sprint_speed if Input.is_key_pressed(KEY_SHIFT) else walk_speed

	if direction:
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
	else:
		velocity.x = move_toward(velocity.x, 0, speed)
		velocity.z = move_toward(velocity.z, 0, speed)

	move_and_slide()


func capture_mouse() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_mouse_captured = true
	if hud and hud.has_method("on_game_started"):
		hud.on_game_started()


func release_mouse() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_mouse_captured = false


func _try_portal_kiosk() -> void:
	var hub := get_tree().get_first_node_in_group("hub_root")
	if hub == null:
		return
	var portals := hub.get_node_or_null("Portals")
	if portals == null:
		return
	var best_id := ""
	var best_dist := 5.5
	for child in portals.get_children():
		var trigger := child.get_node_or_null("Trigger")
		if trigger == null:
			continue
		var dist := global_position.distance_to(trigger.global_position)
		if dist < best_dist:
			best_dist = dist
			best_id = trigger.portal_id
	if not best_id.is_empty():
		WorldManager.show_portal_kiosk(best_id)

