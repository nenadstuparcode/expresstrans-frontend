#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use printers::{get_default_printer, get_printer_by_name, get_printers};
use std::env::temp_dir;
use std::fs;
use std::io::Write;
use std::path::Path;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_to_file, printers])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn save_to_file(path: &str, content: Vec<u8>) {
    fs::write(path, content);
}

#[tauri::command]
fn printers(pdf: Vec<u8>) {
    // Use the default printer
    let default_printer = get_default_printer();
    if default_printer.is_some() {
        default_printer
            .unwrap()
            .print(&pdf, Some("Express Trans Print Job"));
        // Ok(())
    }
}
