extends Node3D
## Hub with aligned ring portals, billboards, and Marble world previews.

const HUB_RADIUS := 12.0
const PORTAL_ORBIT := 9.25
const BONUS_ORBIT := 11.35
const RING_CENTER_Y := 1.55
const RING_INNER := 1.22
const RING_OUTER := 1.58
const PREVIEW_SIZE := 2.35

var portal_configs: Array[Dictionary] = []
var _orb_mesh: MeshInstance3D = null
var _orb_particles: GPUParticles3D = null
var _portal_nodes: Dictionary = {}


func _ready() -> void:
	add_to_group("hub_root")
	_build_floor()
	_build_centerpiece()
	_build_portal_configs()
	_build_portals()
	_build_kiosks()
	_build_architect_tokens()
	_build_atmosphere()
	_build_starfield()
	_setup_hub_audio()

	if WorldManager:
		WorldManager.hub_scene = self
		WorldManager.tour_updated.connect(_on_tour_updated)
		WorldManager.tour_completed.connect(_on_tour_completed)
		WorldManager.hub_setup()
	if GameConfig:
		GameConfig.access_ready.connect(_on_access_ready)


func _build_floor() -> void:
	var floor := MeshInstance3D.new()
	floor.name = "Platform"
	var cy := CylinderMesh.new()
	cy.top_radius = HUB_RADIUS
	cy.bottom_radius = HUB_RADIUS
	cy.height = 0.35
	floor.mesh = cy
	floor.position = Vector3(0, -0.18, 0)
	var floor_mat := StandardMaterial3D.new()
	floor_mat.albedo_color = Color(0.06, 0.07, 0.11)
	floor_mat.roughness = 0.35
	floor_mat.metallic = 0.55
	floor.set_surface_override_material(0, floor_mat)
	add_child(floor)

	var body := StaticBody3D.new()
	body.name = "FloorCollision"
	var col := CollisionShape3D.new()
	var cs := CylinderShape3D.new()
	cs.radius = HUB_RADIUS
	cs.height = 0.35
	col.shape = cs
	col.position = Vector3(0, -0.18, 0)
	body.add_child(col)

	for i in range(20):
		var wall_col := CollisionShape3D.new()
		var wall_box := BoxShape3D.new()
		wall_box.size = Vector3(1.0, 5.0, 1.0)
		wall_col.shape = wall_box
		var wa := TAU * i / 20.0
		wall_col.position = Vector3(cos(wa) * (HUB_RADIUS - 0.4), 2.5, sin(wa) * (HUB_RADIUS - 0.4))
		body.add_child(wall_col)
	add_child(body)

	for ring_idx in range(3):
		var ring := MeshInstance3D.new()
		var torus := TorusMesh.new()
		var r_in := HUB_RADIUS - 1.2 - ring_idx * 1.8
		torus.inner_radius = r_in
		torus.outer_radius = r_in + 0.08
		ring.mesh = torus
		ring.position = Vector3(0, 0.03 + ring_idx * 0.01, 0)
		var ring_mat := StandardMaterial3D.new()
		var pulse := 0.15 + ring_idx * 0.05
		ring_mat.albedo_color = Color(0.15, 0.35, 0.75, pulse + 0.2)
		ring_mat.emission_enabled = true
		ring_mat.emission = Color(0.08, 0.18, 0.45)
		ring_mat.emission_energy_multiplier = 1.2 + ring_idx * 0.4
		ring_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		ring.set_surface_override_material(0, ring_mat)
		add_child(ring)


