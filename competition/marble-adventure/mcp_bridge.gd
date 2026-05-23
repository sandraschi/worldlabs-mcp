# Godot-MCP Bridge — WebSocket server running inside Godot 4.0+
# Place at res://mcp_bridge.gd and add as Autoload in project.godot
extends Node

var _server := TCPServer.new()
var _peer: StreamPeerTCP = null
var _port := 9080
var _running := false

# Scene tree access
var _stl_mesh_parent: Node3D = null
var _particle_system: GPUParticles3D = null
var _camera: Camera3D = null

func _ready():
	print("[MCP-Bridge] Initializing Godot MCP bridge v0.1.0...")
	start_server(_port)

func start_server(port: int = 9080) -> bool:
	_port = port
	var err := _server.listen(port)
	if err == OK:
		_running = true
		print("[MCP-Bridge] WebSocket server listening on port %d" % port)
		return true
	else:
		printerr("[MCP-Bridge] Failed to listen on port %d: %d" % [port, err])
		return false

func stop_server():
	_running = false
	_server.stop()
	if _peer:
		_peer = null
	print("[MCP-Bridge] Server stopped")

func _process(_delta: float):
	if not _running:
		return

	# Accept new connections
	if not _peer or _peer.get_status() == StreamPeerTCP.STATUS_NONE:
		_peer = _server.take_connection()
		if _peer:
			print("[MCP-Bridge] Client connected")
			# Send handshake
			_send_json({"type": "handshake", "version": "0.1.0", "godot_version": Engine.get_version_info(), "ready": true})

	# Process incoming data
	if _peer and _peer.get_status() == StreamPeerTCP.STATUS_CONNECTED:
		var available := _peer.get_available_bytes()
		if available > 0:
			var data := _peer.get_string(available)
			if data:
				_handle_message(data)

	# Handle disconnection
	if _peer and _peer.get_status() == StreamPeerTCP.STATUS_ERROR:
		print("[MCP-Bridge] Client disconnected")
		_peer = null

func _handle_message(raw: String):
	var json := JSON.new()
	var err := json.parse(raw)
	if err != OK:
		_send_error("Invalid JSON: %s" % json.get_error_message())
		return

	var msg: Dictionary = json.get_data()
	if typeof(msg) != TYPE_DICTIONARY:
		_send_error("Expected JSON object")
		return

	var action: String = msg.get("action", "")
	var params: Dictionary = msg.get("params", {})
	var request_id: String = msg.get("request_id", "")

	print("[MCP-Bridge] Action: %s" % action)

	match action:
		"status":
			_cmd_status(request_id)
		"import_stl":
			_cmd_import_stl(request_id, params)
		"import_glb":
			_cmd_import_glb(request_id, params)
		"import_obj":
			_cmd_import_obj(request_id, params)
		"load_velocity_field":
			_cmd_load_velocity(request_id, params)
		"spawn_particles":
			_cmd_spawn_particles(request_id, params)
		"animate_streamlines":
			_cmd_animate_streamlines(request_id, params)
		"create_camera":
			_cmd_create_camera(request_id, params)
		"add_light":
			_cmd_add_light(request_id, params)
		"set_material":
			_cmd_set_material(request_id, params)
		"export_web":
			_cmd_export_web(request_id, params)
		"read_scene_tree":
			_cmd_read_scene_tree(request_id)
		"set_config":
			_cmd_set_config(request_id, params)
		"headless_verify":
			_cmd_headless_verify(request_id, params)
		"add_node":
			_cmd_add_node(request_id, params)
		"remove_node":
			_cmd_remove_node(request_id, params)
		"save_scene":
			_cmd_save_scene(request_id, params)
		_:
			_send_error("Unknown action: %s" % action, request_id)

# ─── Command Handlers ────────────────────────────────────────────────

