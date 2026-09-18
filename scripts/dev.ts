import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as path from 'node:path';

const rootDir = path.resolve(__dirname, '..');

function checkPortFree(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const server = net.createServer();
		server.once('error', () => resolve(false));
		server.once('listening', () => {
			server.close(() => resolve(true));
		});
		server.listen(port, '127.0.0.1');
	});
}

async function freePortIfOccupied(port: number) {
	const isFree = await checkPortFree(port);
	if (!isFree) {
		console.warn(`⚠️ [Vite] Cổng ${port} đang bị chiếm dụng, đang tự động giải phóng...`);
		try {
			execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
			await new Promise((r) => setTimeout(r, 600));
		} catch (_) {}
	}
}

async function main() {
	console.log('🚀 [PHIMBOP] Khởi chạy chế độ phát triển Full-Stack Dev (Vite + Electron + Rust Sidecar)...');

	// 1. Kiểm tra / biên dịch Rust Sidecar nếu chưa có
	const releaseBin = path.join(rootDir, 'target/release/pb-sidecar');
	const debugBin = path.join(rootDir, 'target/debug/pb-sidecar');
	if (!fs.existsSync(releaseBin) && !fs.existsSync(debugBin)) {
		console.log('📦 [Rust Sidecar] Đang biên dịch crates/pb_sidecar...');
		const cargo = spawn('cargo', ['build', '-p', 'pb_sidecar'], { cwd: rootDir, stdio: 'inherit' });
		await new Promise<void>((resolve, reject) => {
			cargo.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Cargo build exited with code ${code}`))));
		});
	}

	// 2. Build Electron main và preload bundle
	console.log('⚡ [Electron] Đang build bundle main.cjs và preload.cjs...');
	const buildElectron = spawn('bun', ['run', 'build:electron'], { cwd: rootDir, stdio: 'inherit' });
	await new Promise<void>((resolve, reject) => {
		buildElectron.on('close', (code) =>
			code === 0 ? resolve() : reject(new Error(`Electron build failed with code ${code}`))
		);
	});

	// 3. Giải phóng cổng 1420 nếu có tiến trình cũ còn treo
	await freePortIfOccupied(1420);

	// 4. Khởi động Vite Dev Server ở cổng 1420
	console.log('🌐 [Vite] Đang khởi động Vite Dev Server tại http://localhost:1420...');
	const vite = spawn('bun', ['run', 'dev'], {
		cwd: rootDir,
		stdio: 'inherit',
		env: { ...process.env, PORT: '1420' }
	});

	// Đợi Vite Dev Server sẵn sàng
	console.log('⏳ [Vite] Đang chờ HTTP server phản hồi...');
	let isViteReady = false;
	for (let i = 0; i < 40; i++) {
		try {
			const res = await fetch('http://localhost:1420');
			if (res.ok || res.status < 500) {
				isViteReady = true;
				break;
			}
		} catch (_) {
			// server chưa sẵn sàng, thử lại sau 250ms
		}
		await new Promise((r) => setTimeout(r, 250));
	}

	if (isViteReady) {
		console.log('✅ [Vite] Dev Server đã sẵn sàng tại http://localhost:1420!');
	} else {
		console.warn('⚠️ [Vite] Quá thời gian chờ (10s), khởi chạy Electron với fallback...');
	}

	// 5. Khởi chạy Electron
	console.log('🖥️ [Electron] Đang khởi chạy cửa sổ ứng dụng desktop...');
	const electron = spawn('bunx', ['electron', '.'], {
		cwd: rootDir,
		stdio: 'inherit',
		env: { ...process.env, NODE_ENV: 'development' }
	});

	const cleanup = () => {
		try {
			if (vite.pid) {
				try {
					process.kill(-vite.pid, 'SIGTERM');
				} catch (_) {
					vite.kill('SIGTERM');
				}
			}
		} catch (_) {}
		try {
			if (electron.pid) {
				try {
					process.kill(-electron.pid, 'SIGTERM');
				} catch (_) {
					electron.kill('SIGTERM');
				}
			}
		} catch (_) {}
		try {
			execSync('fuser -k 1420/tcp 2>/dev/null || true');
		} catch (_) {}
		process.exit(0);
	};

	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);

	electron.on('close', (code) => {
		console.log(`\n🛑 [Electron] Đã đóng (mã: ${code}). Dọn dẹp dev server...`);
		cleanup();
	});
}

main().catch((err) => {
	console.error('Lỗi khởi chạy dev:', err);
	process.exit(1);
});
