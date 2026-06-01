extends Control
## Title menu — Play, Controls, Credits, Settings.

const HUB_SCENE := "res://scenes/hub.tscn"

@onready var main_menu: VBoxContainer = $Center/MainMenu
@onready var controls_panel: PanelContainer = $Center/ControlsPanel
@onready var credits_panel: PanelContainer = $Center/CreditsPanel
@onready var settings_panel: PanelContainer = $Center/SettingsPanel
@onready var fov_slider: HSlider = $Center/SettingsPanel/Margin/SettingsVBox/FovRow/FovSlider
@onready var fov_value: Label = $Center/SettingsPanel/Margin/SettingsVBox/FovRow/FovValue
@onready var sens_slider: HSlider = $Center/SettingsPanel/Margin/SettingsVBox/SensRow/SensSlider
@onready var sens_value: Label = $Center/SettingsPanel/Margin/SettingsVBox/SensRow/SensValue
@onready var colorblind_check: CheckBox = $Center/SettingsPanel/Margin/SettingsVBox/ColorblindCheck


func _ready() -> void:
	_show_panel(main_menu)
	_sync_settings_ui()
	if PlayerSettings:
		PlayerSettings.settings_changed.connect(_sync_settings_ui)


func _show_panel(panel: Control) -> void:
	for node in [main_menu, controls_panel, credits_panel, settings_panel]:
		if node:
			node.visible = node == panel


func _sync_settings_ui() -> void:
	if not PlayerSettings:
		return
	if fov_slider:
		fov_slider.value = PlayerSettings.fov
	if sens_slider:
		sens_slider.value = PlayerSettings.mouse_sensitivity * 1000.0
	if colorblind_check:
		colorblind_check.button_pressed = PlayerSettings.colorblind_icons
	_update_setting_labels()


func _update_setting_labels() -> void:
	if fov_value and fov_slider:
		fov_value.text = "%d°" % int(fov_slider.value)
	if sens_value and sens_slider:
		sens_value.text = "%.1f" % sens_slider.value


func _on_play_pressed() -> void:
	get_tree().change_scene_to_file(HUB_SCENE)


func _on_controls_pressed() -> void:
	_show_panel(controls_panel)


func _on_credits_pressed() -> void:
	_show_panel(credits_panel)


func _on_settings_pressed() -> void:
	_show_panel(settings_panel)
	_sync_settings_ui()


func _on_back_pressed() -> void:
	_show_panel(main_menu)


func _on_fov_changed(value: float) -> void:
	if PlayerSettings:
		PlayerSettings.fov = value
		PlayerSettings.save()
	_update_setting_labels()


func _on_sens_changed(value: float) -> void:
	if PlayerSettings:
		PlayerSettings.mouse_sensitivity = value / 1000.0
		PlayerSettings.save()
	_update_setting_labels()


func _on_colorblind_toggled(toggled_on: bool) -> void:
	if PlayerSettings:
		PlayerSettings.colorblind_icons = toggled_on
		PlayerSettings.save()