func _cmd_status(request_id: String):
	var children: Array = []
	var root := get_tree().get_root() if get_tree() else null
	if root:
		for child in root.get_children():
			children.append({"name": child.name, "type": child.get_class()})

	_send_response(request_id, {
		"godot_version": "%d.%d.%d" % [Engine.get_version_info().major, Engine.get_version_info().minor, Engine.get_version_info().patch],
		"node_count": children.size(),
		"root_nodes": children,
		"fps": Engine.get_frames_per_second(),
	})

func _cmd_import_stl(request_id: String, params: Dictionary):
	var path: String = params.get("path", "")
	var mesh_name: String = params.get("name", "STL_Mesh")

	if path.is_empty():
		_send_error("Missing path parameter", request_id)
		return

	if not FileAccess.file_exists(path):
		_send_error("File not found: %s" % path, request_id)
		return

	# Create mesh instance
	var mesh_instance := MeshInstance3D.new()
	mesh_instance.name = mesh_name

	# Load STL (Godot 4 supports STL via ResourceLoader in 4.x)
	var mesh: ArrayMesh = _load_stl_mesh(path)
	if not mesh:
		_send_error("Failed to load STL mesh", request_id)
		return

	mesh_instance.mesh = mesh

	# Add to scene
	var parent := _get_or_create_container("STL_Imports")
	parent.add_child(mesh_instance)

	# Center and scale
	var aabb := mesh.get_aabb()
	var scale_vec: float = params.get("scale", 1.0)
	mesh_instance.scale = Vector3(scale_vec, scale_vec, scale_vec)

	var pos: Dictionary = params.get("position", {"x": 0, "y": 0, "z": 0})
	mesh_instance.position = Vector3(
		pos.get("x", 0.0),
		pos.get("y", 0.0),
		pos.get("z", 0.0)
	)

	_send_response(request_id, {
		"imported": true,
		"name": mesh_instance.name,
		"vertices": mesh.get_surface_count() > 0 if mesh else 0,
		"aabb": {"size_x": aabb.size.x, "size_y": aabb.size.y, "size_z": aabb.size.z},
	})

func _cmd_import_glb(request_id: String, params: Dictionary):
	var path: String = params.get("path", "")
	var import_name: String = params.get("name", "GLB_Import")

	if path.is_empty():
		_send_error("Missing path parameter", request_id)
		return

	if not FileAccess.file_exists(path):
		_send_error("File not found: %s" % path, request_id)
		return

	# Godot 4.0+ native GLTF import via GLTFDocument
	var gltf_doc := GLTFDocument.new()
	var gltf_state := GLTFState.new()
	var err := gltf_doc.append_from_file(path, gltf_state, 0)
	if err != OK:
		_send_error("Failed to import GLB/GLTF: error %d" % err, request_id)
		return

	var imported_scene := gltf_doc.generate_scene(gltf_state)
	if not imported_scene:
		_send_error("GLTFDocument.generate_scene returned null", request_id)
		return

	imported_scene.name = import_name

	var scale_vec: float = params.get("scale", 1.0)
	var pos: Dictionary = params.get("position", {"x": 0, "y": 0, "z": 0})
	imported_scene.scale = Vector3(scale_vec, scale_vec, scale_vec)
	imported_scene.position = Vector3(
		pos.get("x", 0.0), pos.get("y", 0.0), pos.get("z", 0.0)
	)

	var parent := _get_or_create_container("GLB_Imports")
	parent.add_child(imported_scene)

	# Count total nodes and meshes in the imported scene
	var node_count := _count_nodes(imported_scene)
	var mesh_count := _count_meshes(imported_scene)

	_send_response(request_id, {
		"imported": true,
		"name": imported_scene.name,
		"total_nodes": node_count,
		"mesh_count": mesh_count,
	})

func _count_meshes(node: Node) -> int:
	var count := 0
	if node is MeshInstance3D:
		count += 1
	for child in node.get_children():
		count += _count_meshes(child)
	return count

