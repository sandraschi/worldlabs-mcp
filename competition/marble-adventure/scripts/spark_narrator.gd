extends Node
## Posts spatial welcome speech to worldlabs-mcp when local Spark is available.

var _http: HTTPRequest


func _ready() -> void:
	_http = HTTPRequest.new()
	add_child(_http)


func on_portal_entered(portal_id: String) -> void:
	if GameConfig == null or WorldManager == null:
		return
	if GameConfig.access_mode == GameConfig.AccessMode.PUBLIC_MARBLE:
		return
	if not GameConfig.spark_online:
		return

	var meta := GameConfig.get_portal_meta(portal_id)
	var text: String = str(meta.get("spark_welcome", "")).strip_edges()
	if text.is_empty():
		return

	var url := "%s/api/narration" % GameConfig.worldlabs_api_url
	var headers := PackedStringArray(["Content-Type: application/json"])
	var body := JSON.stringify({
		"type": "speech",
		"text": text,
		"x": 0.0,
		"y": 1.5,
		"z": 0.0,
	})
	_http.request(url, headers, HTTPClient.METHOD_POST, body)

	var amb: String = str(meta.get("spark_ambience_url", "")).strip_edges()
	if not amb.is_empty():
		var body2 := JSON.stringify({
			"type": "audio",
			"url": amb,
			"x": 0.0,
			"y": 0.0,
			"z": 0.0,
			"is_loop": true,
		})
		_http.request(url, headers, HTTPClient.METHOD_POST, body2)