func _build_centerpiece() -> void:
	var base := MeshInstance3D.new()
	var base_cy := CylinderMesh.new()
	base_cy.top_radius = 2.2
	base_cy.bottom_radius = 2.6
	base_cy.height = 0.25
	base.mesh = base_cy
	base.position = Vector3(0, 0.05, 0)
	var base_mat := StandardMaterial3D.new()
	base_mat.albedo_color = Color(0.12, 0.14, 0.2)
	base_mat.metallic = 0.85
	base_mat.roughness = 0.25
	base.set_surface_override_material(0, base_mat)
	add_child(base)

	var pillar := MeshInstance3D.new()
	var cy := CylinderMesh.new()
	cy.top_radius = 0.35
	cy.bottom_radius = 0.55
	cy.height = 2.0
	pillar.mesh = cy
	pillar.position = Vector3(0, 1.15, 0)
	var pmat := StandardMaterial3D.new()
	pmat.albedo_color = Color(0.18, 0.2, 0.28)
	pmat.metallic = 0.9
	pillar.set_surface_override_material(0, pmat)
	add_child(pillar)

	var orb := MeshInstance3D.new()
	var sp := SphereMesh.new()
	sp.radius = 0.65
	sp.height = 1.3
	orb.mesh = sp
	orb.position = Vector3(0, 2.55, 0)
	var omat := StandardMaterial3D.new()
	omat.albedo_color = Color(0.45, 0.75, 1.0)
	omat.emission_enabled = true
	omat.emission = Color(0.35, 0.65, 1.0)
	omat.emission_energy_multiplier = 4.5
	orb.set_surface_override_material(0, omat)
	add_child(orb)
	_orb_mesh = orb

	var title := _make_billboard_label("MARBLE PORTALS", 52, Color(0.85, 0.95, 1.0))
	title.position = Vector3(0, 3.55, 0)
	add_child(title)

	var subtitle := _make_billboard_label("Featured A–E · Bonus F–H · E at terminals", 22, Color(1, 1, 1, 0.75))
	subtitle.position = Vector3(0, 3.05, 0)
	add_child(subtitle)

	var particles := GPUParticles3D.new()
	particles.amount = 320
	particles.lifetime = 4.0
	particles.position = Vector3(0, 2.55, 0)
	var pmat2 := ParticleProcessMaterial.new()
	pmat2.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	pmat2.emission_sphere_radius = 1.2
	pmat2.direction = Vector3(0, 1, 0)
	pmat2.spread = 70.0
	pmat2.initial_velocity_min = 0.05
	pmat2.initial_velocity_max = 0.35
	pmat2.gravity = Vector3(0, -0.05, 0)
	pmat2.scale_min = 0.008
	pmat2.scale_max = 0.025
	particles.process_material = pmat2
	var dm := SphereMesh.new()
	dm.radius = 0.02
	dm.height = 0.04
	particles.draw_pass_1 = dm
	add_child(particles)
	_orb_particles = particles


func _build_portal_configs() -> void:
	portal_configs.clear()
	if GameConfig:
		portal_configs = GameConfig.get_portals()


func _build_portals() -> void:
	var featured: Array[Dictionary] = []
	var bonus: Array[Dictionary] = []
	for cfg in portal_configs:
		if str(cfg.get("tier", "featured")) == "bonus":
			bonus.append(cfg)
		else:
			featured.append(cfg)

	var parent := Node3D.new()
	parent.name = "Portals"
	add_child(parent)

	_build_portal_ring(parent, featured, PORTAL_ORBIT, false)
	_build_portal_ring(parent, bonus, BONUS_ORBIT, true)


func _build_portal_ring(parent: Node3D, configs: Array, orbit: float, is_bonus: bool) -> void:
	var count := configs.size()
	if count == 0:
		return
	for i in count:
		var cfg: Dictionary = configs[i]
		var angle := TAU * i / count - PI * 0.5
		var pos := Vector3(cos(angle) * orbit, 0, sin(angle) * orbit)
		var portal := _create_portal(cfg, pos, i + 1, is_bonus)
		parent.add_child(portal)
		_add_radial_guide(pos, cfg["color"] as Color)


