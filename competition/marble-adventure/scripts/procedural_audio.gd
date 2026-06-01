class_name ProceduralAudio
extends RefCounted
## Procedural tones and ambient layers (no external audio files required).

static func make_tone(hz: float, duration_sec: float, volume: float = 0.25) -> AudioStreamWAV:
	var mix_rate := 22050
	var sample_count := int(mix_rate * duration_sec)
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = mix_rate
	stream.stereo = false
	var data := PackedByteArray()
	data.resize(sample_count * 2)
	for i in sample_count:
		var t := float(i) / float(mix_rate)
		var attack := clampf(t * 30.0, 0.0, 1.0)
		var release := clampf((duration_sec - t) * 12.0, 0.0, 1.0)
		var env := attack * release
		var sample := int(sin(TAU * hz * t) * 32767.0 * volume * env)
		data[i * 2] = sample & 0xFF
		data[i * 2 + 1] = (sample >> 8) & 0xFF
	stream.data = data
	return stream


static func make_ambient_loop(hz: float, duration_sec: float = 4.0, volume: float = 0.12) -> AudioStreamWAV:
	var mix_rate := 22050
	var sample_count := int(mix_rate * duration_sec)
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = mix_rate
	stream.stereo = true
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = sample_count
	var data := PackedByteArray()
	data.resize(sample_count * 4)
	for i in sample_count:
		var t := float(i) / float(mix_rate)
		var lfo := sin(TAU * 0.08 * t) * 0.15 + 0.85
		var sample_f := sin(TAU * hz * t) * 0.55
		sample_f += sin(TAU * hz * 1.5 * t) * 0.25
		sample_f += sin(TAU * hz * 0.5 * t) * 0.2
		sample_f *= volume * lfo
		var sample := int(clampf(sample_f, -1.0, 1.0) * 32767.0)
		data[i * 4] = sample & 0xFF
		data[i * 4 + 1] = (sample >> 8) & 0xFF
		data[i * 4 + 2] = sample & 0xFF
		data[i * 4 + 3] = (sample >> 8) & 0xFF
	stream.data = data
	return stream
