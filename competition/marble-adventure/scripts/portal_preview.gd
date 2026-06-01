extends Node
## Loads a portal preview texture from disk or Marble CDN at runtime.

signal loaded(texture: Texture2D)

const LOCAL_EXTENSIONS := ["webp", "png", "jpg", "jpeg"]

var _http: HTTPRequest
var _pending_urls: Array[String] = []


func _ready() -> void:
	_http = HTTPRequest.new()
	add_child(_http)
	_http.request_completed.connect(_on_request_completed)


func load_preview(world_id: String, marble_uuid: String) -> void:
	var local := _load_local(world_id)
	if local:
		loaded.emit(local)
		return
	if marble_uuid.is_empty():
		return
	_pending_urls = [
		"https://cdn.marble.worldlabs.ai/%s/thumbnail.jpg" % marble_uuid,
		"https://cdn.marble.worldlabs.ai/%s/thumb.jpg" % marble_uuid,
		"https://cdn.marble.worldlabs.ai/%s/pano.jpg" % marble_uuid,
	]
	_request_next()


func _load_local(world_id: String) -> Texture2D:
	for ext in LOCAL_EXTENSIONS:
		var path := "res://worlds/%s_thumb.%s" % [world_id, ext]
		if not FileAccess.file_exists(path):
			continue
		var img := Image.new()
		if img.load(path) != OK:
			continue
		return ImageTexture.create_from_image(img)
	return null


func _request_next() -> void:
	if _pending_urls.is_empty():
		return
	var url: String = _pending_urls.pop_front()
	_http.request(url)


func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or response_code != 200 or body.is_empty():
		_request_next()
		return
	var img := Image.new()
	var err := ERR_FILE_UNRECOGNIZED
	if body.size() > 2:
		if body[0] == 0xFF and body[1] == 0xD8:
			err = img.load_jpg_from_buffer(body)
		elif body[0] == 0x89 and body[1] == 0x50:
			err = img.load_png_from_buffer(body)
		elif body.size() > 12 and body.slice(0, 4).get_string_from_ascii() == "RIFF":
			err = img.load_webp_from_buffer(body)
	if err == OK:
		loaded.emit(ImageTexture.create_from_image(img))
	else:
		_request_next()