func _add_radial_guide(portal_pos: Vector3, color: Color) -> void:
	var guide := MeshInstance3D.new()
	var box := BoxMesh.new()
	var length := portal_pos.length() - 2.4
	box.size = Vector3(0.15, 0.03, length)
	guide.mesh = box
	guide.position = portal_pos * 0.52
	guide.look_at(portal_pos, Vector3.UP)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color * 0.35
	mat.emission_enabled = true
	mat.emission = color * 0.5
	mat.emission_energy_multiplier = 1.2
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	guide.set_surface_override_material(0, mat)
	add_child(guide)


func _create_portal(cfg: Dictionary, pos: Vector3, index: int, is_bonus: bool = false) -> Node3D:
	var world_id: String = cfg["id"]
	var label: String = cfg["label"]
	var description: String = cfg.get("description", "")
	var color: Color = cfg["color"]
	var view_url: String = cfg.get("view_url", "")
	var marble_id: String = cfg.get("marble_id", "")

	var root := Node3D.new()
	root.name = "Portal_%s" % world_id
	root.position = pos
	root.look_at(Vector3.ZERO, Vector3.UP)

	# Pedestal
	var pedestal := MeshInstance3D.new()
	var ped_mesh := CylinderMesh.new()
	ped_mesh.top_radius = 1.85
	ped_mesh.bottom_radius = 2.05
	ped_mesh.height = 0.22
	pedestal.mesh = ped_mesh
	pedestal.position = Vector3(0, 0.11, 0)
	var ped_mat := StandardMaterial3D.new()
	ped_mat.albedo_color = Color(0.1, 0.11, 0.15)
	ped_mat.metallic = 0.7
	pedestal.set_surface_override_material(0, ped_mat)
	root.add_child(pedestal)

	var marker_text := _portal_marker_text(cfg, index, is_bonus)
	var idx_label := _make_billboard_label(marker_text, 34, color)
	idx_label.position = Vector3(0, 0.35, 0.8)
	root.add_child(idx_label)

	# Vertical ring (YZ plane — walk through along local Z)
	var ring := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = RING_INNER
	torus.outer_radius = RING_OUTER
	ring.mesh = torus
	ring.rotate_z(deg_to_rad(90))
	ring.position = Vector3(0, RING_CENTER_Y, 0)
	var ring_mat := StandardMaterial3D.new()
	ring_mat.albedo_color = color
	ring_mat.emission_enabled = true
	ring_mat.emission = color * 1.6
	ring_mat.emission_energy_multiplier = 2.5
	ring.set_surface_override_material(0, ring_mat)
	root.add_child(ring)

	# Inner glow ring
	var inner := MeshInstance3D.new()
	var inner_t := TorusMesh.new()
	inner_t.inner_radius = RING_INNER - 0.08
	inner_t.outer_radius = RING_INNER - 0.02
	inner.mesh = inner_t
	inner.rotate_z(deg_to_rad(90))
	inner.position = Vector3(0, RING_CENTER_Y, 0)
	var inner_mat := StandardMaterial3D.new()
	inner_mat.emission_enabled = true
	inner_mat.emission = Color.WHITE
	inner_mat.emission_energy_multiplier = 1.5
	inner.set_surface_override_material(0, inner_mat)
	root.add_child(inner)

	var preview_holder := Node3D.new()
	preview_holder.name = "PreviewHolder"
	preview_holder.position = Vector3(0, RING_CENTER_Y, 0.02)
	root.add_child(preview_holder)
	_add_preview_placeholder(preview_holder, color, label)
	_start_preview_load(preview_holder, world_id, marble_id)

	# Title above ring (faces player from hub center)
	var title := _make_billboard_label(label, 44, color)
	title.position = Vector3(0, RING_CENTER_Y + 2.05, 0)
	root.add_child(title)

	var blurb := _make_billboard_label(description, 22, Color(1, 1, 1, 0.88))
	blurb.position = Vector3(0, RING_CENTER_Y + 1.55, 0)
	root.add_child(blurb)

	var hint_text := "Bonus world" if is_bonus else "Walk through to open world"
	var hint := _make_billboard_label(hint_text, 18, Color(0.75, 0.85, 1.0, 0.65))
	hint.position = Vector3(0, RING_CENTER_Y - 1.35, 0)
	root.add_child(hint)

	if is_bonus:
		var bonus_tag := _make_billboard_label("BONUS", 20, Color(1.0, 0.85, 0.35, 0.9))
		bonus_tag.position = Vector3(0, RING_CENTER_Y + 2.55, 0)
		root.add_child(bonus_tag)

	# Base accent light
	var light := OmniLight3D.new()
	light.position = Vector3(0, 0.6, 0.5)
	light.light_color = color
	light.light_energy = 0.55
	light.omni_range = 4.5
	root.add_child(light)

	# Trigger volume aligned with ring plane
	var trigger := Area3D.new()
	trigger.name = "Trigger"
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(0.55, 2.8, 2.8)
	cs.shape = shape
	cs.position = Vector3(0, RING_CENTER_Y, 0)
	trigger.add_child(cs)
	var ps := load("res://scripts/portal.gd")
	trigger.set_script(ps)
	trigger.portal_id = world_id
	trigger.portal_label = label
	trigger.portal_color = color
	trigger.view_url = view_url
	trigger.ring_mesh = ring
	trigger.title_label = title
	trigger.is_bonus = is_bonus
	root.add_child(trigger)
	_portal_nodes[world_id] = trigger

	if WorldManager and WorldManager.is_visited(world_id):
		trigger.refresh_visited_label()

	return root


