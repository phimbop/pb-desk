import slugify from 'slugify';
class CommonHelper {
	/**
	 * Checks if an element is a common focusable one.
	 *
	 * @param {Node} element
	 * @return {boolean}
	 */

	static isInput(element: Node | null): boolean {
		const tagName = element && element.nodeName ? (element.nodeName as string).toLowerCase() : '';

		return (
			tagName === 'input' ||
			tagName === 'select' ||
			tagName === 'textarea' ||
			(element instanceof HTMLElement && element.isContentEditable)
		);
	}

	static isFocusable(element: Node): boolean {
		const tagName = element && element instanceof HTMLElement ? element.tagName.toLowerCase() : '';

		return (
			CommonHelper.isInput(element) ||
			tagName === 'button' ||
			tagName === 'a' ||
			tagName === 'details' ||
			(element instanceof HTMLElement && element.tabIndex >= 0)
		);
	}

	// static stringToSlug(inputString: string): string {
	//   return inputString
	//     .toLowerCase() // Chuyển thành chữ thường
	//     .normalize("NFD") // Loại bỏ dấu
	//     .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt (nếu cần)
	//     .replace(/[^a-z0-9]+/g, "-") // Thay khoảng trắng và ký tự không hợp lệ bằng gạch ngang
	//     .replace(/^-+|-+$/g, "") // Loại bỏ dấu gạch ngang ở đầu và cuối chuỗi
	//     .replace(/-+/g, "-"); // Loại bỏ nhiều dấu gạch ngang liên tiếp
	// }
	static stringToSlug(inputString: string): string {
		// Sử dụng slugify để tạo slug cho các ngôn ngữ khác nhau
		const slug = slugify(inputString, {
			replacement: '-', // Sử dụng dấu gạch ngang thay vì dấu gạch dưới
			lower: true, // Chuyển thành chữ thường
			remove: /[\/#$*_+~.()'"!\-:@?]/g, // Loại bỏ các ký tự không phải chữ cái, số, khoảng trắng, hoặc dấu gạch ngang
			locale: 'vi'
		});
		return slug;
	}

	static debounce = (callback: Function, wait = 300) => {
		let timeout: ReturnType<typeof setTimeout>;

		return (...args: any[]) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => callback(...args), wait);
		};
	};

	static throttle = <T extends (...args: any[]) => void>(
		callback: T,
		wait = 300
	): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
		let lastCallTime: number | undefined; // Thời điểm lần gọi cuối cùng
		let timeout: ReturnType<typeof setTimeout> | undefined; // Timer cho lần chạy tiếp theo

		const throttled = (...args: Parameters<T>) => {
			const now = Date.now();

			// Nếu chưa gọi lần nào hoặc đã qua thời gian wait kể từ lần gọi cuối
			if (lastCallTime === undefined || now - lastCallTime >= wait) {
				callback(...args); // Gọi ngay lập tức
				lastCallTime = now; // Cập nhật thời điểm gọi cuối
			} else if (!timeout) {
				// Nếu đang trong khoảng wait, lập lịch cho lần chạy tiếp theo
				const delay = wait - (now - lastCallTime);
				timeout = setTimeout(() => {
					callback(...args);
					lastCallTime = Date.now();
					timeout = undefined; // Reset timer
				}, delay);
			}
		};

		throttled.cancel = () => {
			if (timeout !== undefined) {
				clearTimeout(timeout);
				timeout = undefined;
			}
		};

		return throttled as typeof throttled & { cancel: () => void };
	};
	// Add other utility methods here as needed.
}

export default CommonHelper;
