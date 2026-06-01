extends Control

@onready var world_label: Label = $WorldLabel
@onready var hint_label: Label = $HintLabel
@onready var tour_label: Label = $TourLabel
@onready var bonus_label: Label = $BonusLabel
@onready var shape_label: Label = $ShapeLabel
@onready var token_label: Label = $TokenLabel
@onready var status_banner: PanelContainer = $StatusBanner
@onready var status_text: Label = $StatusBanner/Margin/StatusText
@onready var kiosk_panel: PanelContainer = $KioskPanel
@onready var kiosk_title: Label = $KioskPanel/Margin/KioskVBox/KioskTitle
@onready var kiosk_body: Label = $KioskPanel/Margin/KioskVBox/KioskBody
@onready var completion_panel: PanelContainer = $CompletionPanel
@onready var completion_text: Label = $CompletionPanel/Margin/CompletionText

var _started := false


func _ready() -> void:
	if completion_panel:
		completion_panel.visible = false
	if kiosk_panel:
		kiosk_panel.visible = false
	if status_banner:
		status_banner.visible = false
	if WorldManager:
		WorldManager.world_entered.connect(_on_world_entered)
		WorldManager.hub_entered.connect(_on_hub_entered)
		WorldManager.portal_opened.connect(_on_portal_opened)
		WorldManager.tour_updated.connect(_on_tour_updated)
		WorldManager.bonus_updated.connect(_on_bonus_updated)
		WorldManager.tour_completed.connect(_on_tour_completed)
		WorldManager.shape_tour_updated.connect(_on_shape_tour_updated)
		WorldManager.shape_tour_completed.connect(_on_shape_tour_completed)
		WorldManager.tokens_updated.connect(_on_tokens_updated)
		WorldManager.architect_unlocked.connect(_on_architect_unlocked)
		WorldManager.kiosk_shown.connect(_on_kiosk_shown)
		WorldManager.kiosk_cleared.connect(_on_kiosk_cleared)
		_on_tour_updated(WorldManager.visited_count(), WorldManager.total_portals)
		_on_bonus_updated(WorldManager.bonus_visited_count(), WorldManager.total_bonus)
		_on_tokens_updated(WorldManager.tokens_count(), WorldManager.total_tokens)
		_on_shape_tour_updated(WorldManager.shape_tour_step, GameConfig.shape_tour_order.size() if GameConfig else 5)
	if GameConfig:
		GameConfig.access_ready.connect(_on_access_ready)
		_on_access_ready()


func on_game_started() -> void:
	_started = true
	if hint_label:
		hint_label.text = "WASD | Space jump | E portal notes | Terminals | Tour A–E"
	if world_label:
		world_label.text = ""


func _on_access_ready() -> void:
	if not GameConfig:
		return
	if status_banner and status_text:
		status_banner.visible = true
		status_text.text = GameConfig.spark_status_message()
		var warn := GameConfig.spark_status_is_warning()
		status_text.modulate = Color(1.0, 0.45, 0.45) if warn else Color(0.65, 1.0, 0.75)
	if hint_label and not _started:
		hint_label.text = "%s — click to play" % GameConfig.access_mode_label()


func _on_tour_updated(visited_count: int, total: int) -> void:
	if tour_label:
		tour_label.text = "World tour: %d / %d" % [visited_count, total]


func _on_bonus_updated(visited_count: int, total: int) -> void:
	if bonus_label:
		if total <= 0:
			bonus_label.visible = false
		else:
			bonus_label.visible = true
			bonus_label.text = "Bonus F–H: %d / %d" % [visited_count, total]


func _on_shape_tour_updated(_step: int, _total: int) -> void:
	if shape_label and WorldManager:
		shape_label.text = WorldManager.shape_tour_label()


func _on_shape_tour_completed() -> void:
	if shape_label:
		shape_label.text = "Shape tour complete ✓"
	if hint_label and _started:
		hint_label.text = "Architect shape tour done — collect gold orbs if any remain"


func _on_tokens_updated(collected: int, total: int) -> void:
	if token_label:
		token_label.text = "Architect tokens: %d / %d" % [collected, total]


func _on_architect_unlocked() -> void:
	if hint_label and _started:
		hint_label.text = "Architect unlocked — full fleet lore at terminals"


func _on_kiosk_shown(title: String, body: String) -> void:
	if kiosk_panel:
		kiosk_panel.visible = true
	if kiosk_title:
		kiosk_title.text = title
	if kiosk_body:
		kiosk_body.text = body


func _on_kiosk_cleared() -> void:
	if kiosk_panel:
		kiosk_panel.visible = false


func _on_tour_completed() -> void:
	if completion_panel:
		completion_panel.visible = true
	if completion_text:
		completion_text.text = "Tour complete!\nAll 5 featured worlds (A–E).\nBonus F–H still open — R resets progress."
	if hint_label:
		hint_label.text = "Tour complete — press R to reset or keep exploring"


func _on_world_entered(_world_id: String, world_name: String) -> void:
	if world_label:
		world_label.text = world_name
	if hint_label:
		hint_label.text = "Browser opened — Alt+Tab back | E at ring for agent notes"


func _on_portal_opened(world_name: String, _view_url: String) -> void:
	if world_label:
		world_label.text = "Opening: %s" % world_name


func _on_hub_entered() -> void:
	if world_label:
		world_label.text = ""
	if hint_label and _started:
		hint_label.text = "Walk rings A–E | Terminals | E at ring for notes"


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("reset_tour") and WorldManager:
		WorldManager.reset_tour()
		if completion_panel:
			completion_panel.visible = false