func _cmd_load_velocity(request_id: String, params: Dictionary):
	var csv_path: String = params.get("csv_path", "")
	var field_name: String = params.get("name", "VelocityField")

	if csv_path.is_empty():
		_send_error("Missing csv_path parameter", request_id)
		return

	var file := FileAccess.open(csv_path, FileAccess.READ)
	if not file:
		_send_error("Cannot read CSV file", request_id)
		return

	var header := file.get_csv_line()
	var points := PackedVector3Array()
	var vectors := PackedVector3Array()
	var bbox_min := Vector3(1e30, 1e30, 1e30)
	var bbox_max := Vector3(-1e30, -1e30, -1e30)

	while not file.eof_reached():
		var line := file.get_csv_line()
		if line.size() < 6:
			continue
		var px := float(line[0])
		var py := float(line[1])
		var pz := float(line[2])
		var vx := float(line[3])
		var vy := float(line[4])
		var vz := float(line[5])

		points.append(Vector3(px, py, pz))
		vectors.append(Vector3(vx, vy, vz))
		bbox_min = bbox_min.min(Vector3(px, py, pz))
		bbox_max = bbox_max.max(Vector3(px, py, pz))

	file.close()

	# Store as scene metadata
	var data_node := Node3D.new()
	data_node.name = field_name
	data_node.set_meta("velocity_points", points)
	data_node.set_meta("velocity_vectors", vectors)
	data_node.set_meta("bbox_min", bbox_min)
	data_node.set_meta("bbox_max", bbox_max)
	data_node.set_meta("point_count", points.size())

	var parent := _get_or_create_container("Velocity_Fields")
	parent.add_child(data_node)

	_send_response(request_id, {
		"loaded": true,
		"name": field_name,
		"point_count": points.size(),
		"bbox": {"min_x": bbox_min.x, "min_y": bbox_min.y, "min_z": bbox_min.z,
		          "max_x": bbox_max.x, "max_y": bbox_max.y, "max_z": bbox_max.z},
	})

func _cmd_spawn_particles(request_id: String, params: Dictionary):
	var count: int = params.get("count", 1000)
	var color_hex: String = params.get("color", "#00aaff")
	var spread_x: float = params.get("spread_x", 0.0)
	var spread_y: float = params.get("spread_y", 0.0)
	var spread_z: float = params.get("spread_z", 0.0)

	# Create GPU particles node
	var particles := GPUParticles3D.new()
	particles.name = params.get("name", "StreamlineParticles")
	particles.amount = count
	particles.lifetime = 5.0
	particles.explosiveness = 1.0
	particles.one_shot = false

	# Create particle material
	var mat := ParticleProcessMaterial.new()
	mat.direction = Vector3(1, 0, 0)
	mat.spread = 180.0
	mat.initial_velocity_min = 0.01
	mat.initial_velocity_max = 0.05
	mat.gravity = Vector3(0, 0, 0)
	particles.process_material = mat

	# Create draw pass mesh (small sphere)
	var sphere := SphereMesh.new()
	sphere.radius = 0.05
	sphere.height = 0.1
	particles.draw_pass_1 = sphere

	# Set emission box
	var box := BoxMesh.new()
	box.size = Vector3(spread_x, spread_y, spread_z)
	particles.draw_pass_1 = sphere

	var parent := _get_or_create_container("Particle_Systems")
	parent.add_child(particles)

	_send_response(request_id, {
		"spawned": true,
		"name": particles.name,
		"count": count,
		"particle_system": particles.name,
	})

func _cmd_animate_streamlines(request_id: String, params: Dictionary):
	var field_name: String = params.get("velocity_field", "VelocityField")
	var particle_name: String = params.get("particle_system", "StreamlineParticles")
	var speed: float = params.get("speed", 1.0)

	var data_node := _find_node_by_name(field_name)
	if not data_node:
		_send_error("Velocity field '%s' not found" % field_name, request_id)
		return

	var particles := _find_node_by_name(particle_name)
	if not particles or not particles is GPUParticles3D:
		_send_error("Particle system '%s' not found" % particle_name, request_id)
		return

	var points: PackedVector3Array = data_node.get_meta("velocity_points", PackedVector3Array())
	var vectors: PackedVector3Array = data_node.get_meta("velocity_vectors", PackedVector3Array())

	var mat := particles.process_material as ParticleProcessMaterial
	if mat:
		mat.initial_velocity_min = 0.02 * speed
		mat.initial_velocity_max = 0.08 * speed

	# Set emission box extents to cover the velocity field
	var bbox_min: Vector3 = data_node.get_meta("bbox_min", Vector3.ZERO)
	var bbox_max: Vector3 = data_node.get_meta("bbox_max", Vector3.ZERO)
	var extent := bbox_max - bbox_min

	var box := BoxMesh.new()
	box.size = extent
	particles.draw_pass_1 = box

	particles.emitting = true

	_send_response(request_id, {
		"animated": true,
		"particle_system": particle_name,
		"velocity_field": field_name,
		"speed_multiplier": speed,
		"point_count": points.size(),
	})

