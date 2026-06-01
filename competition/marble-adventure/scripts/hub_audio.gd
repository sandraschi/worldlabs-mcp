extends Node
## Layered hub ambient + portal SFX with proximity swell.

@onready var _ambient_low: AudioStreamPlayer = $AmbientLow
@onready var _ambient_mid: AudioStreamPlayer = $AmbientMid
@onready var _ambient_high: AudioStreamPlayer = $AmbientHigh
@onready var _portal: AudioStreamPlayer = $PortalSfx
@onready var _approach: AudioStreamPlayer = $ApproachSfx

var _nearest_portal: Node3D = null


func _ready() -> void:
	if _ambient_low:
		_ambient_low.stream = ProceduralAudio.make_ambient_loop(41.0, 5.0, 0.1)
		_ambient_low.volume_db = -22.0
		_ambient_low.autoplay = true
	if _ambient_mid:
		_ambient_mid.stream = ProceduralAudio.make_ambient_loop(82.5, 4.0, 0.07)
		_ambient_mid.volume_db = -26.0
		_ambient_mid.autoplay = true
	if _ambient_high:
		_ambient_high.stream = ProceduralAudio.make_ambient_loop(165.0, 3.0, 0.04)
		_ambient_high.volume_db = -30.0
		_ambient_high.autoplay = true
	if _portal:
		_portal.stream = ProceduralAudio.make_tone(440.0, 0.35, 0.35)
	if _approach:
		_approach.stream = ProceduralAudio.make_tone(220.0, 0.12, 0.12)


func _process(_delta: float) -> void:
	if WorldManager == null or WorldManager.player_node == null:
		return
	var hub := get_tree().get_first_node_in_group("hub_root")
	if hub == null:
		return
	var portals := hub.get_node_or_null("Portals")
	if portals == null:
		return
	var best_dist := 999.0
	_nearest_portal = null
	for child in portals.get_children():
		var dist := WorldManager.player_node.global_position.distance_to(child.global_position)
		if dist < best_dist:
			best_dist = dist
			_nearest_portal = child
	var swell := clampf(1.0 - best_dist / 14.0, 0.0, 1.0)
	if _ambient_mid:
		_ambient_mid.volume_db = -26.0 + swell * 4.0
	if _ambient_high:
		_ambient_high.volume_db = -30.0 + swell * 5.0


func play_portal_enter() -> void:
	if _portal and not _portal.playing:
		_portal.play()


func play_portal_approach() -> void:
	if _approach and not _approach.playing:
		_approach.play()
