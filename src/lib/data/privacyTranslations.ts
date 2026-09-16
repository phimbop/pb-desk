export interface PrivacyPolicyContent {
	seoTitle: string;
	seoDescription: string;
	title: string;
	lastUpdated: string;
	backHome: string;
	welcomeIntro: string;
	section1: {
		title: string;
		desc: string;
		personalInfoLabel: string;
		personalInfoText: string;
		accessDataLabel: string;
		accessDataText: string;
		cookieLabel: string;
		cookieText: string;
	};
	section2: {
		title: string;
		items: string[];
	};
	section3: {
		title: string;
		desc: string;
		items: string[];
	};
	section4: {
		title: string;
		items: string[];
	};
	section5: {
		title: string;
		desc: string;
	};
	section6: {
		title: string;
		desc: string;
		items: string[];
	};
	section7: {
		title: string;
		desc: string;
	};
	section8: {
		title: string;
		desc: string;
	};
}

export const privacyTranslations: Record<string, PrivacyPolicyContent> = {
	vi: {
		seoTitle: 'Chính sách bảo mật - Privacy Policy',
		seoDescription: 'Chính sách bảo mật - Privacy Policy PhimBop',
		title: 'CHÍNH SÁCH BẢO MẬT',
		lastUpdated: 'Cập nhật lần cuối: 30/03/2025',
		backHome: '← Quay về trang chủ PhimBop',
		welcomeIntro: 'Chào mừng bạn đến với PhimBop! Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và chia sẻ thông tin khi bạn sử dụng dịch vụ của chúng tôi.',
		section1: {
			title: '1. Thông Tin Thu Thập',
			desc: 'Chúng tôi có thể thu thập các loại thông tin sau:',
			personalInfoLabel: 'Thông tin cá nhân:',
			personalInfoText: 'Email, tên đăng nhập, mật khẩu (nếu bạn đăng ký tài khoản).',
			accessDataLabel: 'Dữ liệu truy cập:',
			accessDataText: 'Địa chỉ IP, trình duyệt, thiết bị, thời gian truy cập, trang bạn xem.',
			cookieLabel: 'Cookie & Công nghệ lưu trữ:',
			cookieText: 'Để cải thiện trải nghiệm, lưu trữ cài đặt và phân tích lưu lượng truy cập.'
		},
		section2: {
			title: '2. Mục Đích Sử Dụng',
			items: [
				'Cung cấp dịch vụ xem phim và các tính năng cá nhân hóa.',
				'Phân tích để cải thiện chất lượng ứng dụng và trải nghiệm người dùng.',
				'Ngăn chặn hành vi lạm dụng hoặc vi phạm bản quyền.',
				'Gửi thông báo cập nhật (nếu bạn đăng ký nhận tin).'
			]
		},
		section3: {
			title: '3. Chia Sẻ Thông Tin',
			desc: 'Chúng tôi không bán thông tin cá nhân của bạn. Dữ liệu có thể được chia sẻ với:',
			items: [
				'Đối tác dịch vụ thiết yếu (ví dụ: máy chủ lưu trữ, dịch vụ phân tích kỹ thuật).',
				'Cơ quan pháp luật nếu có yêu cầu hợp pháp và bắt buộc theo quy định.'
			]
		},
		section4: {
			title: '4. Bảo Mật Dữ Liệu',
			items: [
				'Sử dụng mã hóa SSL/TLS cho toàn bộ dữ liệu truyền tải trên mạng.',
				'Áp dụng các biện pháp kỹ thuật chuyên sâu để ngăn chặn truy cập trái phép.'
			]
		},
		section5: {
			title: '5. Liên Kết Ngoài',
			desc: 'Ứng dụng có thể chứa liên kết đến dịch vụ bên ngoài. Chúng tôi không chịu trách nhiệm về nội dung hoặc chính sách bảo mật của các bên thứ ba đó.'
		},
		section6: {
			title: '6. Quyền Của Người Dùng',
			desc: 'Bạn có các quyền sau đối với dữ liệu của mình:',
			items: [
				'Truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân.',
				'Quản lý dữ liệu lưu trữ cục bộ trong phần cài đặt.',
				'Liên hệ với đội ngũ của chúng tôi qua email phimbop@duck.com để được hỗ trợ kịp thời.'
			]
		},
		section7: {
			title: '7. Thay Đổi Chính Sách',
			desc: 'Chúng tôi có thể cập nhật chính sách này định kỳ. Mọi phiên bản cập nhật mới sẽ được đăng tải trực tiếp tại trang này.'
		},
		section8: {
			title: '8. Liên Hệ',
			desc: 'Nếu có bất kỳ câu hỏi hoặc thắc mắc nào, vui lòng gửi email đến: phimbop@duck.com.'
		}
	},
	en: {
		seoTitle: 'Privacy Policy - PhimBop',
		seoDescription: 'PhimBop Privacy Policy and Data Protection',
		title: 'PRIVACY POLICY',
		lastUpdated: 'Last updated: March 30, 2025',
		backHome: '← Back to PhimBop Home',
		welcomeIntro: 'Welcome to PhimBop! We are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share information when you access and use our services.',
		section1: {
			title: '1. Information We Collect',
			desc: 'We may collect the following types of information:',
			personalInfoLabel: 'Personal Information:',
			personalInfoText: 'Email, username, and password (if you register an account).',
			accessDataLabel: 'Access Data:',
			accessDataText: 'IP address, browser, device type, access timestamps, and viewed pages.',
			cookieLabel: 'Cookies & Local Storage:',
			cookieText: 'To enhance user experience, remember your preferences, and analyze traffic.'
		},
		section2: {
			title: '2. Purpose of Use',
			items: [
				'Provide video playback services and personalized features.',
				'Analyze and optimize application performance and user experience.',
				'Prevent abusive behavior, fraud, and copyright infringement.',
				'Send system notifications and updates (if you opt in).'
			]
		},
		section3: {
			title: '3. Information Sharing',
			desc: 'We do not sell your personal information. Data may be shared only with:',
			items: [
				'Essential service partners (e.g., hosting providers, technical analytics).',
				'Law enforcement authorities when strictly required by applicable legal mandates.'
			]
		},
		section4: {
			title: '4. Data Security',
			items: [
				'Implement end-to-end SSL/TLS encryption for all network transmissions.',
				'Employ strict access controls and technical safeguards to prevent unauthorized access.'
			]
		},
		section5: {
			title: '5. External Links',
			desc: 'Our service may contain links to external third-party sites. We are not responsible for the content or privacy practices of those external services.'
		},
		section6: {
			title: '6. Your Rights',
			desc: 'You have the following rights regarding your personal information:',
			items: [
				'Access, rectify, or request deletion of your account and personal data.',
				'Manage cookie settings and clear local storage data.',
				'Contact our support team anytime via email at phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Policy Changes',
			desc: 'We may update this Privacy Policy from time to time. Any revisions will be published directly on this page.'
		},
		section8: {
			title: '8. Contact Us',
			desc: 'If you have any questions or concerns regarding this policy, please email: phimbop@duck.com.'
		}
	},
	zh: {
		seoTitle: '隐私政策 - PhimBop',
		seoDescription: 'PhimBop 隐私政策与数据安全',
		title: '隐私政策',
		lastUpdated: '最后更新：2025年3月30日',
		backHome: '← 返回 PhimBop 首页',
		welcomeIntro: '欢迎使用 PhimBop！我们致力于保护您的个人信息。本政策说明在您使用我们的服务时，我们如何收集、使用和分享信息。',
		section1: {
			title: '1. 收集的信息',
			desc: '我们可能会收集以下类型的信息：',
			personalInfoLabel: '个人信息：',
			personalInfoText: '邮箱、用户名、密码（如果您注册了账户）。',
			accessDataLabel: '访问数据：',
			accessDataText: 'IP地址、浏览器类型、设备信息、访问时间以及浏览页面。',
			cookieLabel: 'Cookie与本地存储：',
			cookieText: '用于改善用户体验、保存个性化偏好及流量分析。'
		},
		section2: {
			title: '2. 使用目的',
			items: [
				'提供流媒体视频播放及个性化功能。',
				'分析并提升应用性能与用户体验。',
				'防止滥用行为、欺诈或侵犯版权。',
				'发送更新通知（如果您选择订阅）。'
			]
		},
		section3: {
			title: '3. 信息共享',
			desc: '我们不会出售您的个人信息。数据仅在以下必要情况下共享：',
			items: [
				'基础服务提供商（例如云服务托管、技术分析平台）。',
				'依据法律法规或执法机关的法定程序要求。'
			]
		},
		section4: {
			title: '4. 数据安全',
			items: [
				'使用 SSL/TLS 加密技术保障网络数据传输安全。',
				'采取多重技术措施防止未经授权的访问与数据泄露。'
			]
		},
		section5: {
			title: '5. 第三方链接',
			desc: '应用中可能包含指向外部第三方的链接。我们对第三方的服务内容或隐私政策不承担责任。'
		},
		section6: {
			title: '6. 用户权利',
			desc: '您对自己的数据享有以下权利：',
			items: [
				'查询、修改或申请删除您的个人数据。',
				'管理 Cookie 与本地缓存数据。',
				'随时通过邮箱 phimbop@duck.com 与我们联系以获取帮助。'
			]
		},
		section7: {
			title: '7. 政策更新',
			desc: '我们可能会不定期更新本隐私政策。最新版本将直接发布在本页面上。'
		},
		section8: {
			title: '8. 联系我们',
			desc: '如对本政策有任何疑问，请发邮件至：phimbop@duck.com。'
		}
	},
	ja: {
		seoTitle: 'プライバシーポリシー - PhimBop',
		seoDescription: 'PhimBop プライバシーポリシーおよびデータ保護',
		title: 'プライバシーポリシー',
		lastUpdated: '最終更新日：2025年3月30日',
		backHome: '← PhimBop ホームに戻る',
		welcomeIntro: 'PhimBopへようこそ！私たちは利用者の皆様の個人情報保護に努めています。本ポリシーは、当サービスをご利用いただく際の情報収集、使用、共有について説明するものです。',
		section1: {
			title: '1. 収集する情報',
			desc: '以下の種類の情報を収集する場合があります：',
			personalInfoLabel: '個人情報：',
			personalInfoText: 'メールアドレス、ユーザー名、パスワード（アカウント登録時）。',
			accessDataLabel: 'アクセスデータ：',
			accessDataText: 'IPアドレス、ブラウザ種別、デバイス情報、アクセス日時、閲覧ページ。',
			cookieLabel: 'Cookieおよびストレージ：',
			cookieText: '利便性の向上、設定の保存、アクセス解析のために使用します。'
		},
		section2: {
			title: '2. 利用目的',
			items: [
				'動画再生サービスおよびパーソナライズ機能の提供。',
				'アプリの品質向上およびユーザー体験の改善のための分析。',
				'不正利用や著作権侵害の防止。',
				'システム通知や重要なお知らせの送信（受信許可時）。'
			]
		},
		section3: {
			title: '3. 情報の共有',
			desc: '当社はお客様の個人情報を販売しません。データは以下の場合にのみ共有されることがあります：',
			items: [
				'サービス提供に必要なパートナー（サーバーホスティング、技術分析など）。',
				'法令に基づき正当な開示要求がある場合。'
			]
		},
		section4: {
			title: '4. データセキュリティ',
			items: [
				'SSL/TLS通信暗号化技術を使用してデータを安全に保護します。',
				'不正アクセスを防止するための技術的措置を講じています。'
			]
		},
		section5: {
			title: '5. 外部リンク',
			desc: '当サービスには外部サイトへのリンクが含まれる場合があります。外部サイトのプライバシー方針やコンテンツについて当社は責任を負いません。'
		},
		section6: {
			title: '6. 利用者の権利',
			desc: '利用者の皆様には以下の権利があります：',
			items: [
				'個人情報の確認、修正、削除の要求。',
				'Cookieおよびローカルストレージの管理。',
				'メール（phimbop@duck.com）でのお問い合わせおよびサポート要請。'
			]
		},
		section7: {
			title: '7. ポリシーの変更',
			desc: '本ポリシーは定期的に見直され、変更されることがあります。最新版は常に本ページに掲載されます。'
		},
		section8: {
			title: '8. お問い合わせ',
			desc: 'ご不明な点がございましたら、phimbop@duck.com までお気軽にご連絡ください。'
		}
	},
	ko: {
		seoTitle: '개인정보 처리방침 - PhimBop',
		seoDescription: 'PhimBop 개인정보 보호정책',
		title: '개인정보 처리방침',
		lastUpdated: '최종 수정일: 2025년 3월 30일',
		backHome: '← PhimBop 홈으로 돌아가기',
		welcomeIntro: 'PhimBop에 오신 것을 환영합니다! 당사는 사용자의 개인정보를 소중히 여기며 이를 안전하게 보호하기 위해 최선을 다하고 있습니다.',
		section1: {
			title: '1. 수집하는 정보',
			desc: '당사는 다음과 같은 정보를 수집할 수 있습니다:',
			personalInfoLabel: '개인 정보:',
			personalInfoText: '이메일, 사용자명, 비밀번호 (회원가입 시).',
			accessDataLabel: '접속 데이터:',
			accessDataText: 'IP 주소, 브라우저 정보, 기기 유형, 접속 시간, 시청 페이지.',
			cookieLabel: '쿠키 및 저장 기술:',
			cookieText: '사용자 경험 향상, 설정 저장 및 트래픽 분석 목적.'
		},
		section2: {
			title: '2. 정보 이용 목적',
			items: [
				'영상 스트리밍 서비스 및 개인화 기능 제공.',
				'서비스 품질 향상 및 사용자 경험 최적화를 위한 분석.',
				'서비스 악용 및 저작권 침해 방지.',
				'공지사항 및 업데이트 알림 발송 (동의 시).'
			]
		},
		section3: {
			title: '3. 정보의 공유',
			desc: '당사는 개인정보를 판매하지 않으며, 아래의 경우에만 최소한으로 공유됩니다:',
			items: [
				'필수 인프라 파트너 (호스팅 제공업체, 기술 분석 솔루션).',
				'법률상 규정된 의무에 따른 관계 당국의 정당한 요청이 있는 경우.'
			]
		},
		section4: {
			title: '4. 데이터 보안',
			items: [
				'SSL/TLS 네트워크 암호화를 통해 전송 데이터를 안전하게 보호합니다.',
				'무단 접근을 차단하기 위한 기술적 보호 조치를 시행합니다.'
			]
		},
		section5: {
			title: '5. 외부 링크',
			desc: '본 서비스에는 타사 웹사이트로의 링크가 포함될 수 있으며, 해당 사이트의 개인정보 처리에는 책임을 지지 않습니다.'
		},
		section6: {
			title: '6. 이용자의 권리',
			desc: '이용자는 개인정보와 관련하여 다음과 같은 권리를 행사할 수 있습니다:',
			items: [
				'개인정보 열람, 수정 및 삭제 요청.',
				'쿠키 및 로컬 저장소 데이터 관리.',
				'이메일(phimbop@duck.com)을 통한 고객 문의 및 지원 요청.'
			]
		},
		section7: {
			title: '7. 방침의 변경',
			desc: '본 개인정보 처리방침은 수시로 개정될 수 있으며, 개정 사항은 본 페이지를 통해 공지됩니다.'
		},
		section8: {
			title: '8. 문의하기',
			desc: '문의 사항이 있으신 경우 phimbop@duck.com 으로 연락해 주시기 바랍니다.'
		}
	},
	fr: {
		seoTitle: 'Politique de Confidentialité - PhimBop',
		seoDescription: 'Politique de confidentialité et protection des données PhimBop',
		title: 'POLITIQUE DE CONFIDENTIALITÉ',
		lastUpdated: 'Dernière mise à jour : 30 mars 2025',
		backHome: '← Retour à l’accueil PhimBop',
		welcomeIntro: 'Bienvenue sur PhimBop ! Nous nous engageons à protéger vos informations personnelles. Cette politique explique comment nous collectons, utilisons et partageons vos données.',
		section1: {
			title: '1. Informations Collectées',
			desc: 'Nous pouvons collecter les types d’informations suivants :',
			personalInfoLabel: 'Informations personnelles :',
			personalInfoText: 'Adresse e-mail, nom d’utilisateur, mot de passe (en cas d’inscription).',
			accessDataLabel: 'Données d’accès :',
			accessDataText: 'Adresse IP, navigateur, appareil, date/heure d’accès, pages consultées.',
			cookieLabel: 'Cookies & Stockage local :',
			cookieText: 'Pour améliorer l’expérience utilisateur, mémoriser vos préférences et analyser le trafic.'
		},
		section2: {
			title: '2. Finalités de l’Utilisation',
			items: [
				'Fournir les services de visionnage et les fonctionnalités personnalisées.',
				'Analyser et améliorer la qualité et la fluidité de l’application.',
				'Prévenir les abus, fraudes et violations de droits d’auteur.',
				'Envoyer des notifications de mise à jour (si vous avez souscrit).'
			]
		},
		section3: {
			title: '3. Partage d’Informations',
			desc: 'Nous ne vendons pas vos informations personnelles. Les données ne sont partagées qu’avec :',
			items: [
				'Partenaires techniques essentiels (hébergement, outils d’analyse).',
				'Autorités légales compétentes sur demande conforme à la loi.'
			]
		},
		section4: {
			title: '4. Sécurité des Données',
			items: [
				'Chiffrement SSL/TLS de toutes les communications réseau.',
				'Mesures techniques avancées pour empêcher tout accès non autorisé.'
			]
		},
		section5: {
			title: '5. Liens Externes',
			desc: 'L’application peut contenir des liens vers des sites tiers. Nous déclinons toute responsabilité quant à leurs contenus ou politiques.'
		},
		section6: {
			title: '6. Vos Droits',
			desc: 'Vous disposez des droits suivants concernant vos données :',
			items: [
				'Consulter, corriger ou demander la suppression de vos données.',
				'Gérer les cookies et vider le stockage local.',
				'Contacter notre équipe à phimbop@duck.com pour toute assistance.'
			]
		},
		section7: {
			title: '7. Modifications de la Politique',
			desc: 'Nous pouvons mettre à jour cette politique à tout moment. Les révisions seront publiées sur cette page.'
		},
		section8: {
			title: '8. Contact',
			desc: 'Pour toute question, veuillez nous écrire à : phimbop@duck.com.'
		}
	},
	de: {
		seoTitle: 'Datenschutzerklärung - PhimBop',
		seoDescription: 'PhimBop Datenschutzerklärung und Informationssicherheit',
		title: 'DATENSCHUTZERKLÄRUNG',
		lastUpdated: 'Zuletzt aktualisiert: 30. März 2025',
		backHome: '← Zurück zur PhimBop Startseite',
		welcomeIntro: 'Willkommen bei PhimBop! Wir verpflichten uns zum Schutz Ihrer persönlichen Daten. Diese Richtlinie erläutert Erfassung, Nutzung und Weitergabe Ihrer Daten.',
		section1: {
			title: '1. Erfasste Informationen',
			desc: 'Wir erfassen möglicherweise folgende Daten:',
			personalInfoLabel: 'Personenbezogene Daten:',
			personalInfoText: 'E-Mail-Adresse, Benutzername, Passwort (bei Registrierung).',
			accessDataLabel: 'Zugriffsdaten:',
			accessDataText: 'IP-Adresse, Browser, Gerätetyp, Zugriffszeiten, besuchte Seiten.',
			cookieLabel: 'Cookies & Lokaler Speicher:',
			cookieText: 'Zur Optimierung des Nutzungserlebnisses und Verkehrsanalysen.'
		},
		section2: {
			title: '2. Nutzungszwecke',
			items: [
				'Bereitstellung von Streaming-Diensten und Personalisierungsfunktionen.',
				'Analyse und kontinuierliche Qualitätsverbesserung.',
				'Prävention von Missbrauch und Urheberrechtsverletzungen.',
				'Zusendung von Benachrichtigungen bei Einwilligung.'
			]
		},
		section3: {
			title: '3. Weitergabe von Daten',
			desc: 'Wir verkaufen Ihre Daten nicht. Daten werden nur geteilt mit:',
			items: [
				'Wesentlichen Dienstleistern (Hosting, technische Analysen).',
				'Behörden bei gesetzlicher Verpflichtung.'
			]
		},
		section4: {
			title: '4. Datensicherheit',
			items: [
				'Durchgängige SSL/TLS-Verschlüsselung aller Übertragungen.',
				'Sicherheitsvorkehrungen gegen unberechtigten Datenzugriff.'
			]
		},
		section5: {
			title: '5. Externe Links',
			desc: 'Unsere App kann Links zu Drittanbietern enthalten, für deren Inhalte und Datenschutz wir keine Haftung übernehmen.'
		},
		section6: {
			title: '6. Ihre Rechte',
			desc: 'Sie haben folgende Rechte hinsichtlich Ihrer Daten:',
			items: [
				'Auskunft, Berichtigung oder Löschung Ihrer persönlichen Daten.',
				'Verwaltung von Cookies und Bereinigung lokaler Daten.',
				'Kontaktaufnahme über phimbop@duck.com für Supportanfragen.'
			]
		},
		section7: {
			title: '7. Änderungen dieser Richtlinie',
			desc: 'Wir können diese Datenschutzerklärung anpassen. Die aktuelle Version wird hier veröffentlicht.'
		},
		section8: {
			title: '8. Kontakt',
			desc: 'Bei Fragen wenden Sie sich bitte an: phimbop@duck.com.'
		}
	},
	es: {
		seoTitle: 'Política de Privacidad - PhimBop',
		seoDescription: 'Política de privacidad y protección de datos de PhimBop',
		title: 'POLÍTICA DE PRIVACIDAD',
		lastUpdated: 'Última actualización: 30 de marzo de 2025',
		backHome: '← Volver al inicio de PhimBop',
		welcomeIntro: '¡Bienvenido a PhimBop! Estamos comprometidos a proteger su información personal. Esta política explica cómo recopilamos, usamos y compartimos datos.',
		section1: {
			title: '1. Información que Recopilamos',
			desc: 'Podemos recopilar los siguientes tipos de información:',
			personalInfoLabel: 'Información personal:',
			personalInfoText: 'Correo electrónico, usuario, contraseña (si se registra).',
			accessDataLabel: 'Datos de acceso:',
			accessDataText: 'Dirección IP, navegador, dispositivo, hora de acceso, páginas vistas.',
			cookieLabel: 'Cookies y Almacenamiento local:',
			cookieText: 'Para optimizar la experiencia, recordar ajustes y analizar tráfico.'
		},
		section2: {
			title: '2. Fines del Tratamiento',
			items: [
				'Prestar servicios de reproducción multimedia y funciones personalizadas.',
				'Analizar y mejorar el rendimiento de la aplicación.',
				'Prevenir abusos, fraudes e infracciones de derechos de autor.',
				'Enviar notificaciones relevantes si ha dado su consentimiento.'
			]
		},
		section3: {
			title: '3. Compartir Información',
			desc: 'No vendemos su información personal. Los datos solo se comparten con:',
			items: [
				'Proveedores de servicios esenciales (servidores de hosting, analítica técnica).',
				'Autoridades judiciales o administrativas bajo requerimiento legal válido.'
			]
		},
		section4: {
			title: '4. Seguridad de Datos',
			items: [
				'Cifrado SSL/TLS para salvaguardar todas las comunicaciones.',
				'Medidas técnicas de seguridad para evitar accesos no autorizados.'
			]
		},
		section5: {
			title: '5. Enlaces Externos',
			desc: 'Nuestra aplicación puede incluir enlaces a sitios de terceros, sobre cuyos contenidos y políticas no tenemos control.'
		},
		section6: {
			title: '6. Sus Derechos',
			desc: 'Usted tiene derecho a:',
			items: [
				'Acceder, rectificar o solicitar la supresión de sus datos personales.',
				'Gestionar cookies y almacenamiento local.',
				'Ponerse en contacto con soporte en phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Cambios en la Política',
			desc: 'Podemos actualizar esta política periódicamente. Las modificaciones se publicarán en esta misma página.'
		},
		section8: {
			title: '8. Contacto',
			desc: 'Para cualquier consulta, escríbanos a: phimbop@duck.com.'
		}
	},
	ru: {
		seoTitle: 'Политика конфиденциальности - PhimBop',
		seoDescription: 'Политика конфиденциальности и защита данных PhimBop',
		title: 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
		lastUpdated: 'Последнее обновление: 30 марта 2025 г.',
		backHome: '← На главную PhimBop',
		welcomeIntro: 'Добро пожаловать в PhimBop! Мы бережно относимся к защите персональных данных пользователей. В этом документе описано, как мы обрабатываем информацию.',
		section1: {
			title: '1. Собираемая информация',
			desc: 'Мы можем собирать следующие данные:',
			personalInfoLabel: 'Личная информация:',
			personalInfoText: 'Email, логин, пароль (при регистрации аккаунта).',
			accessDataLabel: 'Данные доступа:',
			accessDataText: 'IP-адрес, тип браузера, устройство, время визита, просмотренные страницы.',
			cookieLabel: 'Cookie и локальное хранилище:',
			cookieText: 'Для сохранения настроек, улучшения сервиса и аналитики посещаемости.'
		},
		section2: {
			title: '2. Цели использования',
			items: [
				'Предоставление сервиса воспроизведения видео и персонализации.',
				'Анализ и повышение качества работы приложения.',
				'Предотвращение нарушений правил сервиса и авторских прав.',
				'Отправка системных уведомлений (при согласии).'
			]
		},
		section3: {
			title: '3. Передача данных',
			desc: 'Мы не продаем ваши персональные данные. Передача возможна исключительно:',
			items: [
				'Техническим партнерам (хостинг-провайдеры, системы аналитики).',
				'Органам государственной власти по законному официальному запросу.'
			]
		},
		section4: {
			title: '4. Безопасность данных',
			items: [
				'Использование шифрования SSL/TLS для всех сетевых передач.',
				'Комплексные меры защиты от несанкционированного доступа.'
			]
		},
		section5: {
			title: '5. Сторонние ссылки',
			desc: 'Сервис может содержать ссылки на внешние сайты. Мы не несем ответственности за их содержание и политику конфиденциальности.'
		},
		section6: {
			title: '6. Права пользователя',
			desc: 'Вы имеете право:',
			items: [
				'Запрашивать доступ, изменение или удаление своих персональных данных.',
				'Управлять файлами cookie и очищать локальное хранилище.',
				'Обращаться в службу поддержки по адресу phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Изменения политики',
			desc: 'Мы оставляем за собой право обновлять этот документ. Актуальная редакция публикуется на этой странице.'
		},
		section8: {
			title: '8. Контакты',
			desc: 'По любым вопросам пишите нам на email: phimbop@duck.com.'
		}
	},
	id: {
		seoTitle: 'Kebijakan Privasi - PhimBop',
		seoDescription: 'Kebijakan Privasi dan Perlindungan Data PhimBop',
		title: 'KEBIJAKAN PRIVASI',
		lastUpdated: 'Terakhir diperbarui: 30 Maret 2025',
		backHome: '← Kembali ke Beranda PhimBop',
		welcomeIntro: 'Selamat datang di PhimBop! Kami berkomitmen melindungi data pribadi pengguna kami. Kebijakan ini menjelaskan cara kami mengumpulkan, menggunakan, dan membagikan informasi Anda.',
		section1: {
			title: '1. Informasi yang Dikumpulkan',
			desc: 'Kami dapat mengumpulkan data berikut:',
			personalInfoLabel: 'Informasi Pribadi:',
			personalInfoText: 'Email, nama pengguna, kata sandi (jika membuat akun).',
			accessDataLabel: 'Data Akses:',
			accessDataText: 'Alamat IP, peramban, perangkat, waktu akses, halaman yang dilihat.',
			cookieLabel: 'Cookie & Penyimpanan Lokal:',
			cookieText: 'Untuk meningkatkan kenyamanan, menyimpan preferensi, dan analitik lalu lintas.'
		},
		section2: {
			title: '2. Tujuan Penggunaan',
			items: [
				'Menyediakan layanan pemutaran film dan fitur personalisasi.',
				'Menganalisis dan meningkatkan performa aplikasi.',
				'Mencegah penyalahgunaan dan pelanggaran hak cipta.',
				'Mengirimkan pemberitahuan pembaruan (jika berlangganan).'
			]
		},
		section3: {
			title: '3. Pembagian Informasi',
			desc: 'Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada:',
			items: [
				'Mitra layanan penting (penyedia hosting, analitik teknis).',
				'Pihak penegak hukum atas dasar kewajiban hukum yang sah.'
			]
		},
		section4: {
			title: '4. Keamanan Data',
			items: [
				'Enkripsi SSL/TLS menyeluruh untuk semua transmisi jaringan.',
				'Langkah-langkah teknis ketat untuk mencegah akses tanpa izin.'
			]
		},
		section5: {
			title: '5. Tautan Pihak Ketiga',
			desc: 'Aplikasi dapat berisi tautan luar. Kami tidak bertanggung jawab atas isi maupun kebijakan privasi layanan pihak ketiga.'
		},
		section6: {
			title: '6. Hak Pengguna',
			desc: 'Anda memiliki hak untuk:',
			items: [
				'Mengakses, memperbarui, atau meminta penghapusan data pribadi Anda.',
				'Mengelola cookie dan membersihkan penyimpanan lokal aplikasi.',
				'Menghubungi tim kami melalui phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Perubahan Kebijakan',
			desc: 'Kami dapat memperbarui kebijakan ini sewaktu-waktu. Versi terbaru akan ditampilkan di halaman ini.'
		},
		section8: {
			title: '8. Hubungi Kami',
			desc: 'Pertanyaan dapat dikirimkan ke: phimbop@duck.com.'
		}
	},
	tr: {
		seoTitle: 'Gizlilik Politikası - PhimBop',
		seoDescription: 'PhimBop Gizlilik Politikası ve Veri Güvenliği',
		title: 'GİZLİLİK POLİTİKASI',
		lastUpdated: 'Son güncelleme: 30 Mart 2025',
		backHome: '← PhimBop Ana Sayfasına Dön',
		welcomeIntro: 'PhimBop’a hoş geldiniz! Kişisel verilerinizi korumayı taahhüt ediyoruz. Bu politika, bilgilerinizin nasıl toplandığını, kullanıldığını ve paylaşıldığını açıklar.',
		section1: {
			title: '1. Toplanan Bilgiler',
			desc: 'Aşağıdaki bilgileri toplayabiliriz:',
			personalInfoLabel: 'Kişisel Bilgiler:',
			personalInfoText: 'E-posta, kullanıcı adı, şifre (hesap açıldığında).',
			accessDataLabel: 'Erişim Verileri:',
			accessDataText: 'IP adresi, tarayıcı, cihaz, erişim zamanı, görüntülenen sayfalar.',
			cookieLabel: 'Çerezler ve Yerel Depolama:',
			cookieText: 'Kullanıcı deneyimini geliştirmek, tercihleri hatırlamak ve analiz yapmak için.'
		},
		section2: {
			title: '2. Kullanım Amaçları',
			items: [
				'Medya akış hizmetleri ve kişiselleştirilmiş özellikler sunmak.',
				'Uygulama kalitesini ve hızını analiz edip geliştirmek.',
				'Kötüye kullanımı ve telif hakkı ihlallerini engellemek.',
				'Gerekli bildirimleri iletmek (izin verildiğinde).'
			]
		},
		section3: {
			title: '3. Bilgi Paylaşımı',
			desc: 'Kişisel bilgilerinizi satmıyoruz. Veriler yalnızca şu taraflarla paylaşılabilir:',
			items: [
				'Zorunlu hizmet ortakları (sunucu barındırma, teknik analiz servisleri).',
				'Yasal zorunluluk halinde yetkili adli veya idari merciler.'
			]
		},
		section4: {
			title: '4. Veri Güvenliği',
			items: [
				'Ağ üzerindeki tüm veri iletimi için SSL/TLS şifrelemesi kullanılır.',
				'Yetkisiz erişimi engellemek için teknik güvenlik tedbirleri alınır.'
			]
		},
		section5: {
			title: '5. Harici Bağlantılar',
			desc: 'Uygulama üçüncü taraf bağlantıları içerebilir. Bu sitelerin içerik veya gizlilik politikalarından sorumlu değiliz.'
		},
		section6: {
			title: '6. Kullanıcı Hakları',
			desc: 'Kullanıcı olarak şu haklara sahipsiniz:',
			items: [
				'Kişisel verilerinize erişme, düzeltme veya silinmesini talep etme.',
				'Çerezleri ve yerel verileri yönetme.',
				'phimbop@duck.com üzerinden destek ekibimizle iletişime geçme.'
			]
		},
		section7: {
			title: '7. Politika Değişiklikleri',
			desc: 'Bu politikayı zaman zaman güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayımlanır.'
		},
		section8: {
			title: '8. İletişim',
			desc: 'Sorularınız için: phimbop@duck.com.'
		}
	},
	it: {
		seoTitle: 'Informativa sulla Privacy - PhimBop',
		seoDescription: 'Informativa sulla privacy e protezione dati di PhimBop',
		title: 'INFORMATIVA SULLA PRIVACY',
		lastUpdated: 'Ultimo aggiornamento: 30 marzo 2025',
		backHome: '← Torna alla Home di PhimBop',
		welcomeIntro: 'Benvenuto su PhimBop! Ci impegniamo a proteggere i tuoi dati personali. Questa informativa descrive come raccogliamo, utilizziamo e proteggiamo i tuoi dati.',
		section1: {
			title: '1. Informazioni Raccolte',
			desc: 'Possiamo raccogliere le seguenti categorie di dati:',
			personalInfoLabel: 'Dati personali:',
			personalInfoText: 'Email, nome utente, password (se registri un account).',
			accessDataLabel: 'Dati di navigazione:',
			accessDataText: 'Indirizzo IP, browser, dispositivo, orari di accesso, pagine visitate.',
			cookieLabel: 'Cookie & Archiviazione locale:',
			cookieText: 'Per migliorare la navigazione, memorizzare le preferenze e analizzare il traffico.'
		},
		section2: {
			title: '2. Finalità del Trattamento',
			items: [
				'Fornire servizi di riproduzione video e funzionalità personalizzate.',
				'Analizzare e migliorare le prestazioni e l’usabilità dell’applicazione.',
				'Prevenire abusi, frodi e violazioni del copyright.',
				'Inviare notifiche di aggiornamento (se acconsentito).'
			]
		},
		section3: {
			title: '3. Condivisione dei Dati',
			desc: 'Non vendiamo i tuoi dati personali. La condivisione avviene esclusivamente con:',
			items: [
				'Fornitori di servizi essenziali (hosting, manutenzione, analisi tecnica).',
				'Autorità giudiziarie o di pubblica sicurezza nei casi previsti dalla legge.'
			]
		},
		section4: {
			title: '4. Sicurezza dei Dati',
			items: [
				'Crittografia SSL/TLS attiva su tutte le connessioni di rete.',
				'Misure tecniche rigorose per impedire accessi non autorizzati.'
			]
		},
		section5: {
			title: '5. Link a Terze Parti',
			desc: 'L’applicazione può contenere collegamenti a siti esterni. Non siamo responsabili dei loro contenuti o delle loro politiche di privacy.'
		},
		section6: {
			title: '6. Diritti dell’Utente',
			desc: 'Hai il diritto di:',
			items: [
				'Accedere, rettificare o cancellare i tuoi dati personali.',
				'Gestire cookie e cancellare i dati memorizzati localmente.',
				'Contattarci in qualunque momento all’indirizzo phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Modifiche all’Informativa',
			desc: 'Ci riserviamo il diritto di aggiornare periodicamente questa informativa. La versione aggiornata sarà sempre disponibile su questa pagina.'
		},
		section8: {
			title: '8. Contatti',
			desc: 'Per qualsiasi richiesta o chiarimento, scrivi a: phimbop@duck.com.'
		}
	},
	pt: {
		seoTitle: 'Política de Privacidade - PhimBop',
		seoDescription: 'Política de privacidade e proteção de dados PhimBop',
		title: 'POLÍTICA DE PRIVACIDADE',
		lastUpdated: 'Última atualização: 30 de março de 2025',
		backHome: '← Voltar à página inicial do PhimBop',
		welcomeIntro: 'Bem-vindo ao PhimBop! Estamos empenhados em proteger os seus dados pessoais. Esta política explica como recolhemos, usamos e partilhamos as suas informações.',
		section1: {
			title: '1. Informações Recolhidas',
			desc: 'Podemos recolher os seguintes tipos de informações:',
			personalInfoLabel: 'Informações pessoais:',
			personalInfoText: 'Email, nome de utilizador, palavra-passe (ao registar uma conta).',
			accessDataLabel: 'Dados de acesso:',
			accessDataText: 'Endereço IP, navegador, dispositivo, horário de acesso, páginas visitadas.',
			cookieLabel: 'Cookies e Armazenamento local:',
			cookieText: 'Para aprimorar a experiência, gravar preferências e analisar o tráfego.'
		},
		section2: {
			title: '2. Finalidades de Utilização',
			items: [
				'Fornecer serviços de reprodução de vídeo e funcionalidades personalizadas.',
				'Analisar e melhorar a estabilidade e qualidade da aplicação.',
				'Prevenir comportamentos abusivos ou infrações de direitos de autor.',
				'Enviar notificações de atualizações (quando autorizado).'
			]
		},
		section3: {
			title: '3. Partilha de Informações',
			desc: 'Não vendemos os seus dados pessoais. As informações só podem ser partilhadas com:',
			items: [
				'Parceiros de serviços fundamentais (alojamento em nuvem, análise técnica).',
				'Autoridades legais perante obrigações jurídicas aplicáveis.'
			]
		},
		section4: {
			title: '4. Segurança dos Dados',
			items: [
				'Criptografia SSL/TLS para garantir a segurança no tráfego de dados.',
				'Medidas técnicas de proteção contra acessos não autorizados.'
			]
		},
		section5: {
			title: '5. Ligações Externas',
			desc: 'A nossa aplicação pode conter links externos. Não nos responsabilizamos pelo conteúdo ou políticas de privacidade de terceiros.'
		},
		section6: {
			title: '6. Direitos do Utilizador',
			desc: 'Tem o direito de:',
			items: [
				'Aceder, corrigir ou solicitar a eliminação dos seus dados.',
				'Gerir cookies e limpar o armazenamento local.',
				'Entrar em contacto com o suporte através de phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Alterações à Política',
			desc: 'Podemos atualizar esta política periodicamente. A versão mais recente será sempre publicada nesta página.'
		},
		section8: {
			title: '8. Contacto',
			desc: 'Dúvidas podem ser enviadas para: phimbop@duck.com.'
		}
	},
	hi: {
		seoTitle: 'गोपनीयता नीति - PhimBop',
		seoDescription: 'PhimBop गोपनीयता नीति और डेटा सुरक्षा',
		title: 'गोपनीयता नीति',
		lastUpdated: 'अंतिम अपडेट: 30 मार्च 2025',
		backHome: '← PhimBop होम पर वापस जाएं',
		welcomeIntro: 'PhimBop में आपका स्वागत है! हम आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए प्रतिबद्ध हैं। यह नीति बताती है कि जब आप हमारी सेवाओं का उपयोग करते हैं तो हम आपकी जानकारी कैसे एकत्र, उपयोग और साझा करते हैं।',
		section1: {
			title: '1. एकत्र की जाने वाली जानकारी',
			desc: 'हम निम्नलिखित प्रकार की जानकारी एकत्र कर सकते हैं:',
			personalInfoLabel: 'व्यक्तिगत जानकारी:',
			personalInfoText: 'ईमेल, उपयोगकर्ता नाम, पासवर्ड (खाता बनाते समय)।',
			accessDataLabel: 'एक्सेस डेटा:',
			accessDataText: 'आईपी पता, ब्राउज़र, डिवाइस, विज़िट का समय, देखे गए पृष्ठ।',
			cookieLabel: 'कुकीज़ और स्थानीय भंडारण:',
			cookieText: 'उपयोगकर्ता अनुभव को बेहतर बनाने और प्राथमिकताओं को सहेजने के लिए।'
		},
		section2: {
			title: '2. उपयोग के उद्देश्य',
			items: [
				'स्ट्रीमिंग वीडियो सेवा और वैयक्तिकृत सुविधाएं प्रदान करना।',
				'ऐप के प्रदर्शन और अनुभव का विश्लेषण और सुधार करना।',
				'दुरुपयोग और कॉपीराइट उल्लंघन को रोकना।',
				'आवश्यक अपडेट और सूचनाएं भेजना।'
			]
		},
		section3: {
			title: '3. जानकारी साझा करना',
			desc: 'हम आपकी व्यक्तिगत जानकारी नहीं बेचते हैं। डेटा केवल इनके साथ साझा किया जा सकता है:',
			items: [
				'आवश्यक सेवा भागीदार (होस्टिंग और तकनीकी विश्लेषिकी प्रदाता)।',
				'कानूनी रूप से अनिवार्य होने पर कानून प्रवर्तन एजेंसियां।'
			]
		},
		section4: {
			title: '4. डेटा सुरक्षा',
			items: [
				'सभी नेटवर्क डेटा के लिए SSL/TLS एन्क्रिप्शन का उपयोग।',
				'अनधिकृत पहुंच को रोकने के लिए तकनीकी सुरक्षा उपाय।'
			]
		},
		section5: {
			title: '5. बाहरी लिंक',
			desc: 'ऐप में तीसरे पक्ष के लिंक हो सकते हैं। हम उनकी सामग्री या नीतियों के लिए ज़िम्मेदार नहीं हैं।'
		},
		section6: {
			title: '6. उपयोगकर्ता के अधिकार',
			desc: 'आपको निम्नलिखित अधिकार प्राप्त हैं:',
			items: [
				'अपने व्यक्तिगत डेटा को देखने, सुधारने या हटाने का अनुरोध करना।',
				'कुकीज़ और स्थानीय डेटा का प्रबंधन करना।',
				'सहायता के लिए phimbop@duck.com पर संपर्क करना।'
			]
		},
		section7: {
			title: '7. नीति में परिवर्तन',
			desc: 'हम समय-समय पर इस नीति को अपडेट कर सकते हैं। नया संस्करण इसी पृष्ठ पर उपलब्ध होगा।'
		},
		section8: {
			title: '8. संपर्क करें',
			desc: 'किसी भी प्रश्न के लिए phimbop@duck.com पर ईमेल करें।'
		}
	},
	pl: {
		seoTitle: 'Polityka Prywatności - PhimBop',
		seoDescription: 'Polityka prywatności i ochrona danych PhimBop',
		title: 'POLITYKA PRYWATNOŚCI',
		lastUpdated: 'Ostatnia aktualizacja: 30 marca 2025',
		backHome: '← Powrót do strony głównej PhimBop',
		welcomeIntro: 'Witamy w PhimBop! Dbamy o ochronę Twoich danych osobowych. Niniejsza polityka wyjaśnia, jak zbieramy, wykorzystujemy i chronimy Twoje informacje.',
		section1: {
			title: '1. Zbierane Informacje',
			desc: 'Możemy zbierać następujące rodzaje danych:',
			personalInfoLabel: 'Dane osobowe:',
			personalInfoText: 'Adres e-mail, nazwa użytkownika, hasło (w przypadku rejestracji).',
			accessDataLabel: 'Dane dostępowe:',
			accessDataText: 'Adres IP, przeglądarka, urządzenie, czas wizyty, przeglądane strony.',
			cookieLabel: 'Pliki cookie i pamięć lokalna:',
			cookieText: 'W celu zapewnienia wygody użytkowania, zapisywania preferencji i analityki.'
		},
		section2: {
			title: '2. Cel Przetwarzania',
			items: [
				'Świadczenie usług odtwarzania wideo i funkcji personalizacji.',
				'Analiza i ulepszanie działania aplikacji.',
				'Zapobieganie nadużyciom i naruszeniom praw autorskich.',
				'Wysyłanie powiadomień systemowych (po wyrażeniu zgody).'
			]
		},
		section3: {
			title: '3. Udostępnianie Danych',
			desc: 'Nie sprzedajemy Twoich danych osobowych. Dane mogą być udostępniane wyłącznie:',
			items: [
				'Niezbędnym partnerom technicznym (hosting, analityka serwerowa).',
				'Organom państwowym na podstawie wiążących przepisów prawa.'
			]
		},
		section4: {
			title: '4. Bezpieczeństwo Danych',
			items: [
				'Szyfrowanie SSL/TLS dla całej transmisji danych w sieci.',
				'Środki techniczne zapobiegające nieuprawnionemu dostępowi.'
			]
		},
		section5: {
			title: '5. Linki Zewnętrzne',
			desc: 'Aplikacja może zawierać odnośniki do serwisów zewnętrznych, za których politykę prywatności nie ponosimy odpowiedzialności.'
		},
		section6: {
			title: '6. Prawa Użytkownika',
			desc: 'Przysługuje Ci prawo do:',
			items: [
				'Dostępu, poprawiania lub żądania usunięcia swoich danych.',
				'Zarządzania plikami cookie i czyszczenia pamięci lokalnej.',
				'Kontaktu z pomocą techniczną pod adresem phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Zmiany w Polityce',
			desc: 'Możemy okresowo aktualizować niniejszą politykę. Aktualna wersja jest zawsze publikowana na tej stronie.'
		},
		section8: {
			title: '8. Kontakt',
			desc: 'W razie pytań napisz do nas: phimbop@duck.com.'
		}
	},
	nl: {
		seoTitle: 'Privacybeleid - PhimBop',
		seoDescription: 'PhimBop Privacybeleid en Gegevensbescherming',
		title: 'PRIVACYBELEID',
		lastUpdated: 'Laatst bijgewerkt: 30 maart 2025',
		backHome: '← Terug naar PhimBop Home',
		welcomeIntro: 'Welkom bij PhimBop! Wij hechten veel waarde aan de bescherming van uw persoonlijke gegevens. Dit privacybeleid legt uit hoe wij gegevens verzamelen en gebruiken.',
		section1: {
			title: '1. Verzamelde Informatie',
			desc: 'Wij kunnen de volgende gegevens verzamelen:',
			personalInfoLabel: 'Persoonsgegevens:',
			personalInfoText: 'E-mailadres, gebruikersnaam, wachtwoord (bij registratie).',
			accessDataLabel: 'Toegangsgegevens:',
			accessDataText: 'IP-adres, browsertype, apparaat, toegangstijden, bekeken pagina’s.',
			cookieLabel: 'Cookies & Lokale Opslag:',
			cookieText: 'Om de gebruikerservaring te verbeteren, voorkeuren te bewaren en analyses uit te voeren.'
		},
		section2: {
			title: '2. Doeleinden van Verwerking',
			items: [
				'Bieden van videoweergavediensten en gepersonaliseerde functies.',
				'Analyseren en optimaliseren van de app-prestaties.',
				'Voorkomen van misbruik en inbreuk op auteursrechten.',
				'Verzenden van updates en meldingen (indien toegestaan).'
			]
		},
		section3: {
			title: '3. Gegevens Delen',
			desc: 'Wij verkopen uw gegevens niet. Gegevens worden uitsluitend gedeeld met:',
			items: [
				'Essentiële technische partners (hostingproviders, analyseplatformen).',
				'Wettelijke autoriteiten wanneer daartoe een wettelijke verplichting bestaat.'
			]
		},
		section4: {
			title: '4. Gegevensbeveiliging',
			items: [
				'Gebruik van SSL/TLS-versleuteling voor alle netwerkverbindingen.',
				'Beveiligingsmaatregelen om ongeautoriseerde toegang te voorkomen.'
			]
		},
		section5: {
			title: '5. Externe Links',
			desc: 'De app kan koppelingen naar externe websites bevatten. Wij zijn niet verantwoordelijk voor hun inhoud of privacybeleid.'
		},
		section6: {
			title: '6. Uw Rechten',
			desc: 'U hebt het recht om:',
			items: [
				'Uw persoonsgegevens in te zien, te corrigeren of te laten verwijderen.',
				'Cookies en lokale opslag te beheren.',
				'Contact op te nemen via phimbop@duck.com voor assistentie.'
			]
		},
		section7: {
			title: '7. Wijzigingen in het Beleid',
			desc: 'Wij kunnen dit beleid periodiek aanpassen. De meest recente versie staat altijd op deze pagina.'
		},
		section8: {
			title: '8. Contact',
			desc: 'Vragen kunt u sturen naar: phimbop@duck.com.'
		}
	},
	be: {
		seoTitle: 'Палітыка прыватнасці - PhimBop',
		seoDescription: 'Палітыка прыватнасці і ахова даных PhimBop',
		title: 'ПАЛІТЫКА ПРЫВАТНАСЦІ',
		lastUpdated: 'Апошняе абнаўленне: 30 сакавіка 2025 г.',
		backHome: '← На галоўную PhimBop',
		welcomeIntro: 'Сардэчна запрашаем у PhimBop! Мы імкнемся надзейна абараняць вашы персанальныя даныя. Гэтая палітыка тлумачыць, як мы збіраем і выкарыстоўваем інфармацыю.',
		section1: {
			title: '1. Інфармацыя, якую мы збіраем',
			desc: 'Мы можам збіраць наступныя даныя:',
			personalInfoLabel: 'Асабістыя звесткі:',
			personalInfoText: 'Электронная пошта, імя карыстальніка, пароль (пры рэгістрацыі).',
			accessDataLabel: 'Даныя доступу:',
			accessDataText: 'IP-адрас, браўзер, прылада, час візіту, прагледжаныя старонкі.',
			cookieLabel: 'Cookie і лакальнае сховішча:',
			cookieText: 'Для захавання налад, паляпшэння сэрвісу і аналітыкі.'
		},
		section2: {
			title: '2. Мэты выкарыстання',
			items: [
				'Прадастаўленне сэрвісу прагляду відэа і персаналізаваных функцый.',
				'Аналіз і павышэнне якасці працы прыкладання.',
				'Прадухіленне парушэнняў правілаў і аўтарскіх правоў.',
				'Адпраўка сістэмных апавяшчэнняў (па згодзе).'
			]
		},
		section3: {
			title: '3. Перадача даных',
			desc: 'Мы не прадаем вашы асабістыя даныя. Перадача магчымая толькі:',
			items: [
				'Тэхнічным партнёрам (хостынг, тэхнічная аналітыка).',
				'Дзяржаўным органам па афіцыйным законным патрабаванні.'
			]
		},
		section4: {
			title: '4. Бяспека даных',
			items: [
				'Выкарыстанне SSL/TLS шыфравання для ўсіх сеткавых злучэнняў.',
				'Тэхнічныя меры па прадухіленні несанкцыянаванага доступу.'
			]
		},
		section5: {
			title: '5. Вонкавыя спасылкі',
			desc: 'Прыкладанне можа ўтрымліваць спасылкі на іншыя рэсурсы, за змесціва якіх мы не нясем адказнасці.'
		},
		section6: {
			title: '6. Правы карыстальніка',
			desc: 'Вы маеце права:',
			items: [
				'Запытваць доступ, выпраўленне або выдаленне сваіх звестак.',
				'Кіраваць файламі cookie і ачышчаць лакальнае сховішча.',
				'Звяртацца па дапамогу па адрасе phimbop@duck.com.'
			]
		},
		section7: {
			title: '7. Змены ў палітыцы',
			desc: 'Мы можам перыядычна абнаўляць гэтую палітыку. Актуальная версія заўсёды публікуецца тут.'
		},
		section8: {
			title: '8. Кантакты',
			desc: 'Па ўсіх пытаннях пішыце нам: phimbop@duck.com.'
		}
	}
};

export function getPrivacyContent(locale: string): PrivacyPolicyContent {
	return privacyTranslations[locale] || privacyTranslations['en'] || privacyTranslations['vi'];
}