func _cmd_create_camera(request_id: String, params: Dictionary):
	var pos: Dictionary = params.get("position", {"x": 0, "y": 5, "z": 10})
	var look_at: Dictionary = params.get("look_at", {"x": 0, "y": 0, "z": 0})
	var fov: float = params.get("fov", 75.0)

	var cam := Camera3D.new()
	cam.name = params.get("name", "MCP_Camera")
	cam.position = Vector3(pos.get("x", 0), pos.get("y", 5), pos.get("z", 10))
	cam.look_at(Vector3(look_at.get("x", 0), look_at.get("y", 0), look_at.get("z", 0)))
	cam.fov = fov
	cam.current = true

	# Enable orbit controls via script
	var orbit := Node.new()
	orbit.name = "OrbitControls"
	var script := GDScript.new()
	script.source_code = """extends Node
var rotation_speed := 0.005
var zoom_speed := 1.0
var pan_speed := 0.01

func _input(event):
	var cam := get_parent() as Camera3D
	if not cam: return
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		if Input.is_key_pressed(KEY_ALT):
			cam.position = cam.position.rotated(Vector3.UP, -event.relative.x * rotation_speed)
		else:
			cam.rotate_y(-event.relative.x * rotation_speed)
			cam.rotate_object_local(Vector3.RIGHT, -event.relative.y * rotation_speed)
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			cam.position += cam.global_transform.basis.z * zoom_speed
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			cam.position -= cam.global_transform.basis.z * zoom_speed
"""
	script.reload()
	orbit.set_script(script)
	cam.add_child(orbit)

	var parent := _get_or_create_container("Cameras")
	parent.add_child(cam)

	_send_response(request_id, {
		"created": true,
		"name": cam.name,
		"fov": fov,
		"position": {"x": cam.position.x, "y": cam.position.y, "z": cam.position.z},
	})

func _cmd_add_light(request_id: String, params: Dictionary):
	var light_type: String = params.get("type", "directional")
	var intensity: float = params.get("intensity", 1.0)

	var light: Light3D
	if light_type == "directional":
		light = DirectionalLight3D.new()
		light.position = Vector3(5, 10, 5)
		light.look_at(Vector3.ZERO)
	elif light_type == "ambient":
		# Use environment instead
		var env := Environment.new()
		env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
		env.ambient_light_color = Color.WHITE * intensity
		env.ambient_light_energy = intensity
		_send_response(request_id, {"created": true, "type": "ambient", "intensity": intensity})
		return
	else:
		light = OmniLight3D.new()
		var pos: Dictionary = params.get("position", {"x": 5, "y": 5, "z": 5})
		light.position = Vector3(pos.get("x", 5), pos.get("y", 5), pos.get("z", 5))

	light.name = params.get("name", "MCP_Light_" + light_type)
	light.light_energy = intensity

	var parent := _get_or_create_container("Lights")
	parent.add_child(light)

	_send_response(request_id, {"created": true, "name": light.name, "type": light_type, "intensity": intensity})

func _cmd_set_material(request_id: String, params: Dictionary):
	var node_name: String = params.get("node", "")
	var color_hex: String = params.get("color", "#ffffff")
	var roughness: float = params.get("roughness", 0.5)

	var node := _find_node_by_name(node_name)
	if not node or not node is MeshInstance3D:
		_send_error("Mesh node '%s' not found" % node_name, request_id)
		return

	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(color_hex)
	mat.roughness = roughness
	(node as MeshInstance3D).set_surface_override_material(0, mat)

	_send_response(request_id, {"set": true, "node": node_name, "color": color_hex, "roughness": roughness})

