#!/usr/bin/env bash
# ==============================================================================
# PHIMBOP Desktop Installer for Linux & macOS
# Repository: https://github.com/phimbop/pb-desk
# ==============================================================================

set -e

# Color codes (only when output is a terminal)
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    MAGENTA='\033[0;35m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    MAGENTA=''
    CYAN=''
    BOLD=''
    NC=''
fi

REPO="phimbop/pb-desk"
APP_NAME="PHIMBOP"
BINARY_NAME="phimbop"
DEFAULT_ICON_URL="https://raw.githubusercontent.com/${REPO}/main/src-tauri/icons/128x128.png"

# Settings / Flags
TARGET_VERSION="${VERSION:-}"
INSTALL_FORMAT="${FORMAT:-}" # appimage | deb | auto
DRY_RUN=false
IS_UNINSTALL=false

log_info() {
    printf "${CYAN}${BOLD}[INFO]${NC} %b\n" "$1"
}

log_success() {
    printf "${GREEN}${BOLD}[SUCCESS]${NC} %b\n" "$1"
}

log_warn() {
    printf "${YELLOW}${BOLD}[WARNING]${NC} %b\n" "$1"
}

log_error() {
    printf "${RED}${BOLD}[ERROR]${NC} %b\n" "$1" >&2
}

print_banner() {
    printf "${MAGENTA}${BOLD}"
    cat << "EOF"
  ____  _   _ ___ __  __ ____   ___  ____  
 |  _ \| | | |_ _|  \/  | __ ) / _ \|  _ \ 
 | |_) | |_| || || |\/| |  _ \| | | | |_) |
 |  __/|  _  || || |  | | |_) | |_| |  __/ 
 |_|   |_| |_|___|_|  |_|____/ \___/|_|    
    Desktop App Installer (Linux & macOS)
EOF
    printf "${NC}\n"
}

print_help() {
    print_banner
    cat << EOF
Sử dụng: ./install.sh [TÙY CHỌN]
Hoặc:    curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash -s -- [TÙY CHỌN]

Tùy chọn:
  --version <tag>    Cài đặt phiên bản cụ thể (ví dụ: v0.1.0)
  --deb              (Linux) Ưu tiên cài đặt gói .deb (dành cho Ubuntu/Debian)
  --appimage         (Linux) Cài đặt định dạng di động AppImage (mặc định)
  --dry-run          Chạy thử nghiệm kiểm tra hệ thống, không thay đổi tệp tin
  --uninstall        Gỡ cài đặt PHIMBOP khỏi hệ thống
  -h, --help         Hiển thị hướng dẫn này

EOF
}

# Parse CLI arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --version)
            TARGET_VERSION="$2"
            shift 2
            ;;
        --deb)
            INSTALL_FORMAT="deb"
            shift
            ;;
        --appimage)
            INSTALL_FORMAT="appimage"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --uninstall|uninstall)
            IS_UNINSTALL=true
            shift
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            log_error "Tùy chọn không hợp lệ: $1"
            print_help
            exit 1
            ;;
    esac
done

detect_os() {
    OS="$(uname -s)"
    case "$OS" in
        Linux*)  OS="linux" ;;
        Darwin*) OS="macos" ;;
        *)
            log_error "Hệ điều hành '$OS' không được hỗ trợ bởi script này. Vui lòng tải bản cài Windows (.exe/.msi) trực tiếp từ GitHub Releases."
            exit 1
            ;;
    esac
}

detect_arch() {
    ARCH="$(uname -m)"
    case "$ARCH" in
        x86_64|amd64)
            ARCH="x86_64"
            ARCH_ALT="amd64"
            ;;
        arm64|aarch64)
            ARCH="aarch64"
            ARCH_ALT="arm64"
            ;;
        *)
            log_error "Kiến trúc CPU '$ARCH' chưa được hỗ trợ."
            exit 1
            ;;
    esac
}

