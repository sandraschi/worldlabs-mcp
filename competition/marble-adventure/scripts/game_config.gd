extends Node
## Loads portal data and resolves world viewer URLs for public vs local Spark access.

enum AccessMode { PUBLIC_MARBLE, LOCAL_SPARK, PUBLIC_CDN_SPARK }

const CONFIG_PATH := "res://data/portals.json"
const META_PATH := "res://data/portal_meta.json"

var access_mode: AccessMode = AccessMode.PUBLIC_MARBLE
var spark_base_url := "http://127.0.0.1:10864"
var marble_public_base := "https://marble.worldlabs.ai/world"
var cdn_base := "https://cdn.marble.worldlabs.ai"
var tour_featured_count := 5
var sort_portals := "label_alpha"
var portals: Array[Dictionary] = []
var portal_meta: Dictionary = {}
var shape_tour_order: Array[String] = []
var kiosks: Array = []
var token_positions: Array = []
var architect_token_count := 3
var spark_online := false
var spark_web_online := false
var worldlabs_api_url := "http://127.0.0.1:10865"

signal access_ready


func _ready() -> void:
	_load_meta()
	_load_config()
	_apply_env_overrides()
	_check_spark_health()


func _load_meta() -> void:
	var file := FileAccess.open(META_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	portal_meta = parsed
	shape_tour_order.clear()
	for item in parsed.get("shape_tour_order", []):
		shape_tour_order.append(str(item))
	kiosks = parsed.get("kiosks", [])
	token_positions = parsed.get("token_positions", [])
	architect_token_count = int(parsed.get("architect_token_count", 3))


func _load_config() -> void:
	var file := FileAccess.open(CONFIG_PATH, FileAccess.READ)
	if file == null:
		push_error("GameConfig: missing %s" % CONFIG_PATH)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("GameConfig: invalid JSON")
		return

	spark_base_url = str(parsed.get("spark_base_url", spark_base_url)).trim_suffix("/")
	marble_public_base = str(parsed.get("marble_public_base", marble_public_base)).trim_suffix("/")
	cdn_base = str(parsed.get("cdn_base", cdn_base)).trim_suffix("/")
	tour_featured_count = int(parsed.get("tour_featured_count", 5))
	sort_portals = str(parsed.get("sort_portals", "label_alpha"))
	access_mode = _parse_mode(str(parsed.get("access_mode_default", "public_marble")))

	portals.clear()
	for item in parsed.get("portals", []):
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var cfg: Dictionary = item.duplicate(true)
		cfg["color"] = _parse_color(str(cfg.get("color", "#FFFFFF")))
		cfg["tier"] = str(cfg.get("tier", "featured"))
		cfg["view_url"] = resolve_view_url(cfg)
		_merge_portal_meta(cfg)
		portals.append(cfg)

	_sort_portals()


func _merge_portal_meta(cfg: Dictionary) -> void:
	var portals_block = portal_meta.get("portals", {})
	if typeof(portals_block) != TYPE_DICTIONARY:
		return
	var pid: String = cfg.get("id", "")
	if not portals_block.has(pid):
		return
	var extra: Dictionary = portals_block[pid]
	for key in extra:
		cfg[key] = extra[key]


func _sort_portals() -> void:
	if sort_portals != "label_alpha":
		return
	portals.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var ta := str(a.get("tier", "featured"))
		var tb := str(b.get("tier", "featured"))
		if ta != tb:
			return ta == "featured"
		return str(a.get("label", "")).to_lower() < str(b.get("label", "")).to_lower()
	)


func _apply_env_overrides() -> void:
	var mode_env := OS.get_environment("MARBLE_ACCESS_MODE").strip_edges()
	if not mode_env.is_empty():
		access_mode = _parse_mode(mode_env)
	var spark_env := OS.get_environment("SPARK_BASE_URL").strip_edges()
	if not spark_env.is_empty():
		spark_base_url = spark_env.trim_suffix("/")
	for cfg in portals:
		cfg["view_url"] = resolve_view_url(cfg)


func _parse_mode(raw: String) -> AccessMode:
	match raw.to_lower():
		"local_spark", "local":
			return AccessMode.LOCAL_SPARK
		"public_cdn_spark", "cdn_spark", "hosted_spark":
			return AccessMode.PUBLIC_CDN_SPARK
		_:
			return AccessMode.PUBLIC_MARBLE


func _parse_color(hex: String) -> Color:
	return Color.html(hex if hex.begins_with("#") else "#%s" % hex)


