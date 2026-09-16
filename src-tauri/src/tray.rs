use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Mở PHIMBOP", true, None::<&str>)?;
    let check_item = MenuItem::with_id(app, "check", "Kiểm tra phim mới ngay", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Thoát ứng dụng", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &check_item, &quit_item])?;

    let builder = if let Some(icon) = app.default_window_icon().cloned() {
        TrayIconBuilder::with_id("main-tray").icon(icon)
    } else {
        TrayIconBuilder::with_id("main-tray")
    };

    let _tray = builder
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("PHIMBOP - Phim gì cũng có!")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "check" => {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(state) = app_handle.try_state::<crate::AppState>() {
                        let _ = crate::trigger_manual_check(&app_handle, &state).await;
                    }
                });
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
