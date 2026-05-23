extends Node3D
## HubManager — Polished hub with Stargate-style ring portals, atmospheric lighting.

const HUB_RADIUS := 12.0
const PORTAL_RING_RADIUS := 1.5
const PORTAL_RING_THICKNESS := 0.25

var portal_configs: Array[Dictionary] = []


func _ready() -> void:
	_build_floor()
	_build_centerpiece()
	_build_portal_configs()
	_build_portals()
	_build_atmosphere()

	if WorldManager:
		WorldManager.hub_scene = self
		WorldManager.hub_setup()


func _build_floor() -> void:
	# Main platform
	var floor := MeshInstance3D.new()
	floor.name = "Platform"
	var cy := CylinderMesh.new()
	cy.top_radius = HUB_RADIUS
	cy.bottom_radius = HUB_RADIUS
	cy.height = 0.3
	floor.mesh = cy
	floor.position = Vector3(0, -0.15, 0)
	var floor_mat := StandardMaterial3D.new()
	floor_mat.albedo_color = Color(0.08, 0.08, 0.12)
	floor_mat.roughness = 0.3
	floor_mat.metallic = 0.6
	floor.set_surface_override_material(0, floor_mat)
	add_child(floor)

	# Collision
	var body := StaticBody3D.new()
	body.name = "FloorCollision"
	var col := CollisionShape3D.new()
	var cs := CylinderShape3D.new()
	cs.radius = HUB_RADIUS
	cs.height = 0.3
	col.shape = cs
	col.position = Vector3(0, -0.15, 0)
	body.add_child(col)

	# Invisible wall around edge — ring of boxes so player can't fall off
	for i in range(16):
		var wall_col := CollisionShape3D.new()
		var wall_box := BoxShape3D.new()
		wall_box.size = Vector3(1.2, 5.0, 1.2)
		wall_col.shape = wall_box
		var wa := TAU * i / 16
		wall_col.position = Vector3(cos(wa) * (HUB_RADIUS - 0.3), 2.5, sin(wa) * (HUB_RADIUS - 0.3))
		body.add_child(wall_col)

	add_child(body)

	# Grid ring
	var grid := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = HUB_RADIUS - 0.5
	torus.outer_radius = HUB_RADIUS + 0.05
	grid.mesh = torus
	grid.position = Vector3(0, 0.02, 0)
	var grid_mat := StandardMaterial3D.new()
	grid_mat.albedo_color = Color(0.2, 0.4, 0.8)
	grid_mat.emission_enabled = true
	grid_mat.emission = Color(0.1, 0.2, 0.4)
	grid_mat.emission_energy_multiplier = 1.5
	grid.set_surface_override_material(0, grid_mat)
	add_child(grid)


func _build_centerpiece() -> void:
	# Central pillar
	var pillar := MeshInstance3D.new()
	var cy := CylinderMesh.new()
	cy.top_radius = 0.3
	cy.bottom_radius = 0.5
	cy.height = 2.5
	pillar.mesh = cy
	pillar.position = Vector3(0, 1.25, 0)
	var pmat := StandardMaterial3D.new()
	pmat.albedo_color = Color(0.15, 0.15, 0.2)
	pmat.roughness = 0.2
	pmat.metallic = 0.9
	pillar.set_surface_override_material(0, pmat)
	add_child(pillar)

	# Glowing orb
	var orb := MeshInstance3D.new()
	var sp := SphereMesh.new()
	sp.radius = 0.8
	sp.height = 1.6
	orb.mesh = sp
	orb.position = Vector3(0, 2.8, 0)
	var omat := StandardMaterial3D.new()
	omat.albedo_color = Color(0.4, 0.7, 1.0)
	omat.emission_enabled = true
	omat.emission = Color(0.3, 0.6, 1.0)
	omat.emission_energy_multiplier = 5.0
	orb.set_surface_override_material(0, omat)
	add_child(orb)

	# Orb glow particles
	var particles := GPUParticles3D.new()
	particles.amount = 200
	particles.lifetime = 3.0
	particles.explosiveness = 0.5
	particles.position = Vector3(0, 2.8, 0)
	var pmat2 := ParticleProcessMaterial.new()
	pmat2.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	pmat2.emission_sphere_radius = 1.0
	pmat2.direction = Vector3(0, 1, 0)
	pmat2.spread = 60.0
	pmat2.initial_velocity_min = 0.1
	pmat2.initial_velocity_max = 0.5
	pmat2.gravity = Vector3(0, -0.1, 0)
	pmat2.scale_min = 0.01
	pmat2.scale_max = 0.03
	particles.process_material = pmat2
	var dm := SphereMesh.new()
	dm.radius = 0.02
	dm.height = 0.04
	particles.draw_pass_1 = dm
	add_child(particles)