func _cmd_import_obj(request_id: String, params: Dictionary):
	var path: String = params.get("path", "")
	var import_name: String = params.get("name", "OBJ_Import")

	if path.is_empty():
		_send_error("Missing path parameter", request_id)
		return

	if not FileAccess.file_exists(path):
		_send_error("File not found: %s" % path, request_id)
		return

	# Godot 4 supports OBJ/MTL via ResourceLoader
	var imported := ResourceLoader.load(path, "", ResourceLoader.CACHE_MODE_IGNORE)
	if not imported:
		_send_error("ResourceLoader failed to load OBJ: %s" % path, request_id)
		return

	# OBJ import may return a PackedScene or an ArrayMesh directly
	var scene_root: Node3D
	if imported is PackedScene:
		scene_root = imported.instantiate() as Node3D
		if not scene_root:
			_send_error("OBJ PackedScene instantiation returned null", request_id)
			return
	elif imported is ArrayMesh:
		var mi := MeshInstance3D.new()
		mi.mesh = imported
		scene_root = mi
	else:
		_send_error("Unsupported OBJ import result type: %s" % imported.get_class(), request_id)
		return

	scene_root.name = import_name

	var scale_vec: float = params.get("scale", 1.0)
	var pos: Dictionary = params.get("position", {"x": 0, "y": 0, "z": 0})
	scene_root.scale = Vector3(scale_vec, scale_vec, scale_vec)
	scene_root.position = Vector3(
		pos.get("x", 0.0), pos.get("y", 0.0), pos.get("z", 0.0)
	)

	var parent := _get_or_create_container("OBJ_Imports")
	parent.add_child(scene_root)

	_send_response(request_id, {
		"imported": true,
		"name": scene_root.name,
	})

func _cmd_export_web(request_id: String, params: Dictionary):
	var output_path: String = params.get("output_path", "user://export/web/index.html")
	# Web export requires export templates to be installed
	# This is a placeholder — full implementation needs OS.shell_exec for godot CLI
	var msg := "Web export requires godot --headless --export-release \"Web\" %s" % output_path
	_send_response(request_id, {"exported": false, "message": msg, "requires_cli": true})

func _cmd_read_scene_tree(request_id: String):
	var tree := _build_scene_tree(get_tree().get_root())
	_send_response(request_id, {"scene_tree": tree, "node_count": _count_nodes(get_tree().get_root())})

func _cmd_set_config(request_id: String, params: Dictionary):
	var section: String = params.get("section", "")
	var key: String = params.get("key", "")
	var value = params.get("value", "")

	if section.is_empty() or key.is_empty():
		_send_error("Missing section or key", request_id)
		return

	# project.godot is an INI-like file
	var cfg := ConfigFile.new()
	var path := "res://project.godot"
	if cfg.load(path) != OK:
		_send_error("Failed to load project.godot", request_id)
		return

	cfg.set_value(section, key, value)
	cfg.save(path)

	_send_response(request_id, {"updated": true, "section": section, "key": key, "value": value})

func _cmd_headless_verify(request_id: String, params: Dictionary):
	var script_path: String = params.get("script", "res://dev/mcp_verify.gd")
	# In headless mode, we can't access EditorInterface
	# This reports whether we're running headless
	_send_response(request_id, {
		"headless": DisplayServer.get_name() == "headless",
		"script_path": script_path,
		"message": "Run: godot --headless --script %s for syntax verification" % script_path,
	})

