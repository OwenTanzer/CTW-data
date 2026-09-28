//! Decode an extracted BMD without running or modifying the game/server.
use rpfm_lib::files::{bmd::Bmd, Decodeable, Encodeable};
use std::{env, fs, io::{self, Cursor, Write}, process};

fn main() {
    if let Err(error) = run() {
        eprintln!("{error}");
        process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 { return Err("Usage: ctw-battlefield-decoder extracted-file.bmd".into()); }
    let source = fs::read(&args[1])?;
    let mut cursor = Cursor::new(&source);
    let mut decoded = Bmd::decode(&mut cursor, &None).map_err(|e| format!("{e}; byte_offset={}", cursor.position()))?;
    if cursor.position() != source.len() as u64 { return Err("Decoder did not consume source".into()); }
    let mut roundtrip = Vec::new();
    decoded.encode(&mut roundtrip, &None)?;
    let mut native = serde_json::to_value(&decoded)?;
    clean_opaque(&mut native);
    let output = serde_json::json!({
        "decoder": "rpfm_lib", "revision": "a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f",
        "source_bytes": source.len(), "consumed_bytes": cursor.position(),
        "roundtrip_byte_equal": source == roundtrip,
        "status": "decoded_source_not_runtime_verified", "patch_set": rpfm_lib::files::bmd::CTW_COLLECTION_FORMATS, "bmd": native,
    });
    let stdout = io::stdout();
    let mut out = stdout.lock();
    serde_json::to_writer(&mut out, &output)?;
    writeln!(out)?;
    Ok(())
}

// Fields absent in older native records must not appear as default-valued facts.
fn clean_opaque(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::Object(object) => {
            // RPFM generates these editor export IDs randomly; no supported
            // CaptureLocationSet binary version reads or writes them.
            if let Some(serde_json::Value::Array(locations)) = object.get_mut("capture_locations") {
                for location in locations {
                    if let Some(fields) = location.as_object_mut() { fields.remove("id"); }
                }
            }
            if object.contains_key("v2_light_probe_raw") {
                object.retain(|key, _| ["serialise_version", "v2_light_probe_raw", "height_mode"].contains(&key.as_str()));
            }
            if object.contains_key("uninterpreted_property_flags") {
                object.retain(|key, _| ["serialise_version", "building_id", "starting_damage_unary", "uninterpreted_property_flags"].contains(&key.as_str()));
            }
            for child in object.values_mut() { clean_opaque(child); }
        },
        serde_json::Value::Array(array) => { for child in array { clean_opaque(child); } },
        _ => (),
    }
}