need_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log_error "Cần có công cụ '$1' trong hệ thống để tiếp tục."
        exit 1
    fi
}

uninstall_app() {
    print_banner
    detect_os
    log_info "Bắt đầu gỡ cài đặt ${APP_NAME} (${OS})..."

    if [ "$OS" = "macos" ]; then
        if [ -d "/Applications/${APP_NAME}.app" ]; then
            log_info "Đang xóa /Applications/${APP_NAME}.app"
            [ "$DRY_RUN" = true ] || rm -rf "/Applications/${APP_NAME}.app"
        fi
        if [ -d "$HOME/Applications/${APP_NAME}.app" ]; then
            log_info "Đang xóa $HOME/Applications/${APP_NAME}.app"
            [ "$DRY_RUN" = true ] || rm -rf "$HOME/Applications/${APP_NAME}.app"
        fi
        log_success "Đã gỡ cài đặt ${APP_NAME} trên macOS thành công!"
        return 0
    fi

    if [ "$OS" = "linux" ]; then
        # Check deb install
        if command -v dpkg >/dev/null 2>&1 && dpkg -s phimbop >/dev/null 2>&1; then
            log_info "Tìm thấy gói deb 'phimbop'. Tiến hành gỡ bỏ..."
            if [ "$DRY_RUN" = false ]; then
                sudo apt-get remove -y phimbop || sudo dpkg -r phimbop
            fi
        fi

        # Remove local AppImage and shortcuts
        APP_BIN="$HOME/.local/bin/${BINARY_NAME}"
        DESKTOP_FILE="$HOME/.local/share/applications/phimbop.desktop"
        ICON_FILE="$HOME/.local/share/icons/hicolor/128x128/apps/phimbop.png"

        [ -f "$APP_BIN" ] && { log_info "Xóa $APP_BIN"; [ "$DRY_RUN" = true ] || rm -f "$APP_BIN"; }
        [ -f "$DESKTOP_FILE" ] && { log_info "Xóa $DESKTOP_FILE"; [ "$DRY_RUN" = true ] || rm -f "$DESKTOP_FILE"; }
        [ -f "$ICON_FILE" ] && { log_info "Xóa $ICON_FILE"; [ "$DRY_RUN" = true ] || rm -f "$ICON_FILE"; }

        if command -v update-desktop-database >/dev/null 2>&1 && [ "$DRY_RUN" = false ]; then
            update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true
        fi

        log_success "Đã gỡ cài đặt ${APP_NAME} trên Linux thành công!"
        return 0
    fi
}

download_file() {
    local url="$1"
    local dest="$2"
    log_info "Đang tải: $url"
    if command -v curl >/dev/null 2>&1; then
        curl -fSL --progress-bar "$url" -o "$dest"
    elif command -v wget >/dev/null 2>&1; then
        wget -q --show-progress "$url" -O "$dest"
    else
        log_error "Không tìm thấy curl hoặc wget để tải file."
        exit 1
    fi
}

find_local_bundle() {
    local pattern="$1"
    local found=""
    for dir in "src-tauri/target/release/bundle" "target/release/bundle"; do
        if [ -d "$dir" ]; then
            found=$(find "$dir" -type f -name "$pattern" 2>/dev/null | head -n 1 || true)
            if [ -n "$found" ]; then
                echo "$found"
                return 0
            fi
        fi
    done
    return 1
}

fetch_release_info() {
    need_cmd curl
    local api_url
    if [ -n "$TARGET_VERSION" ]; then
        api_url="https://api.github.com/repos/${REPO}/releases/tags/${TARGET_VERSION}"
    else
        api_url="https://api.github.com/repos/${REPO}/releases/latest"
    fi

    log_info "Đang kiểm tra thông tin phát hành từ GitHub (${api_url})..."
    RELEASE_JSON=$(curl -sL -H "Accept: application/vnd.github.v3+json" "$api_url" 2>/dev/null || echo "")

    if echo "$RELEASE_JSON" | grep -q '"message": "Not Found"'; then
        return 1
    fi

    TAG_NAME=$(echo "$RELEASE_JSON" | grep -m1 '"tag_name":' | sed -E 's/.*"tag_name":[[:space:]]*"([^"]+)".*/\1/' || true)
    if [ -z "$TAG_NAME" ]; then
        return 1
    fi

    log_info "Tìm thấy phiên bản phát hành: ${BOLD}${TAG_NAME}${NC}"
    return 0
}