func _build_portal_configs() -> void:
	portal_configs = [
		{"id": "gothic_cathedral", "label": "Gothic Cathedral", "color": Color(0.9, 0.7, 0.3), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2Fa7936174-dfa9-4714-9e8e-d2db4389f0a3%2F7"},
		{"id": "sea_of_fog", "label": "Sea of Fog", "color": Color(0.7, 0.8, 0.9), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F5c56883a-6167-4634-84de-3f00d4ff492f%2F0"},
		{"id": "midcentury_villa", "label": "Midcentury Villa", "color": Color(0.4, 0.8, 0.5), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2Fb9b0bab8-9bea-408b-9159-2c6e5370cd5a%2Fb"},
		{"id": "wonderland", "label": "Wonderland", "color": Color(1.0, 0.4, 0.7), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F043f6225-a612-43e5-bd27-0eb0eb4fd085%2F2"},
		{"id": "deep_forest", "label": "Deep Forest", "color": Color(0.2, 0.9, 0.3), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F0569591d-6e5e-469a-a285-5214bea5a3ef%2Fa"},
		{"id": "cyberpunk_alley", "label": "Neon Alley", "color": Color(0.8, 0.2, 1.0), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F5e10e810-aaee-4240-9260-b74ea9cbfc9f%2F6"},
		{"id": "japanese_temple", "label": "Zen Temple", "color": Color(1.0, 0.5, 0.2), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F52620a3a-d5df-4793-be72-9fce88188f8e%2F4"},
		{"id": "underwater_ruins", "label": "Sunken Ruins", "color": Color(0.2, 0.6, 0.9), "url": "http://127.0.0.1:10864/spark?splat_500k=https%3A%2F%2Fcdn.marble.worldlabs.ai%2F6c1f938c-1972-49d9-bf97-4ccd08aedbd9%2Fd"},
	]


func _build_portals() -> void:
	var parent := Node3D.new()
	parent.name = "Portals"
	add_child(parent)

	for i in portal_configs.size():
		var cfg := portal_configs[i]
		var angle := TAU * i / portal_configs.size()
		var pos := Vector3(cos(angle) * 6.0, 0, sin(angle) * 6.0)
		var portal := _create_portal(cfg["id"], cfg["label"], cfg["color"], cfg["url"], pos)
		parent.add_child(portal)


func _create_portal(world_id: String, label: String, color: Color, spark_url: String, pos: Vector3) -> Node3D:
	var root := Node3D.new()
	root.name = "Portal_" + world_id
	root.position = pos
	root.look_at(Vector3.ZERO, Vector3.UP)

	# Ring
	var r := MeshInstance3D.new()
	var t := TorusMesh.new()
	t.inner_radius = 1.5
	t.outer_radius = 1.85
	r.mesh = t
	r.rotate_x(deg_to_rad(90))
	r.position = Vector3(0, 1.6, 0)

	var rm := StandardMaterial3D.new()
	rm.albedo_color = color
	rm.emission_enabled = true
	rm.emission = color * 2.0
	rm.emission_energy_multiplier = 3.0
	r.set_surface_override_material(0, rm)
	root.add_child(r)

	# Label
	var lb := Label3D.new()
	lb.text = label
	lb.position = Vector3(0, 3.4, 0)
	lb.font_size = 42
	lb.outline_size = 4
	lb.outline_modulate = Color.BLACK
	lb.modulate = color
	root.add_child(lb)

	# Sub-label
	var sl := Label3D.new()
	sl.text = "Walk through"
	sl.position = Vector3(0, 2.8, 0)
	sl.font_size = 22
	sl.outline_size = 3
	sl.outline_modulate = Color.BLACK
	sl.modulate = Color(1, 1, 1, 0.7)
	root.add_child(sl)

	# Preview panel inside ring
	var preview_path := "res://worlds/" + world_id + "_thumb.webp"
	if FileAccess.file_exists(preview_path):
		var img := Image.new()
		var load_err := img.load(preview_path)
		if load_err == OK:
			var tex := ImageTexture.create_from_image(img)
			var panel := MeshInstance3D.new()
			var box := BoxMesh.new()
			var aspect := float(img.get_width()) / float(img.get_height())
			box.size = Vector3(2.6, 2.6 / aspect, 0.01)
			panel.mesh = box
			panel.position = Vector3(0, 1.6, 0)
			var pmat := StandardMaterial3D.new()
			pmat.albedo_texture = tex
			pmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			panel.set_surface_override_material(0, pmat)
			root.add_child(panel)

	# Trigger
	var a := Area3D.new()
	a.name = "Trigger"
	var cs := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = Vector3(3.5, 3.5, 4.5)
	cs.shape = bs
	cs.position = Vector3(0, 1.5, -0.5)
	a.add_child(cs)
	var ps := load("res://scripts/portal.gd")
	a.set_script(ps)
	a.world_id = world_id
	a.portal_label = label
	a.portal_color = color
	a.spark_url = spark_url
	root.add_child(a)

	return root


func _build_atmosphere() -> void:
	# Environment
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.01, 0.01, 0.04)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.1, 0.1, 0.15)
	env.ambient_light_energy = 0.3
	env.glow_enabled = true
	env.glow_intensity = 0.4
	env.glow_bloom = 0.3
	env.fog_enabled = true
	env.fog_light_color = Color(0.1, 0.15, 0.3)
	env.fog_density = 0.01

	var world_env := WorldEnvironment.new()
	world_env.environment = env
	world_env.name = "WorldEnvironment"
	add_child(world_env)

	# Directional light
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.position = Vector3(5, 10, 5)
	sun.rotation_degrees = Vector3(-30, -45, 0)
	sun.light_energy = 0.4
	sun.shadow_enabled = false
	add_child(sun)

	# Ambient fill lights
	for i in range(4):
		var ang := TAU * i / 4.0
		var light := OmniLight3D.new()
		light.position = Vector3(cos(ang) * 10.0, 3.0, sin(ang) * 10.0)
		light.light_energy = 0.3
		light.light_color = Color(0.2 + i * 0.1, 0.1, 0.3 + i * 0.1)
		light.omni_range = 15.0
		add_child(light)


func on_hub_entered() -> void:
	show()


func on_hub_exited() -> void:
	pass


func on_game_started() -> void:
	if WorldManager and WorldManager.hub_scene == self:
		pass