func _portal_marker_text(cfg: Dictionary, index: int, is_bonus: bool) -> String:
	var letter := "?"
	if GameConfig:
		letter = GameConfig.alpha_letter(index, is_bonus)
	if PlayerSettings and PlayerSettings.colorblind_icons and GameConfig:
		var glyph := GameConfig.icon_glyph(str(cfg.get("icon_shape", "circle")))
		return "%s %s" % [glyph, letter]
	return letter


func _make_billboard_label(text: String, font_size: int, color: Color) -> Label3D:
	var lb := Label3D.new()
	lb.text = text
	lb.font_size = font_size
	lb.modulate = color
	lb.outline_size = 8
	lb.outline_modulate = Color(0, 0, 0, 0.95)
	lb.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	lb.fixed_size = true
	lb.pixel_size = 0.0028
	lb.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return lb


func _add_preview_placeholder(holder: Node3D, color: Color, label: String) -> void:
	var panel := MeshInstance3D.new()
	panel.name = "PreviewPlaceholder"
	var plane := PlaneMesh.new()
	plane.size = Vector2(PREVIEW_SIZE, PREVIEW_SIZE)
	panel.mesh = plane
	panel.rotate_y(PI)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = color.darkened(0.55)
	mat.emission_enabled = true
	mat.emission = color * 0.35
	mat.emission_energy_multiplier = 0.8
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	panel.set_surface_override_material(0, mat)
	holder.add_child(panel)


func _apply_preview_texture(holder: Node3D, tex: Texture2D) -> void:
	for child in holder.get_children():
		child.queue_free()

	var panel := MeshInstance3D.new()
	panel.name = "Preview"
	var img := tex.get_image()
	var aspect := 1.0
	if img:
		aspect = float(img.get_width()) / maxf(float(img.get_height()), 1.0)
	var plane := PlaneMesh.new()
	if aspect >= 1.0:
		plane.size = Vector2(PREVIEW_SIZE, PREVIEW_SIZE / aspect)
	else:
		plane.size = Vector2(PREVIEW_SIZE * aspect, PREVIEW_SIZE)
	panel.mesh = plane
	panel.rotate_y(PI)

	var frame := MeshInstance3D.new()
	var frame_plane := PlaneMesh.new()
	frame_plane.size = plane.size + Vector2(0.12, 0.12)
	frame.mesh = frame_plane
	frame.rotate_y(PI)
	frame.position = Vector3(0, 0, 0.01)
	var frame_mat := StandardMaterial3D.new()
	frame_mat.albedo_color = Color(0.05, 0.05, 0.08)
	frame_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	frame.set_surface_override_material(0, frame_mat)
	holder.add_child(frame)

	var mat := StandardMaterial3D.new()
	mat.albedo_texture = tex
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	panel.set_surface_override_material(0, mat)
	holder.add_child(panel)