get_download_url() {
    local pattern="$1"
    echo "$RELEASE_JSON" | grep -o "https://[^\"]*${pattern}[^\"]*" | head -n 1 || true
}

install_macos() {
    log_info "Chuẩn bị cài đặt cho macOS (${ARCH})..."

    local dmg_url=""
    local local_dmg=""
    local match_pattern=""

    if [ "$ARCH" = "aarch64" ]; then
        match_pattern="aarch64.*\.dmg"
    else
        match_pattern="(x64|x86_64).*\.dmg"
    fi

    # Check online release
    if fetch_release_info; then
        dmg_url=$(get_download_url "$match_pattern")
        if [ -z "$dmg_url" ] && [ "$ARCH" = "aarch64" ]; then
            log_warn "Không tìm thấy bản native Apple Silicon, kiểm tra bản x64 (Rosetta 2)..."
            dmg_url=$(get_download_url "(x64|x86_64).*\.dmg")
        fi
    fi

    # Check local build bundle fallback if online not found
    if [ -z "$dmg_url" ]; then
        local_dmg=$(find_local_bundle "*.dmg" || true)
        if [ -n "$local_dmg" ]; then
            log_info "Tìm thấy tệp cài đặt cục bộ đã build: $local_dmg"
        elif [ "$DRY_RUN" = true ]; then
            log_warn "[DRY-RUN] Không tìm thấy tệp release online hoặc local build. Giả lập kế hoạch cài đặt..."
            log_success "[DRY-RUN] Kiểm tra hoàn tất. Script sẽ tải DMG cho macOS (${ARCH}) và cài đặt ${APP_NAME}.app vào /Applications."
            return 0
        else
            log_error "Không tìm thấy bản phát hành phù hợp trên GitHub hoặc tệp DMG cục bộ."
            log_info "Gợi ý: Hãy tạo release trên GitHub hoặc chạy 'bun run tauri build' trong thư mục dự án."
            exit 1
        fi
    fi

    if [ "$DRY_RUN" = true ]; then
        log_success "[DRY-RUN] Kiểm tra hoàn tất. Script sẽ tải và cài đặt ${APP_NAME}.app vào /Applications."
        return 0
    fi

    TMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TMP_DIR"' EXIT

    DMG_PATH=""
    if [ -n "$dmg_url" ]; then
        DMG_PATH="${TMP_DIR}/phimbop.dmg"
        download_file "$dmg_url" "$DMG_PATH"
    else
        DMG_PATH="$local_dmg"
    fi

    MOUNT_POINT="${TMP_DIR}/mount"
    mkdir -p "$MOUNT_POINT"

    log_info "Đang mount đĩa DMG..."
    hdiutil attach "$DMG_PATH" -nobrowse -mountpoint "$MOUNT_POINT" -quiet

    log_info "Đang sao chép ứng dụng vào /Applications..."
    TARGET_APP_DIR="/Applications"
    if [ ! -w "/Applications" ]; then
        TARGET_APP_DIR="$HOME/Applications"
        mkdir -p "$TARGET_APP_DIR"
    fi

    APP_BUNDLE=$(find "$MOUNT_POINT" -maxdepth 1 -name "*.app" | head -n 1)
    if [ -z "$APP_BUNDLE" ]; then
        hdiutil detach "$MOUNT_POINT" -quiet || true
        log_error "Không tìm thấy file .app bên trong tệp DMG."
        exit 1
    fi

    rm -rf "${TARGET_APP_DIR}/${APP_NAME}.app"
    cp -R "$APP_BUNDLE" "${TARGET_APP_DIR}/"

    log_info "Đang unmount đĩa DMG..."
    hdiutil detach "$MOUNT_POINT" -quiet || true

    # Remove macOS gatekeeper quarantine attribute
    xattr -r -d com.apple.quarantine "${TARGET_APP_DIR}/${APP_NAME}.app" 2>/dev/null || true

    log_success "Cài đặt ${APP_NAME} hoàn tất!"
    printf "\n"
    printf "  Ứng dụng đã được cài đặt vào: ${BOLD}%s/${APP_NAME}.app${NC}\n" "$TARGET_APP_DIR"
    printf "  Bạn có thể mở từ Launchpad, Spotlight hoặc chạy: ${BOLD}open -a ${APP_NAME}${NC}\n\n"
}