func _cmd_add_node(request_id: String, params: Dictionary):
	var parent_path: String = params.get("parent", ".")
	var node_type: String = params.get("type", "Node3D")
	var node_name: String = params.get("name", "NewNode")

	var parent := get_tree().get_root().get_node_or_null(NodePath(parent_path))
	if not parent:
		_send_error("Parent node '%s' not found" % parent_path, request_id)
		return

	var node: Node
	match node_type:
		"Node3D": node = Node3D.new()
		"MeshInstance3D": node = MeshInstance3D.new()
		"Camera3D": node = Camera3D.new()
		"Light3D": node = OmniLight3D.new()
		"GPUParticles3D": node = GPUParticles3D.new()
		_: node = Node3D.new()

	node.name = node_name
	parent.add_child(node)

	_send_response(request_id, {"added": true, "path": str(node.get_path()), "type": node_type, "name": node_name})

func _cmd_remove_node(request_id: String, params: Dictionary):
	var node_path: String = params.get("path", "")
	var node := get_tree().get_root().get_node_or_null(NodePath(node_path))
	if not node:
		_send_error("Node '%s' not found" % node_path, request_id)
		return
	node.queue_free()
	_send_response(request_id, {"removed": true, "path": node_path})

func _cmd_save_scene(request_id: String, params: Dictionary):
	var path: String = params.get("path", "res://mcp_scene.tscn")
	var scene := PackedScene.new()
	var root := _get_or_create_container("MCP_Scene")
	scene.pack(root)
	var err := ResourceSaver.save(scene, path)
	_send_response(request_id, {"saved": err == OK, "path": path, "error": err})

# ─── Helpers ──────────────────────────────────────────────────────────

func _load_stl_mesh(path: String) -> ArrayMesh:
	# Godot 4 STL loading:
	# Godot doesn't natively support STL in ResourceLoader,
	# but we can use the .stl import plugin or load as OBJ if converted.
	# For now, this is a placeholder — full STL import needs the godot-mcp
	# server to pre-convert STL to OBJ or GLTF before loading.
	var file := FileAccess.open(path, FileAccess.READ)
	if not file:
		return null

	# Read binary STL header
	var header := file.get_buffer(80)
	var tri_count := file.get_32()

	var mesh := ArrayMesh.new()
	var vertices := PackedVector3Array()
	var normals := PackedVector3Array()

	for i in range(tri_count):
		var nx := file.get_float()
		var ny := file.get_float()
		var nz := file.get_float()
		normals.append(Vector3(nx, ny, nz))

		for _j in range(3):
			var vx := file.get_float()
			var vy := file.get_float()
			var vz := file.get_float()
			vertices.append(Vector3(vx, vy, vz))

		file.get_16()  # skip attribute byte count

	file.close()

	var arrays: Array = []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals

	var arr := ArrayMesh.new()
	arr.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return arr

func _get_or_create_container(name: String) -> Node3D:
	var root := get_tree().get_root()
	for child in root.get_children():
		if child.name == name and child is Node3D:
			return child as Node3D
	var container := Node3D.new()
	container.name = name
	root.add_child(container)
	return container

func _find_node_by_name(name: String) -> Node:
	var root := get_tree().get_root()
	return _find_recursive(root, name)

func _find_recursive(node: Node, name: String) -> Node:
	if node.name == name:
		return node
	for child in node.get_children():
		var found := _find_recursive(child, name)
		if found:
			return found
	return null

func _build_scene_tree(node: Node) -> Dictionary:
	var children: Array = []
	for child in node.get_children():
		children.append(_build_scene_tree(child))
	return {
		"name": node.name,
		"type": node.get_class(),
		"path": str(node.get_path()),
		"children": children,
	}

func _count_nodes(node: Node) -> int:
	var count := 1
	for child in node.get_children():
		count += _count_nodes(child)
	return count

func _send_response(request_id: String, data: Dictionary):
	var msg := {"type": "response", "request_id": request_id, "success": true, "data": data}
	_send_json(msg)

func _send_error(message: String, request_id: String = ""):
	var msg := {"type": "response", "request_id": request_id, "success": false, "error": message}
	_send_json(msg)

func _send_json(data: Dictionary):
	if not _peer:
		return
	var json_str := JSON.stringify(data) + "\n"
	_peer.put_data(json_str.to_utf8_buffer())
