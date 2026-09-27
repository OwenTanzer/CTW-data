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
    let mut decoded = Bmd::decode(&mut cursor, &None)?;
    if cursor.position() != source.len() as u64 { return Err("Decoder did not consume source".into()); }
    let mut roundtrip = Vec::new();
    decoded.encode(&mut roundtrip, &None)?;
    let output = serde_json::json!({
        "decoder": "rpfm_lib", "revision": "a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f",
        "source_bytes": source.len(), "consumed_bytes": cursor.position(),
        "roundtrip_byte_equal": source == roundtrip,
        "status": "decoded_source_not_runtime_verified", "bmd": decoded,
    });
    let stdout = io::stdout();
    let mut out = stdout.lock();
    serde_json::to_writer_pretty(&mut out, &output)?;
    writeln!(out)?;
    Ok(())
}
