extends Node
## Hub state, tour progress, tokens, shape puzzle, kiosk UI.

signal world_entered(world_id: String, world_name: String)
signal hub_entered
signal portal_opened(world_name: String, view_url: String)
signal tour_updated(visited_count: int, total: int)
signal bonus_updated(visited_count: int, total: int)
signal tour_completed
signal shape_tour_updated(step: int, total: int)
signal shape_tour_completed
signal tokens_updated(collected: int, total: int)
signal architect_unlocked
signal kiosk_shown(title: String, body: String)
signal kiosk_cleared

const SAVE_PATH := "user://marble_tour.json"

var hub_scene: Node3D = null
var player_node: Node3D = null
var visited: Dictionary = {}
var bonus_visited: Dictionary = {}
var tokens_collected: Dictionary = {}
var shape_tour_step := 0
var architect_unlocked_flag := false
var total_portals := 5
var total_bonus := 3
var total_tokens := 3
var _active_kiosk_id := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	name = "WorldManager"
	if GameConfig:
		total_tokens = GameConfig.architect_token_count
	_load_progress()
	if GameConfig:
		total_portals = GameConfig.featured_count()
		total_bonus = GameConfig.bonus_count()


func register_player(p: Node3D) -> void:
	player_node = p
	if PlayerSettings:
		PlayerSettings.apply_to_player(p)


func hub_setup() -> void:
	hub_entered.emit()
	_emit_all()


func notify_portal_triggered(portal_id: String, world_name: String, view_url: String) -> void:
	record_visit(portal_id)
	portal_opened.emit(world_name, view_url)
	world_entered.emit(portal_id, world_name)
	if SparkNarrator:
		SparkNarrator.on_portal_entered(portal_id)


func record_visit(portal_id: String) -> void:
	if portal_id.is_empty():
		return

	var is_bonus := GameConfig and GameConfig.is_bonus(portal_id)
	var bucket := bonus_visited if is_bonus else visited

	if not bucket.has(portal_id):
		bucket[portal_id] = Time.get_unix_time_from_system()
		_save_progress()

	if not is_bonus and GameConfig:
		_advance_shape_tour(portal_id)

	_emit_all()

	if not is_bonus and visited_count() >= total_portals:
		tour_completed.emit()


func _advance_shape_tour(portal_id: String) -> void:
	if GameConfig == null or GameConfig.shape_tour_order.is_empty():
		return
	if shape_tour_step >= GameConfig.shape_tour_order.size():
		return
	var expected := GameConfig.shape_tour_order[shape_tour_step]
	if portal_id != expected:
		return
	shape_tour_step += 1
	_save_progress()
	shape_tour_updated.emit(shape_tour_step, GameConfig.shape_tour_order.size())
	if shape_tour_step >= GameConfig.shape_tour_order.size():
		shape_tour_completed.emit()


func collect_token(token_id: String) -> bool:
	if token_id.is_empty() or tokens_collected.has(token_id):
		return false
	tokens_collected[token_id] = Time.get_unix_time_from_system()
	if tokens_collected.size() >= total_tokens and not architect_unlocked_flag:
		architect_unlocked_flag = true
		architect_unlocked.emit()
	_save_progress()
	tokens_updated.emit(tokens_collected.size(), total_tokens)
	return true


func set_active_kiosk(kiosk_id: String, title: String, body: String) -> void:
	_active_kiosk_id = kiosk_id
	kiosk_shown.emit(title, body)


func clear_active_kiosk(kiosk_id: String) -> void:
	if _active_kiosk_id == kiosk_id:
		_active_kiosk_id = ""
		kiosk_cleared.emit()


func show_portal_kiosk(portal_id: String) -> void:
	if GameConfig == null:
		return
	var meta := GameConfig.get_portal_meta(portal_id)
	var portal_label := str(meta.get("label", portal_id))
	var note := str(meta.get("kiosk_note", ""))
	var tools: Array = meta.get("fleet_tools", [])
	var tools_line := ""
	if typeof(tools) == TYPE_ARRAY and tools.size() > 0:
		var parts: PackedStringArray = []
		for t in tools:
			parts.append(str(t))
		tools_line = "\nTools: " + ", ".join(parts)
	kiosk_shown.emit("%s — agent notes" % portal_label, note + tools_line)


func is_visited(portal_id: String) -> bool:
	return visited.has(portal_id) or bonus_visited.has(portal_id)


func visited_count() -> int:
	return visited.size()


func bonus_visited_count() -> int:
	return bonus_visited.size()


func tokens_count() -> int:
	return tokens_collected.size()


func shape_tour_label() -> String:
	if GameConfig == null or GameConfig.shape_tour_order.is_empty():
		return ""
	if shape_tour_step >= GameConfig.shape_tour_order.size():
		return "Shape tour complete"
	var next_id := GameConfig.shape_tour_order[shape_tour_step]
	var glyph := GameConfig.shape_glyph_for_portal(next_id)
	for cfg in GameConfig.get_featured_portals():
		if cfg.get("id", "") == next_id:
			return "Shape tour: next %s %s" % [glyph, cfg.get("label", "")]
	return "Shape tour: next %s" % glyph


func _emit_all() -> void:
	tour_updated.emit(visited_count(), total_portals)
	bonus_updated.emit(bonus_visited_count(), total_bonus)
	tokens_updated.emit(tokens_count(), total_tokens)
	if GameConfig:
		shape_tour_updated.emit(shape_tour_step, GameConfig.shape_tour_order.size())


func _load_progress() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	visited = parsed.get("visited", {})
	bonus_visited = parsed.get("bonus_visited", {})
	tokens_collected = parsed.get("tokens_collected", {})
	shape_tour_step = int(parsed.get("shape_tour_step", 0))
	architect_unlocked_flag = bool(parsed.get("architect_unlocked", false))


func _save_progress() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify({
		"visited": visited,
		"bonus_visited": bonus_visited,
		"tokens_collected": tokens_collected,
		"shape_tour_step": shape_tour_step,
		"architect_unlocked": architect_unlocked_flag,
	}))
	file.close()


func reset_tour() -> void:
	visited.clear()
	bonus_visited.clear()
	tokens_collected.clear()
	shape_tour_step = 0
	architect_unlocked_flag = false
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)
	_emit_all()
	kiosk_cleared.emit()