install_linux() {
    log_info "Chuẩn bị cài đặt cho Linux (${ARCH})..."

    # Auto detect format if not forced
    if [ -z "$INSTALL_FORMAT" ]; then
        if command -v apt-get >/dev/null 2>&1 && [ -w "/etc/debian_version" -o -f "/etc/debian_version" ]; then
            INSTALL_FORMAT="deb"
        else
            INSTALL_FORMAT="appimage"
        fi
    fi

    local download_url=""
    local local_file=""
    local target_ext=""

    if [ "$INSTALL_FORMAT" = "deb" ]; then
        target_ext="deb"
        pattern="(amd64|x86_64).*\.deb"
    else
        target_ext="AppImage"
        pattern="(amd64|x86_64).*\.AppImage"
    fi

    # Check online release
    if fetch_release_info; then
        download_url=$(get_download_url "$pattern")
    fi

    # Fallback to AppImage if deb not found, or vice-versa
    if [ -z "$download_url" ] && fetch_release_info; then
        if [ "$INSTALL_FORMAT" = "deb" ]; then
            log_warn "Không tìm thấy gói .deb, chuyển sang AppImage..."
            INSTALL_FORMAT="appimage"
            pattern="(amd64|x86_64).*\.AppImage"
            download_url=$(get_download_url "$pattern")
        fi
    fi

    # Check local build bundle fallback
    if [ -z "$download_url" ]; then
        local_file=$(find_local_bundle "*.$target_ext" || true)
        if [ -n "$local_file" ]; then
            log_info "Tìm thấy tệp cài đặt cục bộ: $local_file"
        else
            # Try finding AppImage as secondary local fallback
            local_file=$(find_local_bundle "*.AppImage" || true)
            if [ -n "$local_file" ]; then
                INSTALL_FORMAT="appimage"
                log_info "Tìm thấy tệp AppImage cục bộ: $local_file"
            elif [ "$DRY_RUN" = true ]; then
                log_warn "[DRY-RUN] Không tìm thấy tệp release online hoặc local build. Giả lập kế hoạch cài đặt..."
                log_success "[DRY-RUN] Kiểm tra hoàn tất. Script sẽ tải gói ${INSTALL_FORMAT^^} (${ARCH}) và thiết lập desktop launcher tại ~/.local/share/applications/phimbop.desktop."
                return 0
            else
                log_error "Không tìm thấy gói cài đặt ($target_ext/AppImage) từ GitHub Release hoặc thư mục local build."
                log_info "Gợi ý: Chạy 'bun run tauri build' để đóng gói ứng dụng trước khi cài đặt offline."
                exit 1
            fi
        fi
    fi

    if [ "$DRY_RUN" = true ]; then
        log_success "[DRY-RUN] Kiểm tra hoàn tất. Định dạng sẽ cài đặt: ${INSTALL_FORMAT^^}."
        return 0
    fi

    TMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TMP_DIR"' EXIT

    INSTALLER_PATH=""
    if [ -n "$download_url" ]; then
        INSTALLER_PATH="${TMP_DIR}/phimbop.${target_ext}"
        download_file "$download_url" "$INSTALLER_PATH"
    else
        INSTALLER_PATH="$local_file"
    fi

    if [ "$INSTALL_FORMAT" = "deb" ]; then
        log_info "Đang cài đặt gói Debian/Ubuntu (.deb)..."
        if command -v sudo >/dev/null 2>&1; then
            sudo apt-get install -y "$INSTALLER_PATH" || sudo dpkg -i "$INSTALLER_PATH"
        else
            dpkg -i "$INSTALLER_PATH"
        fi
        log_success "Đã cài đặt gói deb ${APP_NAME} thành công!"
        printf "  Khởi chạy ứng dụng bằng cách gõ: ${BOLD}%s${NC} hoặc tìm trong Menu ứng dụng.\n\n" "$BINARY_NAME"
        return 0
    fi

    # Install AppImage
    log_info "Đang thiết lập AppImage di động..."
    BIN_DIR="$HOME/.local/bin"
    APP_DIR="$HOME/.local/share/applications"
    ICON_DIR="$HOME/.local/share/icons/hicolor/128x128/apps"

    mkdir -p "$BIN_DIR" "$APP_DIR" "$ICON_DIR"

    TARGET_BIN="${BIN_DIR}/${BINARY_NAME}"
    cp "$INSTALLER_PATH" "$TARGET_BIN"
    chmod +x "$TARGET_BIN"

    # Fetch/copy app icon
    TARGET_ICON="${ICON_DIR}/${BINARY_NAME}.png"
    if [ -f "src-tauri/icons/128x128.png" ]; then
        cp "src-tauri/icons/128x128.png" "$TARGET_ICON"
    elif [ -f "src-tauri/icons/32x32.png" ]; then
        cp "src-tauri/icons/32x32.png" "$TARGET_ICON"
    else
        curl -sSL "$DEFAULT_ICON_URL" -o "$TARGET_ICON" 2>/dev/null || true
    fi

    # Create Desktop Entry
    DESKTOP_ENTRY="${APP_DIR}/phimbop.desktop"
    cat << EOF > "$DESKTOP_ENTRY"
[Desktop Entry]
Name=${APP_NAME}
GenericName=Movie Streaming Player
Comment=Ứng dụng xem phim desktop đa nền tảng
Exec=${TARGET_BIN} %U
Icon=${BINARY_NAME}
Terminal=false
Type=Application
Categories=AudioVideo;Video;Player;
StartupWMClass=PHIMBOP
EOF
    chmod +x "$DESKTOP_ENTRY"

    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
    fi

    # Check FUSE requirement for AppImage on Linux
    if [ ! -c "/dev/fuse" ]; then
        log_warn "Hệ thống có thể cần thư viện FUSE để chạy AppImage."
        log_warn "Nếu ứng dụng không khởi động, hãy cài đặt libfuse2: sudo apt install libfuse2"
    fi

    log_success "Cài đặt ${APP_NAME} hoàn tất!"
    printf "\n"
    printf "  Thực thi: ${BOLD}%s${NC}\n" "$TARGET_BIN"
    printf "  Shortcut: ${BOLD}%s${NC}\n" "$DESKTOP_ENTRY"
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        printf "  ${YELLOW}Lưu ý: Hãy đảm bảo '$HOME/.local/bin' đã có trong biến môi trường \$PATH của bạn.${NC}\n"
    fi
    printf "  Bạn có thể mở ứng dụng từ Menu hoặc chạy lệnh: ${BOLD}%s${NC}\n\n" "$BINARY_NAME"
}

main() {
    if [ "$IS_UNINSTALL" = true ]; then
        uninstall_app
        exit 0
    fi

    print_banner
    detect_os
    detect_arch

    log_info "Phát hiện hệ thống: OS=${BOLD}${OS}${NC}, Kiến trúc=${BOLD}${ARCH}${NC}"

    if [ "$OS" = "macos" ]; then
        install_macos
    elif [ "$OS" = "linux" ]; then
        install_linux
    fi
}

main "$@"