func _start_preview_load(holder: Node3D, world_id: String, marble_id: String) -> void:
	var loader: Node = load("res://scripts/portal_preview.gd").new()
	holder.add_child(loader)
	loader.loaded.connect(func(tex: Texture2D) -> void:
		if is_instance_valid(holder):
			_apply_preview_texture(holder, tex)
	)
	loader.load_preview(world_id, marble_id)


func _build_atmosphere() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.008, 0.01, 0.035)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.12, 0.14, 0.22)
	env.ambient_light_energy = 0.45
	env.glow_enabled = true
	env.glow_intensity = 0.55
	env.glow_bloom = 0.35
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT
	env.fog_enabled = true
	env.fog_light_color = Color(0.08, 0.12, 0.28)
	env.fog_density = 0.012
	env.fog_aerial_perspective = 0.2

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	world_env.name = "WorldEnvironment"
	add_child(world_env)

	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-35, -40, 0)
	sun.light_energy = 0.55
	sun.light_color = Color(0.85, 0.9, 1.0)
	add_child(sun)

	for i in range(6):
		var ang := TAU * i / 6.0
		var light := OmniLight3D.new()
		light.position = Vector3(cos(ang) * 11.0, 4.0, sin(ang) * 11.0)
		light.light_energy = 0.22
		light.light_color = Color(0.25 + i * 0.05, 0.15, 0.35)
		light.omni_range = 18.0
		add_child(light)


func _build_starfield() -> void:
	var stars := GPUParticles3D.new()
	stars.name = "Starfield"
	stars.amount = 600
	stars.lifetime = 8.0
	stars.preprocess = 8.0
	stars.visibility_aabb = AABB(Vector3(-40, -5, -40), Vector3(80, 30, 80))
	var mat := ParticleProcessMaterial.new()
	mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	mat.emission_box_extents = Vector3(30, 12, 30)
	mat.direction = Vector3(0, 0, 0)
	mat.spread = 180.0
	mat.initial_velocity_min = 0.0
	mat.initial_velocity_max = 0.02
	mat.gravity = Vector3.ZERO
	mat.scale_min = 0.01
	mat.scale_max = 0.04
	stars.process_material = mat
	var dm := SphereMesh.new()
	dm.radius = 0.015
	dm.height = 0.03
	stars.draw_pass_1 = dm
	stars.position = Vector3(0, 8, 0)
	add_child(stars)


func on_hub_entered() -> void:
	show()


func on_hub_exited() -> void:
	pass


func on_game_started() -> void:
	pass


func _setup_hub_audio() -> void:
	var audio_root := Node.new()
	audio_root.name = "HubAudio"
	audio_root.set_script(load("res://scripts/hub_audio.gd"))
	add_child(audio_root)
	for name in ["AmbientLow", "AmbientMid", "AmbientHigh", "PortalSfx", "ApproachSfx"]:
		var p := AudioStreamPlayer.new()
		p.name = name
		audio_root.add_child(p)