func resolve_view_url(cfg: Dictionary) -> String:
	var marble_id: String = cfg.get("marble_id", "")
	var suffix: String = str(cfg.get("splat_suffix", "0"))

	match access_mode:
		AccessMode.LOCAL_SPARK:
			if spark_online or OS.has_environment("MARBLE_FORCE_LOCAL_SPARK"):
				var cdn := "%s/%s/%s" % [cdn_base, marble_id, suffix]
				return "%s/spark?splat_500k=%s" % [spark_base_url, cdn.uri_encode()]
			return "%s/%s" % [marble_public_base, marble_id]
		AccessMode.PUBLIC_CDN_SPARK:
			var cdn := "%s/%s/%s" % [cdn_base, marble_id, suffix]
			return "%s/spark?splat_500k=%s" % [spark_base_url, cdn.uri_encode()]
		_:
			return "%s/%s" % [marble_public_base, marble_id]


func get_portals() -> Array[Dictionary]:
	return portals


func get_featured_portals() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	for cfg in portals:
		if str(cfg.get("tier", "featured")) == "featured":
			out.append(cfg)
	return out


func get_bonus_portals() -> Array[Dictionary]:
	var out: Array[Dictionary] = []
	for cfg in portals:
		if str(cfg.get("tier", "")) == "bonus":
			out.append(cfg)
	return out


func get_portal_meta(portal_id: String) -> Dictionary:
	for cfg in portals:
		if cfg.get("id", "") == portal_id:
			return cfg
	return {}


func get_kiosks() -> Array:
	return kiosks


func get_token_positions() -> Array:
	return token_positions


func alpha_letter(index: int, is_bonus: bool) -> String:
	var code := 65 + index if not is_bonus else 70 + index
	return char(code)


func portal_count() -> int:
	return portals.size()


func featured_count() -> int:
	return get_featured_portals().size()


func bonus_count() -> int:
	return get_bonus_portals().size()


func is_featured(portal_id: String) -> bool:
	for cfg in get_featured_portals():
		if cfg.get("id", "") == portal_id:
			return true
	return false


func is_bonus(portal_id: String) -> bool:
	for cfg in get_bonus_portals():
		if cfg.get("id", "") == portal_id:
			return true
	return false


func icon_glyph(shape: String) -> String:
	match shape:
		"circle":
			return "●"
		"square":
			return "■"
		"triangle":
			return "▲"
		"diamond":
			return "◆"
		"star":
			return "★"
		"hex":
			return "⬡"
		"cross":
			return "✚"
		"wave":
			return "≈"
		_:
			return "●"


func shape_glyph_for_portal(portal_id: String) -> String:
	for cfg in get_featured_portals():
		if cfg.get("id", "") == portal_id:
			return icon_glyph(str(cfg.get("icon_shape", "circle")))
	return "●"


func access_mode_label() -> String:
	match access_mode:
		AccessMode.LOCAL_SPARK:
			return "local Spark (%s)" % spark_base_url
		AccessMode.PUBLIC_CDN_SPARK:
			return "CDN Spark via %s" % spark_base_url
		_:
			return "public Marble viewer (no account needed)"


func spark_status_message() -> String:
	match access_mode:
		AccessMode.PUBLIC_MARBLE:
			return "Worlds open in browser — no account needed"
		AccessMode.LOCAL_SPARK:
			if spark_online and spark_web_online:
				return "Local Spark online — spatial welcome in worlds"
			if spark_online:
				return "API online — Spark web may be starting"
			return "Local Spark offline — using public Marble fallback"
		AccessMode.PUBLIC_CDN_SPARK:
			if spark_web_online:
				return "Hosted Spark at %s" % spark_base_url
			return "Hosted Spark unreachable — check SPARK_BASE_URL"
	return ""


func spark_status_is_warning() -> bool:
	match access_mode:
		AccessMode.PUBLIC_MARBLE:
			return false
		AccessMode.LOCAL_SPARK:
			return not spark_online
		AccessMode.PUBLIC_CDN_SPARK:
			return not spark_web_online
	return false


func _check_spark_health() -> void:
	if access_mode == AccessMode.PUBLIC_MARBLE:
		spark_online = false
		spark_web_online = false
		access_ready.emit()
		return

	var api_env := OS.get_environment("WORLDLABS_API_URL").strip_edges()
	if not api_env.is_empty():
		worldlabs_api_url = api_env.trim_suffix("/")

	var pending := 0
	var finish := func() -> void:
		pending -= 1
		if pending <= 0:
			if access_mode == AccessMode.LOCAL_SPARK:
				for cfg in portals:
					cfg["view_url"] = resolve_view_url(cfg)
			access_ready.emit()

	if access_mode == AccessMode.LOCAL_SPARK:
		pending += 1
		_ping("%s/health" % worldlabs_api_url, func(ok: bool):
			spark_online = ok
			finish.call()
		)

	pending += 1
	_ping(spark_base_url, func(ok: bool):
		spark_web_online = ok
		finish.call()
	)


func _ping(url: String, callback: Callable) -> void:
	var req := HTTPRequest.new()
	add_child(req)
	req.timeout = 4.0
	req.request_completed.connect(func(result, code, _h, _b):
		callback.call(result == HTTPRequest.RESULT_SUCCESS and code >= 200 and code < 500)
		req.queue_free()
	)
	req.request(url)