func _build_kiosks() -> void:
	if GameConfig == null:
		return
	var parent := Node3D.new()
	parent.name = "Kiosks"
	add_child(parent)
	var script := load("res://scripts/terminal_kiosk.gd")
	for kiosk in GameConfig.get_kiosks():
		if typeof(kiosk) != TYPE_DICTIONARY:
			continue
		var pos_arr: Array = kiosk.get("position", [0, 0, 0])
		var area := Area3D.new()
		area.name = "Kiosk_%s" % kiosk.get("id", "x")
		area.position = Vector3(float(pos_arr[0]), float(pos_arr[1]), float(pos_arr[2]))
		area.set_script(script)
		area.kiosk_id = str(kiosk.get("id", ""))
		area.kiosk_title = str(kiosk.get("title", "Terminal"))
		area.kiosk_body = str(kiosk.get("body", ""))
		var cs := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(2.2, 2.4, 2.2)
		cs.shape = box
		cs.position = Vector3(0, 1.2, 0)
		area.add_child(cs)
		var pillar := MeshInstance3D.new()
		var cy := CylinderMesh.new()
		cy.top_radius = 0.35
		cy.bottom_radius = 0.45
		cy.height = 1.5
		pillar.mesh = cy
		pillar.position = Vector3(0, 0.75, 0)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.15, 0.55, 0.95, 0.9)
		mat.emission_enabled = true
		mat.emission = Color(0.2, 0.5, 1.0)
		mat.emission_energy_multiplier = 1.8
		pillar.set_surface_override_material(0, mat)
		area.add_child(pillar)
		var sign := _make_billboard_label(str(kiosk.get("title", "Terminal")), 26, Color(0.7, 0.9, 1.0))
		sign.position = Vector3(0, 2.0, 0)
		area.add_child(sign)
		var hint := _make_billboard_label("Walk in — read in HUD", 16, Color(0.75, 0.85, 1.0, 0.6))
		hint.position = Vector3(0, 1.35, 0)
		area.add_child(hint)
		parent.add_child(area)


func _build_architect_tokens() -> void:
	if GameConfig == null or WorldManager == null:
		return
	var parent := Node3D.new()
	parent.name = "ArchitectTokens"
	add_child(parent)
	var script := load("res://scripts/architect_token.gd")
	var idx := 0
	for pos_arr in GameConfig.get_token_positions():
		if typeof(pos_arr) != TYPE_ARRAY or pos_arr.size() < 3:
			continue
		var token_id := "token_%d" % idx
		if WorldManager.tokens_collected.has(token_id):
			idx += 1
			continue
		var area := Area3D.new()
		area.name = token_id
		area.position = Vector3(float(pos_arr[0]), float(pos_arr[1]), float(pos_arr[2]))
		area.set_script(script)
		area.token_id = token_id
		var cs := CollisionShape3D.new()
		var sp := SphereShape3D.new()
		sp.radius = 0.45
		cs.shape = sp
		area.add_child(cs)
		var orb := MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 0.28
		mesh.height = 0.56
		orb.mesh = mesh
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.95, 0.85, 0.35)
		mat.emission_enabled = true
		mat.emission = Color(1.0, 0.9, 0.4)
		mat.emission_energy_multiplier = 3.0
		orb.set_surface_override_material(0, mat)
		area.add_child(orb)
		parent.add_child(area)
		idx += 1


func _on_tour_updated(visited_count: int, total: int) -> void:
	_update_orb_progress(float(visited_count) / float(max(total, 1)))
	for portal_id in _portal_nodes:
		var node = _portal_nodes[portal_id]
		if node and node.has_method("refresh_visited_label"):
			node.refresh_visited_label()


func _on_tour_completed() -> void:
	_update_orb_progress(1.0)
	if _orb_particles:
		_orb_particles.amount = 520


func _update_orb_progress(ratio: float) -> void:
	if _orb_mesh == null:
		return
	var mat := _orb_mesh.get_surface_override_material(0) as StandardMaterial3D
	if mat == null:
		return
	mat.emission_energy_multiplier = 4.5 + ratio * 6.0
	mat.emission = Color(0.35, 0.65, 1.0).lerp(Color(0.5, 1.0, 0.75), ratio)


func _on_access_ready() -> void:
	if GameConfig == null:
		return
	for portal_id in _portal_nodes:
		var node = _portal_nodes[portal_id]
		if node == null:
			continue
		for cfg in GameConfig.get_portals():
			if cfg.get("id", "") == portal_id:
				node.view_url = cfg.get("view_url", node.view_url)
				break
